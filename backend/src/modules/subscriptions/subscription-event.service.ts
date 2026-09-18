import type { Prisma } from "../../generated/prisma/client.js";
import type { SubscriptionEventType } from "../../generated/prisma/client.js";

export async function createSubscriptionEvent(
  tx: Prisma.TransactionClient,
  input: {
    subscriptionId: string;
    type: SubscriptionEventType;
    metadata?: Prisma.InputJsonValue;
  }
) {
  return tx.subscriptionEvent.create({
    data: {
      subscriptionId: input.subscriptionId,
      type: input.type,
      metadata: input.metadata,
    },
  });
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
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });
}