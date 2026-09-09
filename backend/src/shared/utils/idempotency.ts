import crypto from "node:crypto";
import type { Prisma } from "../../generated/prisma/client.js";

export function createRequestHash(input: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

type IdempotencyInput = {
  tx: Prisma.TransactionClient;
  key: string;
  userId: string;
  businessId: string;
  operation: string;
  requestHash: string;
};

export async function startIdempotency(
  input: IdempotencyInput
) {
  const {
    tx,
    key,
    userId,
    businessId,
    operation,
    requestHash,
  } = input;

  const inserted = await tx.$queryRaw<
    {
      id: string;
      key: string;
      userId: string;
      businessId: string;
      operation: string;
      requestHash: string;
      statusCode: number;
      responseBody: unknown;
      createdAt: Date;
    }[]
  >`
    INSERT INTO "IdempotencyRecord"
      ("id", "key", "userId", "businessId", "operation",
       "requestHash", "statusCode", "responseBody", "createdAt")
    VALUES
      (
        ${crypto.randomUUID()},
        ${key},
        ${userId},
        ${businessId},
        ${operation},
        ${requestHash},
        0,
        '{}'::jsonb,
        NOW()
      )
    ON CONFLICT ("userId", "businessId", "key", "operation")
    DO NOTHING
    RETURNING
      "id",
      "key",
      "userId",
      "businessId",
      "operation",
      "requestHash",
      "statusCode",
      "responseBody",
      "createdAt"
  `;

  // We successfully inserted the record.
  // This request owns the idempotency key.
  if (inserted.length > 0) {
    return {
      isNew: true as const,
      record: inserted[0],
    };
  }

  // Another request already owns/processed this key.
  const existing = await tx.idempotencyRecord.findUnique({
    where: {
      userId_businessId_key_operation: {
        userId,
        businessId,
        key,
        operation,
      },
    },
  });

  if (!existing) {
    throw new Error("IDEMPOTENCY_RECORD_NOT_FOUND");
  }

  if (existing.requestHash !== requestHash) {
    throw new Error("IDEMPOTENCY_KEY_REUSED");
  }

  return {
    isNew: false as const,
    record: existing,
  };
}

export async function completeIdempotency(
  tx: Prisma.TransactionClient,
  id: string,
  statusCode: number,
  responseBody: unknown
) {
  return tx.idempotencyRecord.update({
    where: { id },
    data: {
      statusCode,
      responseBody: responseBody as Prisma.InputJsonValue,
    },
  });
}