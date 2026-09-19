import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import type { CreateApiKeyInput } from "./api-key.schema.js";

function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function generateApiKey() {
  return `sk_live_${crypto.randomBytes(32).toString("hex")}`;
}

async function requireAdmin(userId: string, businessId: string) {
  const membership = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: { userId, businessId },
    },
  });

  if (!membership) {
    throw new Error("BUSINESS_ACCESS_DENIED");
  }

  if (membership.role !== "BUSINESS_ADMIN") {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }
}

export async function createApiKey(
  userId: string,
  businessId: string,
  input: CreateApiKeyInput
) {
  await requireAdmin(userId, businessId);

  if (input.expiresAt && input.expiresAt <= new Date()) {
    throw new Error("API_KEY_EXPIRATION_INVALID");
  }

  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      businessId,
      name: input.name,
      keyHash,
      expiresAt: input.expiresAt,
    },
    select: {
      id: true,
      name: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return {
    ...apiKey,
    key: rawKey,
  };
}

export async function getApiKeys(
  userId: string,
  businessId: string
) {
  await requireAdmin(userId, businessId);

  return prisma.apiKey.findMany({
    where: { businessId },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function revokeApiKey(
  userId: string,
  businessId: string,
  apiKeyId: string
) {
  await requireAdmin(userId, businessId);

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: apiKeyId,
      businessId,
    },
  });

  if (!apiKey) {
    throw new Error("API_KEY_NOT_FOUND");
  }

  if (apiKey.revokedAt) {
    throw new Error("API_KEY_ALREADY_REVOKED");
  }

  return prisma.apiKey.update({
    where: {
      id: apiKey.id,
    },
    data: {
      revokedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      revokedAt: true,
    },
  });
}

export async function authenticateApiKey(rawKey: string) {
  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: {
      keyHash,
    },
  });

  if (!apiKey) {
    throw new Error("INVALID_API_KEY");
  }

  if (apiKey.revokedAt) {
    throw new Error("API_KEY_REVOKED");
  }

  if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) {
    throw new Error("API_KEY_EXPIRED");
  }

  await prisma.apiKey.update({
    where: {
      id: apiKey.id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });

  return {
    apiKeyId: apiKey.id,
    businessId: apiKey.businessId,
  };
}