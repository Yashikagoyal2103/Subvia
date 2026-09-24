import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import { createActiveSubscription, createBusiness, createPlan, createService, registerAndLogin, request } from "./helpers.js";

describe("Customer portal APIs", () => {
  async function fixture() {
    const admin = await registerAndLogin("admin@example.com", "ADMIN");
    const customer = await registerAndLogin("customer@example.com", "CUSTOMER");
    const otherCustomer = await registerAndLogin("other@example.com", "CUSTOMER");
    const business = await createBusiness(admin.accessToken);
    const service = await createService(admin.accessToken, business.id);
    const plan = await createPlan(admin.accessToken, business.id, service.id);
    return { admin, customer, otherCustomer, business, service, plan };
  }

  it("creates a subscription from planId without trusting a businessId and creates the customer profile", async () => {
    const { customer, business, plan } = await fixture();
    const response = await request("/api/v1/subscriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${customer.accessToken}`, "Idempotency-Key": "customer-checkout-1" },
      body: JSON.stringify({ planId: plan.id, currency: "INR" }),
    });
    expect(response.status).toBe(201);
    const data = (await response.json()).data;
    expect(data.subscription.customerProfileId).toBeTruthy();
    expect(data.invoice.subscriptionId).toBe(data.subscription.id);
    expect(await prisma.customerProfile.findUnique({ where: { userId_businessId: { userId: customer.userId, businessId: business.id } } })).not.toBeNull();
  });

  it("rejects checkout when the plan currency does not match", async () => {
    const { customer, plan } = await fixture();
    const response = await request("/api/v1/subscriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${customer.accessToken}`, "Idempotency-Key": "currency-mismatch" },
      body: JSON.stringify({ planId: plan.id, currency: "USD" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("CURRENCY_NOT_SUPPORTED");
  });

  it("rejects checkout for an inactive plan", async () => {
    const { customer, plan } = await fixture();
    await prisma.plan.update({ where: { id: plan.id }, data: { isActive: false } });
    const response = await request("/api/v1/subscriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${customer.accessToken}`, "Idempotency-Key": "inactive-plan" },
      body: JSON.stringify({ planId: plan.id, currency: "INR" }),
    });
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("PLAN_NOT_FOUND");
  });

  it("requires Idempotency-Key for customer checkout", async () => {
    const { customer, plan } = await fixture();
    const response = await request("/api/v1/subscriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${customer.accessToken}` },
      body: JSON.stringify({ planId: plan.id, currency: "INR" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("IDEMPOTENCY_KEY_REQUIRED");
  });

  it("returns only the authenticated customer's subscriptions and invoices", async () => {
    const { customer, otherCustomer, business, plan } = await fixture();
    const own = await createActiveSubscription(customer.accessToken, business.id, plan.id);
    const other = await createActiveSubscription(otherCustomer.accessToken, business.id, plan.id);

    const subscriptions = await request("/api/v1/subscriptions", { headers: { authorization: `Bearer ${customer.accessToken}` } });
    expect((await subscriptions.json()).data.map((x: any) => x.id)).toContain(own.subscription.id);
    const subBody = await request(`/api/v1/subscriptions/${other.subscription.id}`, { headers: { authorization: `Bearer ${customer.accessToken}` } });
    expect(subBody.status).toBe(404);

    const invoices = await request("/api/v1/invoices", { headers: { authorization: `Bearer ${customer.accessToken}` } });
    expect((await invoices.json()).data.map((x: any) => x.id)).toContain(own.invoice.id);
    const otherInvoice = await request(`/api/v1/invoices/${other.invoice.id}`, { headers: { authorization: `Bearer ${customer.accessToken}` } });
    expect(otherInvoice.status).toBe(404);
  });

  it("returns subscription events only for the owning customer", async () => {
    const { customer, otherCustomer, business, plan } = await fixture();
    const own = await createActiveSubscription(customer.accessToken, business.id, plan.id);
    const other = await createActiveSubscription(otherCustomer.accessToken, business.id, plan.id);
    const events = await request(`/api/v1/subscriptions/${own.subscription.id}/events`, { headers: { authorization: `Bearer ${customer.accessToken}` } });
    expect(events.status).toBe(200);
    expect((await events.json()).data.length).toBeGreaterThan(0);
    expect((await request(`/api/v1/subscriptions/${other.subscription.id}/events`, { headers: { authorization: `Bearer ${customer.accessToken}` } })).status).toBe(404);
  });

  it("returns customer credits and billing activity", async () => {
    const { customer, business, plan } = await fixture();
    const active = await createActiveSubscription(customer.accessToken, business.id, plan.id);
    await prisma.creditLedger.create({ data: { customerProfileId: active.subscription.customerProfileId, amount: 700, currency: "INR", type: "CREDIT", description: "Test credit" } });

    const credits = await request("/api/v1/credits", { headers: { authorization: `Bearer ${customer.accessToken}` } });
    expect(credits.status).toBe(200);
    expect((await credits.json()).data).toEqual({ INR: 700, USD: 0 });

    const activity = await request("/api/v1/billing-activity", { headers: { authorization: `Bearer ${customer.accessToken}` } });
    expect(activity.status).toBe(200);
    expect((await activity.json()).data.length).toBeGreaterThan(0);
  });

  it("does not allow ADMIN accounts to use customer portal endpoints", async () => {
    const admin = await registerAndLogin("admin@example.com", "ADMIN");
    expect((await request("/api/v1/subscriptions", { headers: { authorization: `Bearer ${admin.accessToken}` } })).status).toBe(403);
    expect((await request("/api/v1/invoices", { headers: { authorization: `Bearer ${admin.accessToken}` } })).status).toBe(403);
    expect((await request("/api/v1/credits", { headers: { authorization: `Bearer ${admin.accessToken}` } })).status).toBe(403);
  });
});
