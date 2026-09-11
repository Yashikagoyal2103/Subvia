import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import { cleanupExpiredIdempotencyRecords } from "../src/shared/utils/idempotency-cleanup.js";
import crypto from "node:crypto";

describe("Idempotency cleanup", () => {
  it("deletes idempotency records older than 24 hours", async () => {
    const now = new Date();

    const expired = await prisma.idempotencyRecord.create({
      data: {
        key: `expired-${crypto.randomUUID()}`,
        userId: crypto.randomUUID(),
        businessId: crypto.randomUUID(),
        operation: "TEST",
        requestHash: "expired-hash",
        statusCode: 200,
        responseBody: {},
        createdAt: new Date(
          now.getTime() -
            25 * 60 * 60 * 1000
        ),
      },
    });

    const fresh = await prisma.idempotencyRecord.create({
      data: {
        key: `fresh-${crypto.randomUUID()}`,
        userId: crypto.randomUUID(),
        businessId: crypto.randomUUID(),
        operation: "TEST",
        requestHash: "fresh-hash",
        statusCode: 200,
        responseBody: {},
        createdAt: new Date(
          now.getTime() -
            23 * 60 * 60 * 1000
        ),
      },
    });

    const deleted =
      await cleanupExpiredIdempotencyRecords(now);

    expect(deleted).toBe(1);

    await expect(
      prisma.idempotencyRecord.findUnique({
        where: { id: expired.id },
      })
    ).resolves.toBeNull();

    await expect(
      prisma.idempotencyRecord.findUnique({
        where: { id: fresh.id },
      })
    ).resolves.not.toBeNull();
  });
});