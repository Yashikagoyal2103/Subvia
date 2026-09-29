import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import type {
  Prisma,
  SubscriptionEventType,
} from "../../generated/prisma/client.js";
import { postWebhook } from "./webhook-url.js";

const MAX_ATTEMPTS = 5;
const CLAIM_LEASE_MS = 60_000;

function eventName(type: SubscriptionEventType) {
  const names: Record<SubscriptionEventType, string> = {
    CREATED: "subscription.created",
    UPGRADED: "subscription.upgraded",
    DOWNGRADE_SCHEDULED: "subscription.downgrade_scheduled",
    DOWNGRADE_APPLIED: "subscription.downgrade_applied",
    CANCEL_REQUESTED: "subscription.cancel_requested",
    CANCELLED: "subscription.cancelled",
    RENEWED: "subscription.renewed",
    PAYMENT_SUCCEEDED: "payment.succeeded",
    PAYMENT_FAILED: "payment.failed",
  };

  return names[type];
}

function retryDelay(attempts: number) {
  return Math.min(
    60 * 60 * 1000,
    5000 * 2 ** Math.max(attempts - 1, 0)
  );
}

export async function createWebhookDeliveries(
  tx: Prisma.TransactionClient,
  input: {
    eventId: string;
    subscriptionId: string;
    type: SubscriptionEventType;
    metadata?: Prisma.InputJsonValue;
    createdAt: Date;
  }
) {
  const subscription = await tx.subscription.findUnique({
    where: { id: input.subscriptionId },
    select: {
      id: true,
      status: true,
      planId: true,
      customerProfile: {
        select: {
          userId: true,
          businessId: true,
        },
      },
    },
  });

  if (!subscription) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  const endpoints = await tx.webhookEndpoint.findMany({
    where: {
      businessId: subscription.customerProfile.businessId,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (endpoints.length === 0) {
    return [];
  }

  const payload = {
    id: input.eventId,
    type: eventName(input.type),
    createdAt: input.createdAt.toISOString(),
    data: {
      subscriptionId: subscription.id,
      customerId: subscription.customerProfile.userId,
      planId: subscription.planId,
      status: subscription.status,
      metadata: input.metadata ?? null,
    },
  };

  return tx.webhookDelivery.createManyAndReturn({
    data: endpoints.map((endpoint) => ({
      endpointId: endpoint.id,
      eventId: input.eventId,
      eventType: eventName(input.type),
      payload,
    })),
  });
}

export function signWebhookPayload(
  payload: unknown,
  secret: string,
  timestamp: string
) {
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;

  return crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
}

export async function processWebhookDeliveries(
  now: Date = new Date()
) {
  const deliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: {
        lte: now,
      },
      endpoint: {
        status: "ACTIVE",
      },
    },
    include: {
      endpoint: true,
    },
    orderBy: [
      { nextAttemptAt: "asc" },
      { createdAt: "asc" },
      { id: "asc" },
    ],
    take: 20,
  });

  let delivered = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    const claimUntil = new Date(
      now.getTime() + CLAIM_LEASE_MS
    );

    const claimed = await prisma.webhookDelivery.updateMany({
      where: {
        id: delivery.id,
        status: "PENDING",
        nextAttemptAt: {
          lte: now,
        },
      },
      data: {
        attempts: {
          increment: 1,
        },
        lastAttemptAt: now,
        nextAttemptAt: claimUntil,
      },
    });

    if (claimed.count !== 1) {
      continue;
    }

    const current = await prisma.webhookDelivery.findUnique({
      where: { id: delivery.id },
      include: { endpoint: true },
    });

    if (
      !current ||
      current.status !== "PENDING" ||
      current.endpoint.status !== "ACTIVE"
    ) {
      continue;
    }

    const timestamp = Math.floor(
      now.getTime() / 1000
    ).toString();

    try {
      const status = await postWebhook(
        current.endpoint.url,
        {
          "content-type": "application/json",
          "x-webhook-event": current.eventType,
          "x-webhook-delivery-id": current.id,
          "x-webhook-timestamp": timestamp,
          "x-webhook-signature": `t=${timestamp},v1=${signWebhookPayload(
            current.payload,
            current.endpoint.secret,
            timestamp
          )}`,
        },
        JSON.stringify(current.payload),
      );

      if (status < 200 || status >= 300) {
        throw new Error(`HTTP_${status}`);
      }

      await prisma.webhookDelivery.update({
        where: { id: current.id },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          lastError: null,
        },
      });

      delivered++;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "WEBHOOK_DELIVERY_FAILED";

      if (current.attempts >= MAX_ATTEMPTS) {
        await prisma.webhookDelivery.update({
          where: { id: current.id },
          data: {
            status: "FAILED",
            lastError: message,
          },
        });

        failed++;
      } else {
        await prisma.webhookDelivery.update({
          where: { id: current.id },
          data: {
            nextAttemptAt: new Date(
              Date.now() + retryDelay(current.attempts)
            ),
            lastError: message,
          },
        });
      }
    }
  }

  return {
    processed: deliveries.length,
    delivered,
    failed,
  };
}

export async function cleanupWebhookDeliveries(
  now: Date = new Date()
) {
  const olderThan = new Date(
    now.getTime() -
      30 * 24 * 60 * 60 * 1000
  );

  const result = await prisma.webhookDelivery.deleteMany({
    where: {
      createdAt: {
        lt: olderThan,
      },
      status: {
        in: ["DELIVERED", "FAILED"],
      },
    },
  });

  return result.count;
}
