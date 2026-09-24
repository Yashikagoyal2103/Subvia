import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import { createActiveSubscription, createBusiness, createPlan, createService, registerAndLogin, request } from "./helpers.js";

const secret = process.env.INTERNAL_BILLING_SECRET;
if (!secret) throw new Error("INTERNAL_BILLING_SECRET is required for tests");

describe("Recurring billing security and concurrency", () => {
  async function fixture() {
    const admin = await registerAndLogin("admin@example.com", "ADMIN");
    const business = await createBusiness(admin.accessToken);
    const service = await createService(admin.accessToken, business.id);
    const plan = await createPlan(admin.accessToken, business.id, service.id, { price: 3000 });
    const active = await createActiveSubscription(admin.accessToken, business.id, plan.id);
    return { admin, business, plan, active };
  }

  it("rejects missing internal authentication", async () => {
    const response = await request("/api/v1/internal/billing/run", { method: "POST", body: JSON.stringify({ result: "SUCCESS" }) });
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("INTERNAL_AUTHENTICATION_FAILED");
  });

  it("rejects an invalid internal token", async () => {
    const response = await request("/api/v1/internal/billing/run", { method: "POST", headers: { "X-Internal-Token": "wrong" }, body: JSON.stringify({ result: "SUCCESS" }) });
    expect(response.status).toBe(401);
  });

  it("accepts the configured internal token", async () => {
    const { active } = await fixture();
    await prisma.subscription.update({ where: { id: active.subscription.id }, data: { billingPeriodEnd: new Date("2020-01-01T00:00:00Z") } });
    const response = await request("/api/v1/internal/billing/run", { method: "POST", headers: { "X-Internal-Token": secret }, body: JSON.stringify({ result: "SUCCESS" }) });
    expect(response.status).toBe(200);
  });

  it("processes a due subscription only once under concurrent runs", async () => {
    const { active } = await fixture();
    await prisma.subscription.update({ where: { id: active.subscription.id }, data: { billingPeriodEnd: new Date(Date.now() - 86_400_000) } });
    const options = { method: "POST", headers: { "X-Internal-Token": secret!, "content-type": "application/json" }, body: JSON.stringify({ result: "SUCCESS" }) };
    const [first, second] = await Promise.all([request("/api/v1/internal/billing/run", options), request("/api/v1/internal/billing/run", options)]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await prisma.invoice.count({ where: { subscriptionId: active.subscription.id } })).toBe(2);
  });
});
