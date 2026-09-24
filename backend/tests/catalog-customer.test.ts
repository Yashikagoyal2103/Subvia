import { describe, expect, it } from "vitest";
import { createBusiness, createPlan, createService, registerAndLogin, request } from "./helpers.js";

describe("Customer global catalog", () => {
  it("returns active businesses, services and plans across businesses", async () => {
    const adminA = await registerAndLogin("admin-a@example.com", "ADMIN");
    const adminB = await registerAndLogin("admin-b@example.com", "ADMIN");
    const customer = await registerAndLogin("catalog@example.com", "CUSTOMER");
    const businessA = await createBusiness(adminA.accessToken, "CloudBox");
    const businessB = await createBusiness(adminB.accessToken, "NovaStack");
    const serviceA = await createService(adminA.accessToken, businessA.id, "Storage");
    const serviceB = await createService(adminB.accessToken, businessB.id, "Analytics");
    const planA = await createPlan(adminA.accessToken, businessA.id, serviceA.id, { name: "Starter", price: 3000 });
    const planB = await createPlan(adminB.accessToken, businessB.id, serviceB.id, { name: "Pro", price: 5000 });

    const response = await request("/api/v1/catalog", { headers: { authorization: `Bearer ${customer.accessToken}` } });
    expect(response.status).toBe(200);
    const data = (await response.json()).data;
    expect(data.map((b: { id: string }) => b.id)).toEqual(expect.arrayContaining([businessA.id, businessB.id]));
    expect(data.flatMap((b: any) => b.services).flatMap((s: any) => s.plans).map((p: any) => p.id)).toEqual(expect.arrayContaining([planA.id, planB.id]));
  });

  it("filters by search, currency, interval and business", async () => {
    const admin = await registerAndLogin("admin@example.com", "ADMIN");
    const customer = await registerAndLogin("customer@example.com", "CUSTOMER");
    const business = await createBusiness(admin.accessToken, "CloudBox");
    const service = await createService(admin.accessToken, business.id, "Storage");
    const inr = await createPlan(admin.accessToken, business.id, service.id, { name: "INR Monthly", price: 3000, currency: "INR", interval: "MONTHLY" });
    await createPlan(admin.accessToken, business.id, service.id, { name: "USD Yearly", price: 5000, currency: "USD", interval: "YEARLY" });

    const search = await request("/api/v1/catalog?search=INR%20Monthly", { headers: { authorization: `Bearer ${customer.accessToken}` } });
    const searchData = (await search.json()).data;

    const searchPlanIds = searchData
      .flatMap((b: any) => b.services)
      .flatMap((s: any) => s.plans)
      .map((p: any) => p.id);

    expect(searchPlanIds).toContain(inr.id);
    
    const filtered = await request(`/api/v1/catalog?currency=USD&interval=YEARLY&businessId=${business.id}`, { headers: { authorization: `Bearer ${customer.accessToken}` } });
    const plans = (await filtered.json()).data.flatMap((b: any) => b.services).flatMap((s: any) => s.plans);
    expect(plans).toHaveLength(1);
    expect(plans[0].currency).toBe("USD");
    expect(plans[0].interval).toBe("YEARLY");
  });

  it("does not expose inactive services or inactive plans", async () => {
    const admin = await registerAndLogin("admin@example.com", "ADMIN");
    const customer = await registerAndLogin("customer@example.com", "CUSTOMER");
    const business = await createBusiness(admin.accessToken);
    const service = await createService(admin.accessToken, business.id);
    const plan = await createPlan(admin.accessToken, business.id, service.id);
    const inactiveService = await createService(admin.accessToken, business.id, "Hidden Service");
    await createPlan(admin.accessToken, business.id, inactiveService.id, { name: "Hidden Plan" });
    const { prisma } = await import("../src/config/prisma.js");
    await prisma.service.update({ where: { id: inactiveService.id }, data: { isActive: false } });
    await prisma.plan.update({ where: { id: plan.id }, data: { isActive: false } });

    const response = await request("/api/v1/catalog", { headers: { authorization: `Bearer ${customer.accessToken}` } });
    const services = (await response.json()).data.flatMap((b: any) => b.services);
    expect(services.some((s: any) => s.id === inactiveService.id)).toBe(false);
    expect(services.flatMap((s: any) => s.plans).some((p: any) => p.id === plan.id)).toBe(false);
  });
});
