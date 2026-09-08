import { describe, expect, it } from "vitest";
import {createBusiness, createPlan, createService, registerAndLogin, request, } from "./helpers.js";
import { prisma } from "../src/config/prisma.js";

it("allows an authenticated user to browse another business's services", async () => {
  const owner = await registerAndLogin("owner@example.com");
  const outsider = await registerAndLogin("outsider@example.com");

  const business = await createBusiness(owner.accessToken);
  const service = await createService(
    owner.accessToken,
    business.id
  );

  const response = await request(
    `/api/v1/businesses/${business.id}/services/${service.id}`,
    {
      headers: {
        authorization: `Bearer ${outsider.accessToken}`,
      },
    }
  );

  expect(response.status).toBe(200);

  const body = await response.json();

  expect(body.data.id).toBe(service.id);
  expect(body.data.businessId).toBe(business.id);
});

it("allows an authenticated user to browse another business's service catalog", async () => {
  const owner = await registerAndLogin("owner@example.com");
  const outsider = await registerAndLogin("outsider@example.com");

  const business = await createBusiness(owner.accessToken);

  await createService(
    owner.accessToken,
    business.id
  );

  const response = await request(
    `/api/v1/businesses/${business.id}/services`,
    {
      headers: {
        authorization: `Bearer ${outsider.accessToken}`,
      },
    }
  );

  expect(response.status).toBe(200);

  const body = await response.json();

  expect(body.data).toHaveLength(1);
});

it("allows an authenticated user to browse another business's plans", async () => {
  const owner = await registerAndLogin("owner@example.com");
  const outsider = await registerAndLogin("outsider@example.com");

  const business = await createBusiness(owner.accessToken);

  const service = await createService(
    owner.accessToken,
    business.id
  );

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

  expect(response.status).toBe(200);

  const body = await response.json();

  expect(body.data.id).toBe(plan.id);
  expect(body.data.serviceId).toBe(service.id);
});