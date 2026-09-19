import { prisma } from "../../config/prisma.js";
import type { CreateWebhookEndpointInput, UpdateWebhookEndpointInput } from "./webhook.schema.js";

async function requireAdmin(userId: string, businessId: string) {
  const member = await prisma.businessMember.findFirst({
    where: {
      userId,
      businessId,
      role: "BUSINESS_ADMIN",
    },
  });

  if (!member) {
    throw new Error("BUSINESS_ACCESS_DENIED");
  }
}

export async function createWebhookEndpoint(
  userId: string,
  businessId: string,
  input: CreateWebhookEndpointInput,
  secret: string
) {
  await requireAdmin(userId, businessId);

  return prisma.webhookEndpoint.create({
    data: {
      businessId,
      url: input.url,
      secret,
    },
    select: {
      id: true,
      url: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function getWebhookEndpoints(
  userId: string,
  businessId: string
) {
  await requireAdmin(userId, businessId);

  return prisma.webhookEndpoint.findMany({
    where: {
      businessId,
    },
    select: {
      id: true,
      url: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });
}

export async function updateWebhookEndpoint(
  userId: string,
  businessId: string,
  endpointId: string,
  input: UpdateWebhookEndpointInput
) {
  await requireAdmin(userId, businessId);

  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: {
      id: endpointId,
      businessId,
    },
  });

  if (!endpoint) {
    throw new Error("WEBHOOK_ENDPOINT_NOT_FOUND");
  }

  return prisma.webhookEndpoint.update({
    where: {
      id: endpoint.id,
    },
    data: input,
    select: {
      id: true,
      url: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteWebhookEndpoint(
  userId: string,
  businessId: string,
  endpointId: string
) {
  await requireAdmin(userId, businessId);

  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: {
      id: endpointId,
      businessId,
    },
  });

  if (!endpoint) {
    throw new Error("WEBHOOK_ENDPOINT_NOT_FOUND");
  }

  await prisma.webhookEndpoint.delete({
    where: {
      id: endpoint.id,
    },
  });
}