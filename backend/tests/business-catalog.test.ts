import { describe, expect, it } from "vitest";
import {
  createBusiness,
  createPlan,
  createService,
  registerAndLogin,
  request,
} from "./helpers.js";

describe("Business, service and plan tenant access", () => {
  it("prevents an authenticated user from reading another business's service", async () => {
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
      },
    );

    expect(response.status).toBe(403);
  });

  it("prevents an authenticated user from reading another business's service catalog", async () => {
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
      },
    );

    expect(response.status).toBe(403);
  });

  it("prevents an authenticated user from reading another business's plan", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const outsider = await registerAndLogin("outsider@example.com");

    const business = await createBusiness(owner.accessToken);
    const service = await createService(owner.accessToken, business.id);
    const plan = await createPlan(
      owner.accessToken,
      business.id,
      service.id,
    );

    const response = await request(
      `/api/v1/businesses/${business.id}/services/${service.id}/plans/${plan.id}`,
      {
        headers: {
          authorization: `Bearer ${outsider.accessToken}`,
        },
      },
    );

    expect(response.status).toBe(403);
  });
});
