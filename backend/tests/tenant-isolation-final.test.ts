import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import { createActiveSubscription, createBusiness, createPlan, createService, registerAndLogin, request } from "./helpers.js";

describe("Tenant isolation", () => {
  it("blocks another user from a business resource", async () => {
    const owner = await registerAndLogin("owner@example.com", "ADMIN");
    const outsider = await registerAndLogin("outsider@example.com", "ADMIN");
    const business = await createBusiness(owner.accessToken);
    const response = await request(`/api/v1/businesses/${business.id}`, { headers: { authorization: `Bearer ${outsider.accessToken}` } });
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("BUSINESS_NOT_FOUND");
  });

  it("blocks another admin from mutating services in a tenant", async () => {
    const owner = await registerAndLogin("owner@example.com", "ADMIN");
    const outsider = await registerAndLogin("outsider@example.com", "ADMIN");
    const business = await createBusiness(owner.accessToken);
    const response = await request(`/api/v1/businesses/${business.id}/services`, { method: "POST", headers: { authorization: `Bearer ${outsider.accessToken}` }, body: JSON.stringify({ name: "Nope" }) });
    expect(response.status).toBe(403);
  });

  it("prevents cross-customer access to customer billing records", async () => {
    const admin = await registerAndLogin("admin@example.com", "ADMIN");
    const customerA = await registerAndLogin("a@example.com", "CUSTOMER");
    const customerB = await registerAndLogin("b@example.com", "CUSTOMER");
    const business = await createBusiness(admin.accessToken);
    const service = await createService(admin.accessToken, business.id);
    const plan = await createPlan(admin.accessToken, business.id, service.id);
    const a = await createActiveSubscription(customerA.accessToken, business.id, plan.id);
    const b = await createActiveSubscription(customerB.accessToken, business.id, plan.id);

    expect((await request(`/api/v1/subscriptions/${b.subscription.id}`, { headers: { authorization: `Bearer ${customerA.accessToken}` } })).status).toBe(404);
    expect((await request(`/api/v1/invoices/${b.invoice.id}`, { headers: { authorization: `Bearer ${customerA.accessToken}` } })).status).toBe(404);

    await prisma.creditLedger.create({ data: { customerProfileId: b.subscription.customerProfileId, amount: 100, currency: "INR", type: "CREDIT", description: "private" } });
    const credits = await request("/api/v1/credits", { headers: { authorization: `Bearer ${customerA.accessToken}` } });
    expect((await credits.json()).data).toEqual({ INR: 0, USD: 0 });
    expect(a.subscription.customerProfileId).not.toBe(b.subscription.customerProfileId);
  });
});
