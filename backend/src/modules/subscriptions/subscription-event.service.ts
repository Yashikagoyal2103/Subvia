import type { Prisma } from "../../generated/prisma/client.js";
import type { SubscriptionEventType } from "../../generated/prisma/client.js";
import { createWebhookDeliveries } from "../webhooks/webhook.service.js";

export async function createSubscriptionEvent(
  tx: Prisma.TransactionClient,
  input: {
    subscriptionId: string;
    type: SubscriptionEventType;
    metadata?: Prisma.InputJsonValue;
  }
) {
  const event = await tx.subscriptionEvent.create({
    data: {
      subscriptionId: input.subscriptionId,
      type: input.type,
      metadata: input.metadata,
    },
  });

  await createWebhookDeliveries(tx, {
    eventId: event.id,
    subscriptionId: input.subscriptionId,
    type: input.type,
    metadata: input.metadata,
    createdAt: event.createdAt,
  });

  return event;
}

export async function getSubscriptionEvents(
  tx: Prisma.TransactionClient,
  subscriptionId: string
) {
  return tx.subscriptionEvent.findMany({
    where: {
      subscriptionId,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });
}