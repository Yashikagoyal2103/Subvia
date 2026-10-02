import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import { cleanupExpiredRefreshTokens } from "../src/shared/utils/maintenance.worker.js";
import { cleanupExpiredIdempotencyRecords } from "../src/shared/utils/idempotency-cleanup.js";
import { registerAndLogin, createBusiness, request } from "./helpers.js";
import { decryptWebhookSecret, encryptWebhookSecret } from "../src/modules/webhooks/webhook-secret.js";

describe("security and reliability hardening", () => {
  it("returns database-aware health status", async () => {
    const response = await request("/api/v1/health");
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.database).toBe("connected");
  });

  it("rejects webhook URLs that target loopback addresses", async () => {
    const { accessToken } = await registerAndLogin();
    const business = await createBusiness(accessToken);

    const response = await request(`/api/v1/businesses/${business.id}/webhooks`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ url: "http://127.0.0.1:5432" }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("WEBHOOK_URL_NOT_ALLOWED");
  });

  it("rejects IPv4-compatible, transition and reserved IPv6 targets", async () => {
    const { accessToken } = await registerAndLogin();
    const business = await createBusiness(accessToken);
    const blockedUrls = [
      "http://[::127.0.0.1]:3000",
      "http://[::ffff:127.0.0.1]:3000",
      "http://[2002:7f00:1::1]:3000",
      "http://[2001:db8::1]:3000",
    ];

    for (const url of blockedUrls) {
      const response = await request(`/api/v1/businesses/${business.id}/webhooks`, {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ url }),
      });
      expect(response.status).toBe(400);
    }
  });

  it("rejects reserved IPv4 targets", async () => {
    const { accessToken } = await registerAndLogin();
    const business = await createBusiness(accessToken);

    for (const url of ["http://240.0.0.1:3000", "http://192.88.99.1:3000", "http://255.255.255.255:3000", "http://198.18.0.1:3000"]) {
      const response = await request(`/api/v1/businesses/${business.id}/webhooks`, {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ url }),
      });
      expect(response.status).toBe(400);
    }
  });

  it("encrypts webhook secrets at rest and decrypts them for signing", () => {
    const secret = `whsec_${crypto.randomUUID()}`;
    const encrypted = encryptWebhookSecret(secret);
    expect(encrypted).toMatch(/^enc:v1:/);
    expect(encrypted).not.toContain(secret);
    expect(decryptWebhookSecret(encrypted)).toBe(secret);
  });

  it("rejects webhook URLs that target private hostnames", async () => {
    const { accessToken } = await registerAndLogin();
    const business = await createBusiness(accessToken);

    const response = await request(`/api/v1/businesses/${business.id}/webhooks`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ url: "http://localhost:3000/internal" }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("WEBHOOK_URL_NOT_ALLOWED");
  });

  it("removes refresh tokens only after the retention period", async () => {
    const user = await prisma.user.create({
      data: {
        firstName: "Cleanup",
        lastName: "Test",
        email: `cleanup-${crypto.randomUUID()}@example.com`,
        passwordHash: "not-used",
        accountType: "CUSTOMER",
      },
    });

    const now = new Date("2026-09-29T00:00:00.000Z");
    const oldExpiry = new Date("2026-08-20T00:00:00.000Z");
    const recentExpiry = new Date("2026-09-20T00:00:00.000Z");

    await prisma.refreshToken.createMany({
      data: [
        { tokenHash: crypto.randomUUID(), userId: user.id, expiresAt: oldExpiry },
        { tokenHash: crypto.randomUUID(), userId: user.id, expiresAt: recentExpiry },
      ],
    });

    const deleted = await cleanupExpiredRefreshTokens(now);
    expect(deleted).toBe(1);

    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(1);
  });

  it("removes idempotency records older than the retention window", async () => {
    const admin = await registerAndLogin();
    const business = await createBusiness(admin.accessToken);

    const oldCreatedAt = new Date("2026-09-27T00:00:00.000Z");
    const recentCreatedAt = new Date("2026-09-28T12:00:00.000Z");
    const now = new Date("2026-09-29T00:00:00.000Z");

    await prisma.idempotencyRecord.createMany({
      data: [
        {
          key: crypto.randomUUID(),
          userId: admin.userId,
          businessId: business.id,
          operation: "TEST_OLD",
          requestHash: "old",
          statusCode: 200,
          responseBody: {},
          createdAt: oldCreatedAt,
        },
        {
          key: crypto.randomUUID(),
          userId: admin.userId,
          businessId: business.id,
          operation: "TEST_RECENT",
          requestHash: "recent",
          statusCode: 200,
          responseBody: {},
          createdAt: recentCreatedAt,
        },
      ],
    });

    const deleted = await cleanupExpiredIdempotencyRecords(now);
    expect(deleted).toBe(1);

    expect(await prisma.idempotencyRecord.count({ where: { businessId: business.id } })).toBe(1);
  });
});

