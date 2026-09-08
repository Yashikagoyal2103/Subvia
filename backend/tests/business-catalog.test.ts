import { describe, expect, it } from "vitest";
import {createBusiness, createPlan, createService, registerAndLogin, request, } from "./helpers.js";
import { prisma } from "../src/config/prisma.js";

describe("Business, service and plan APIs", () => {
  it("creates a business and automatically creates an admin membership", async () => {
    const auth = await registerAndLogin("owner@example.com");

    const business = await createBusiness(auth.accessToken, "Acme");

    expect(business.name).toBe("Acme");

    const membership = await prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId: auth.userId,
          businessId: business.id,
        },
      },
    });

    expect(membership).not.toBeNull();
    expect(membership?.userId).toBe(auth.userId);
    expect(membership?.role).toBe("BUSINESS_ADMIN");
  });

  it("prevents a user from reading another user's business", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const attacker = await registerAndLogin("attacker@example.com");
    const business = await createBusiness(owner.accessToken);

    const response = await request(`/api/v1/businesses/${business.id}`, {
      headers: { authorization: `Bearer ${attacker.accessToken}` },
    });

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("BUSINESS_NOT_FOUND");
  });

  it("allows an admin to create and update a service", async () => {
    const auth = await registerAndLogin("service@example.com");
    const business = await createBusiness(auth.accessToken);

    const service = await createService(auth.accessToken, business.id);

    const update = await request(
      `/api/v1/businesses/${business.id}/services/${service.id}`,
      {
        method: "PATCH",
        headers: { authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({ name: "Updated Analytics" }),
      }
    );

    expect(update.status).toBe(200);
    expect((await update.json()).data.name).toBe("Updated Analytics");
  });

  it("rejects a non-member from admin service actions", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const outsider = await registerAndLogin("outsider@example.com");
    const business = await createBusiness(owner.accessToken);

    const response = await request(
      `/api/v1/businesses/${business.id}/services`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${outsider.accessToken}` },
        body: JSON.stringify({ name: "Should Fail" }),
      }
    );

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe(
      "BUSINESS_ACCESS_DENIED"
    );
  });

  it("creates plans only under services belonging to the same business", async () => {
    const auth = await registerAndLogin("plan@example.com");
    const business = await createBusiness(auth.accessToken);
    const service = await createService(auth.accessToken, business.id);

    const plan = await createPlan(
      auth.accessToken,
      business.id,
      service.id,
      { name: "Pro", price: 5000 }
    );

    expect(plan.serviceId).toBe(service.id);
    expect(plan.price).toBe(5000);
    expect(plan.currency).toBe("INR");
  });

  it("rejects invalid plan data", async () => {
    const auth = await registerAndLogin("validation@example.com");
    const business = await createBusiness(auth.accessToken);
    const service = await createService(auth.accessToken, business.id);

    const response = await request(
      `/api/v1/businesses/${business.id}/services/${service.id}/plans`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({
          name: "X",
          price: -1,
          currency: "EUR",
          interval: "WEEKLY",
        }),
      }
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it.fails(
    "must not allow a non-member to read another business's services",
    async () => {
      const owner = await registerAndLogin("owner@example.com");
      const outsider = await registerAndLogin("outsider@example.com");
      const business = await createBusiness(owner.accessToken);
      const service = await createService(owner.accessToken, business.id);

      const response = await request(
        `/api/v1/businesses/${business.id}/services/${service.id}`,
        {
          headers: {
            authorization: `Bearer ${outsider.accessToken}`,
          },
        }
      );

      expect(response.status).toBe(403);
    }
  );

  it.fails(
    "must not allow a non-member to list another business's services",
    async () => {
      const owner = await registerAndLogin("owner@example.com");
      const outsider = await registerAndLogin("outsider@example.com");
      const business = await createBusiness(owner.accessToken);
      await createService(owner.accessToken, business.id);

      const response = await request(
        `/api/v1/businesses/${business.id}/services`,
        {
          headers: {
            authorization: `Bearer ${outsider.accessToken}`,
          },
        }
      );

      expect(response.status).toBe(403);
    }
  );

  it.fails(
    "must not allow a non-member to read another business's plans",
    async () => {
      const owner = await registerAndLogin("owner@example.com");
      const outsider = await registerAndLogin("outsider@example.com");
      const business = await createBusiness(owner.accessToken);
      const service = await createService(owner.accessToken, business.id);
      const plan = await createPlan(
        owner.accessToken,
        business.id,
        service.id
      );

      const response = await request(
        `/api/v1/businesses/${business.id}/services/${service.id}/plans/${plan.id}`,
        {
          headers: {
            authorization: `Bearer ${outsider.accessToken}`,
          },
        }
      );

      expect(response.status).toBe(403);
    }
  );
});
