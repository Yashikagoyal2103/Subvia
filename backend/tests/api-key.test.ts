import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import {
  createBusiness,
  createPlan,
  createService,
  registerAndLogin,
  request,
} from "./helpers.js";

describe("API key", () => {
  it("creates an API key and allows access to the public catalog", async () => {
    const auth = await registerAndLogin(
      `api-key-${crypto.randomUUID()}@example.com`
    );

    const business = await createBusiness(
      auth.accessToken
    );

    const service = await createService(
      auth.accessToken,
      business.id
    );

    await createPlan(
      auth.accessToken,
      business.id,
      service.id
    );

    const createResponse = await request(
      `/api/v1/businesses/${business.id}/api-keys`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          name: "Catalog integration",
        }),
      }
    );

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()).data;

    expect(created.key).toMatch(/^sk_live_/);
    expect(created.name).toBe("Catalog integration");

    const stored = await prisma.apiKey.findUniqueOrThrow({
      where: { id: created.id },
    });

    expect(stored.keyHash).not.toBe(created.key);

    const catalogResponse = await request(
      "/api/v1/public/catalog",
      {
        headers: {
          authorization: `Bearer ${created.key}`,
        },
      }
    );

    expect(catalogResponse.status).toBe(200);

    const catalog = await catalogResponse.json();

    expect(catalog.success).toBe(true);
    expect(catalog.data).toHaveLength(1);
    expect(catalog.data[0].id).toBe(service.id);
  });

  it("rejects an invalid API key", async () => {
    const response = await request(
      "/api/v1/public/catalog",
      {
        headers: {
          authorization: "Bearer sk_live_invalid",
        },
      }
    );

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body.error.code).toBe("INVALID_API_KEY");
  });

  it("prevents another business admin from managing the key", async () => {
    const owner = await registerAndLogin(
      `key-owner-${crypto.randomUUID()}@example.com`
    );

    const outsider = await registerAndLogin(
      `key-outsider-${crypto.randomUUID()}@example.com`
    );

    const business = await createBusiness(
      owner.accessToken
    );

    const response = await request(
      `/api/v1/businesses/${business.id}/api-keys`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${outsider.accessToken}`,
        },
        body: JSON.stringify({
          name: "Unauthorized key",
        }),
      }
    );

    expect(response.status).toBe(403);

    const body = await response.json();

    expect(body.error.code).toBe(
      "BUSINESS_ACCESS_DENIED"
    );
  });

  it("revokes an API key", async () => {
    const auth = await registerAndLogin(
      `revoke-key-${crypto.randomUUID()}@example.com`
    );

    const business = await createBusiness(
      auth.accessToken
    );

    const createResponse = await request(
      `/api/v1/businesses/${business.id}/api-keys`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          name: "Temporary key",
        }),
      }
    );

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()).data;

    const revokeResponse = await request(
      `/api/v1/businesses/${business.id}/api-keys/${created.id}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
        },
      }
    );

    expect(revokeResponse.status).toBe(200);

    const catalogResponse = await request(
      "/api/v1/public/catalog",
      {
        headers: {
          authorization: `Bearer ${created.key}`,
        },
      }
    );

    expect(catalogResponse.status).toBe(401);
  });
});