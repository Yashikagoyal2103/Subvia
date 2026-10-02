import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import type { Prisma, SubscriptionEventType } from "../../generated/prisma/client.js";
import { getPagination, type PaginationInput } from "../../shared/utils/pagination.js";
import { postWebhook } from "./webhook-url.js";
import { decryptWebhookSecret } from "./webhook-secret.js";

const MAX_ATTEMPTS = 5;
const CLAIM_LEASE_MS = 60_000;

function eventName(type: SubscriptionEventType) {
  const names: Record<SubscriptionEventType, string> = {
    CREATED: "subscription.created", UPGRADED: "subscription.upgraded",
    DOWNGRADE_SCHEDULED: "subscription.downgrade_scheduled", DOWNGRADE_APPLIED: "subscription.downgrade_applied",
    CANCEL_REQUESTED: "subscription.cancel_requested", CANCELLED: "subscription.cancelled",
    RENEWED: "subscription.renewed", PAYMENT_SUCCEEDED: "payment.succeeded", PAYMENT_FAILED: "payment.failed",
  };
  return names[type];
}

function retryDelay(attempts: number) {
  return Math.min(60 * 60 * 1000, 5000 * 2 ** Math.max(attempts - 1, 0));
}

export async function createWebhookDeliveries(tx: Prisma.TransactionClient, input: {
  eventId: string; subscriptionId: string; type: SubscriptionEventType; metadata?: Prisma.InputJsonValue; createdAt: Date;
}) {
  const subscription = await tx.subscription.findUnique({
    where: { id: input.subscriptionId },
    select: { id: true, status: true, planId: true, customerProfile: { select: { userId: true, businessId: true } } },
  });
  if (!subscription) throw new Error("SUBSCRIPTION_NOT_FOUND");

  const endpoints = await tx.webhookEndpoint.findMany({
    where: { businessId: subscription.customerProfile.businessId, status: "ACTIVE" }, select: { id: true },
  });
  if (!endpoints.length) return [];

  const payload = {
    id: input.eventId, type: eventName(input.type), createdAt: input.createdAt.toISOString(),
    data: { subscriptionId: subscription.id, customerId: subscription.customerProfile.userId, planId: subscription.planId, status: subscription.status, metadata: input.metadata ?? null },
  };

  return tx.webhookDelivery.createManyAndReturn({
    data: endpoints.map((endpoint) => ({ endpointId: endpoint.id, eventId: input.eventId, eventType: eventName(input.type), payload })),
  });
}

export function signWebhookPayload(payload: unknown, secret: string, timestamp: string) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${JSON.stringify(payload)}`).digest("hex");
}

async function requireAdmin(userId: string, businessId: string) {
  const member = await prisma.businessMember.findUnique({ where: { userId_businessId: { userId, businessId } } });
  if (!member) throw new Error("BUSINESS_ACCESS_DENIED");
  if (member.role !== "BUSINESS_ADMIN") throw new Error("INSUFFICIENT_PERMISSIONS");
}

export async function listWebhookDeliveries(userId: string, businessId: string, paginationInput: PaginationInput) {
  await requireAdmin(userId, businessId);
  const { skip, take } = getPagination(paginationInput);
  const where = { endpoint: { businessId } };
  const [items, total] = await prisma.$transaction([
    prisma.webhookDelivery.findMany({
      where, skip, take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true, endpointId: true, eventId: true, eventType: true, status: true,
        attempts: true, nextAttemptAt: true, lastAttemptAt: true, deliveredAt: true,
        lastError: true, createdAt: true, updatedAt: true,
        endpoint: { select: { url: true, status: true } },
      },
    }),
    prisma.webhookDelivery.count({ where }),
  ]);

  return { items, pagination: { page: paginationInput.page, limit: paginationInput.limit, total, hasNextPage: skip + items.length < total } };
}

export async function sendTestWebhook(userId: string, businessId: string, endpointId: string) {
  await requireAdmin(userId, businessId);
  const endpoint = await prisma.webhookEndpoint.findFirst({ where: { id: endpointId, businessId } });
  if (!endpoint) throw new Error("WEBHOOK_ENDPOINT_NOT_FOUND");
  if (endpoint.status !== "ACTIVE") throw new Error("WEBHOOK_ENDPOINT_DISABLED");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = {
    id: crypto.randomUUID(), type: "webhook.test", createdAt: new Date().toISOString(),
    data: { businessId, endpointId, message: "Subvia test webhook" },
  };

  try {
    const status = await postWebhook(endpoint.url, {
      "content-type": "application/json", "x-webhook-event": "webhook.test",
      "x-webhook-delivery-id": payload.id, "x-webhook-timestamp": timestamp,
      "x-webhook-signature": `t=${timestamp},v1=${signWebhookPayload(payload, decryptWebhookSecret(endpoint.secret), timestamp)}`,
    }, JSON.stringify(payload));
    if (status < 200 || status >= 300) throw new Error(`HTTP_${status}`);
    return { success: true, statusCode: status };
  } catch (error) {
    const message = error instanceof Error ? error.message : "WEBHOOK_TEST_FAILED";
    const wrapped = new Error("WEBHOOK_TEST_FAILED");
    (wrapped as Error & { cause?: string }).cause = message;
    throw wrapped;
  }
}

export async function processWebhookDeliveries(now: Date = new Date()) {
  const deliveries = await prisma.webhookDelivery.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: now }, endpoint: { status: "ACTIVE" } },
    include: { endpoint: true }, orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }, { id: "asc" }], take: 20,
  });
  let delivered = 0; let failed = 0;

  for (const delivery of deliveries) {
    const claimStartedAt = new Date();
    const claimUntil = new Date(claimStartedAt.getTime() + CLAIM_LEASE_MS);
    const claimed = await prisma.webhookDelivery.updateMany({
      where: { id: delivery.id, status: "PENDING", nextAttemptAt: { lte: now } },
      data: { attempts: { increment: 1 }, lastAttemptAt: claimStartedAt, nextAttemptAt: claimUntil },
    });
    if (claimed.count !== 1) continue;

    const current = await prisma.webhookDelivery.findUnique({ where: { id: delivery.id }, include: { endpoint: true } });
    if (!current || current.status !== "PENDING" || current.endpoint.status !== "ACTIVE" || current.lastAttemptAt?.getTime() !== claimStartedAt.getTime()) continue;

    const timestamp = Math.floor(now.getTime() / 1000).toString();
    try {
      const status = await postWebhook(current.endpoint.url, {
        "content-type": "application/json", "x-webhook-event": current.eventType,
        "x-webhook-delivery-id": current.id, "x-webhook-timestamp": timestamp,
        "x-webhook-signature": `t=${timestamp},v1=${signWebhookPayload(current.payload, decryptWebhookSecret(current.endpoint.secret), timestamp)}`,
      }, JSON.stringify(current.payload));
      if (status < 200 || status >= 300) throw new Error(`HTTP_${status}`);
      await prisma.webhookDelivery.updateMany({ where: { id: current.id, status: "PENDING", lastAttemptAt: claimStartedAt }, data: { status: "DELIVERED", deliveredAt: new Date(), lastError: null } });
      delivered++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "WEBHOOK_DELIVERY_FAILED";
      if (current.attempts >= MAX_ATTEMPTS) {
        await prisma.webhookDelivery.updateMany({ where: { id: current.id, status: "PENDING", lastAttemptAt: claimStartedAt }, data: { status: "FAILED", lastError: message } }); failed++;
      } else {
        await prisma.webhookDelivery.updateMany({ where: { id: current.id, status: "PENDING", lastAttemptAt: claimStartedAt }, data: { nextAttemptAt: new Date(Date.now() + retryDelay(current.attempts)), lastError: message } });
      }
    }
  }
  return { processed: deliveries.length, delivered, failed };
}

export async function cleanupWebhookDeliveries(now: Date = new Date()) {
  const olderThan = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.webhookDelivery.deleteMany({ where: { createdAt: { lt: olderThan }, status: { in: ["DELIVERED", "FAILED"] } } });
  return result.count;
}
