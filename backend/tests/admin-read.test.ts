import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import { createActiveSubscription, createBusiness, createPlan, createService, registerAndLogin, request } from "./helpers.js";

describe("Admin business-wide read APIs", () => {
  it("allows a business admin to read business-wide billing data", async () => {
    const auth = await registerAndLogin(`admin-${crypto.randomUUID()}@example.com`);
    const business = await createBusiness(auth.accessToken);
    const service = await createService(auth.accessToken, business.id);
    const plan = await createPlan(auth.accessToken, business.id, service.id);
    const active = await createActiveSubscription(auth.accessToken, business.id, plan.id);

    const endpoints = [
      `/api/v1/businesses/${business.id}/admin/customers`,
      `/api/v1/businesses/${business.id}/admin/subscriptions`,
      `/api/v1/businesses/${business.id}/admin/invoices`,
      `/api/v1/businesses/${business.id}/admin/payments`,
      `/api/v1/businesses/${business.id}/admin/billing-activity`,
    ];

    for (const endpoint of endpoints) {
      const response = await request(endpoint, {
        headers: { authorization: `Bearer ${auth.accessToken}` },
      });

      expect(response.status).toBe(200);
      expect((await response.json()).success).toBe(true);
    }

    const customer = await prisma.customerProfile.findUniqueOrThrow({
      where: { id: active.subscription.customerProfileId },
    });

    const customerResponse = await request(
      `/api/v1/businesses/${business.id}/admin/customers/${customer.id}`,
      { headers: { authorization: `Bearer ${auth.accessToken}` } }
    );

    expect(customerResponse.status).toBe(200);
  });

  it("prevents a non-admin from reading another business's admin data", async () => {
    const owner = await registerAndLogin(`owner-${crypto.randomUUID()}@example.com`);
    const outsider = await registerAndLogin(`outsider-${crypto.randomUUID()}@example.com`);
    const business = await createBusiness(owner.accessToken);

    const response = await request(
      `/api/v1/businesses/${business.id}/admin/customers`,
      { headers: { authorization: `Bearer ${outsider.accessToken}` } }
    );

    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe("BUSINESS_ACCESS_DENIED");
  });

  it("prevents an admin from reading another tenant's records through the admin routes", async () => {
    const adminA = await registerAndLogin(`admin-a-${crypto.randomUUID()}@example.com`);
    const adminB = await registerAndLogin(`admin-b-${crypto.randomUUID()}@example.com`);

    const businessA = await createBusiness(adminA.accessToken);
    const businessB = await createBusiness(adminB.accessToken);

    const serviceB = await createService(adminB.accessToken, businessB.id);
    const planB = await createPlan(adminB.accessToken, businessB.id, serviceB.id);
    await createActiveSubscription(adminB.accessToken, businessB.id, planB.id);

    const response = await request(
      `/api/v1/businesses/${businessB.id}/admin/customers`,
      { headers: { authorization: `Bearer ${adminA.accessToken}` } }
    );

    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe("BUSINESS_ACCESS_DENIED");

    expect(businessA.id).not.toBe(businessB.id);
  });
});