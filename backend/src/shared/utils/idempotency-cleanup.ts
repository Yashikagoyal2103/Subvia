import { prisma } from "../../config/prisma.js";

const IDEMPOTENCY_RETENTION_HOURS = 24;

export async function cleanupExpiredIdempotencyRecords(
  now: Date = new Date()
) {
  const expiresBefore = new Date(
    now.getTime() -
      IDEMPOTENCY_RETENTION_HOURS *
        60 *
        60 *
        1000
  );

  const result =
    await prisma.idempotencyRecord.deleteMany({
      where: {
        createdAt: {
          lt: expiresBefore,
        },
      },
    });

  return result.count;
}