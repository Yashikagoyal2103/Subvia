import { prisma } from "../../config/prisma.js";
import type { CreateSubscriptionInput } from "./subscription.schema.js";
import crypto from "node:crypto";
import { getBillingPeriod } from "../../shared/utils/billing-period.js";
import { calculateProration } from "../billing/proration/proration.service.js";
import type { UpgradeSubscriptionInput, DowngradeSubscriptionInput } from "./subscription.schema.js";
import { createCredit } from "../credits/credit.service.js";
import { createRequestHash, startIdempotency, completeIdempotency, } from "../../shared/utils/idempotency.js";

export async function createSubscription(
  userId: string,
  businessId: string,
  input: CreateSubscriptionInput,
  idempotencyKey: string
) {
  const requestHash = createRequestHash({
    planId: input.planId,
    currency: input.currency,
  });

  return prisma.$transaction(async (tx) => {
    const idempotency = await startIdempotency({
      tx,
      key: idempotencyKey,
      userId,
      businessId,
      operation: "CREATE_SUBSCRIPTION",
      requestHash,
    });

    if (!idempotency.isNew) {
      return idempotency.record.responseBody;
    }

    const plan = await tx.plan.findFirst({
      where: {
        id: input.planId,
        service: { businessId },
        isActive: true,
      },
    });

    if (!plan) {
      throw new Error("PLAN_NOT_FOUND");
    }

    if (plan.currency !== input.currency) {
      throw new Error("CURRENCY_NOT_SUPPORTED");
    }

    let customer = await tx.customerProfile.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!customer) {
      customer = await tx.customerProfile.create({
        data: {
          userId,
          businessId,
        },
      });
    }

    const existingSubscription = await tx.subscription.findFirst({
      where: {
        customerProfileId: customer.id,
        status: "ACTIVE",
        plan: {
          serviceId: plan.serviceId,
        },
      },
    });

    if (existingSubscription) {
      throw new Error("ACTIVE_SUBSCRIPTION_EXISTS");
    }

    const start = new Date();
    const end = getBillingPeriod(plan.interval, start);

    const invoiceNumber =
      `INV-${start.getFullYear()}-${crypto.randomUUID().slice(0, 8)}`;

    const subscription = await tx.subscription.create({
      data: {
        customerProfileId: customer.id,
        planId: plan.id,
        status: "PENDING",
        currency: plan.currency,
        price: plan.price,
        billingInterval: plan.interval,
        billingPeriodStart: start,
        billingPeriodEnd: end,
      },
    });

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerProfileId: customer.id,
        subscriptionId: subscription.id,
        status: "OPEN",
        currency: plan.currency,
        subtotal: plan.price,
        total: plan.price,
        items: {
          create: {
            description: `${plan.name} subscription`,
            quantity: 1,
            unitPrice: plan.price,
            amount: plan.price,
          },
        },
      },
      include: {
        items: true,
      },
    });

    const response = {
      subscription,
      invoice,
    };

    await completeIdempotency(
      tx,
      idempotency.record.id,
      201,
      response
    );

    return response;
});
}

export async function getSubscriptions(
  userId: string,
  businessId: string
) {
  return prisma.subscription.findMany({
    where: {
      customerProfile: {
        userId,
        businessId,
      },
    },
    include: {
      plan: {
        include: {
          service: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getSubscription(
  userId: string,
  businessId: string,
  subscriptionId: string
) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      customerProfile: {
        userId,
        businessId,
      },
    },
    include: {
      plan: {
        include: {
          service: true,
        },
      },
    },
  });

  if (!subscription) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  return subscription;
}

export async function upgradeSubscription(
  userId: string,
  businessId: string,
  subscriptionId: string,
  input: UpgradeSubscriptionInput,
  idempotencyKey: string
) {
  const requestHash = createRequestHash({
    subscriptionId,
    planId: input.planId,
  });

  return prisma.$transaction(async (tx) => {
    const idempotency = await startIdempotency({
      tx,
      key: idempotencyKey,
      userId,
      businessId,
      operation: "UPGRADE_SUBSCRIPTION",
      requestHash,
    });

    if (!idempotency.isNew) {
      return idempotency.record.responseBody;
    }

    const subscription = await tx.subscription.findFirst({
      where: {
        id: subscriptionId,
        status: "ACTIVE",
        customerProfile: {
          userId,
          businessId,
        },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new Error("SUBSCRIPTION_NOT_FOUND");
    }

    if (subscription.planId === input.planId) {
      throw new Error("ALREADY_ON_PLAN");
    }

    if (subscription.pendingPlanId) {
      throw new Error("PENDING_PLAN_CHANGE_EXISTS");
    }

    const newPlan = await tx.plan.findFirst({
      where: {
        id: input.planId,
        serviceId: subscription.plan.serviceId,
        isActive: true,
      },
    });

    if (!newPlan) {
      throw new Error("PLAN_NOT_FOUND");
    }

    if (newPlan.currency !== subscription.currency) {
      throw new Error("CURRENCY_NOT_SUPPORTED");
    }

    if (newPlan.price <= subscription.price) {
      throw new Error("NOT_AN_UPGRADE");
    }

    const changeTime = new Date();

    const proration = calculateProration({
      oldPlanPrice: subscription.price,
      newPlanPrice: newPlan.price,
      billingPeriodStart: subscription.billingPeriodStart,
      billingPeriodEnd: subscription.billingPeriodEnd,
      changeTime,
    });

    const invoiceNumber =
      `INV-${changeTime.getFullYear()}-${crypto
        .randomUUID()
        .slice(0, 8)}`;

    const updatedSubscription = await tx.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        pendingPlanId: newPlan.id,
      },
    });

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerProfileId: subscription.customerProfileId,
        subscriptionId: subscription.id,
        status: "OPEN",
        currency: subscription.currency,
        subtotal: proration.netAmount,
        total: proration.netAmount,
        items: {
          create: [
            {
              description: `${newPlan.name} upgrade charge`,
              quantity: 1,
              unitPrice: proration.newPlanCharge,
              amount: proration.newPlanCharge,
            },
            {
              description: `${subscription.plan.name} unused time credit`,
              quantity: 1,
              unitPrice: -proration.oldPlanCredit,
              amount: -proration.oldPlanCredit,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    const response = {
      subscription: updatedSubscription,
      invoice,
      proration,
    };

    await completeIdempotency(
      tx,
      idempotency.record.id,
      201,
      response
    );

    return response;
  });
}

export async function downgradeSubscription(
  userId: string,
  businessId: string,
  subscriptionId: string,
  input: DowngradeSubscriptionInput,
  idempotencyKey: string
) {
  const requestHash = createRequestHash({
    subscriptionId,
    planId: input.planId,
  });

  return prisma.$transaction(async (tx) => {
    const idempotency = await startIdempotency({
      tx,
      key: idempotencyKey,
      userId,
      businessId,
      operation: "DOWNGRADE_SUBSCRIPTION",
      requestHash,
    });

    if (!idempotency.isNew) {
      return idempotency.record.responseBody;
    }

    const subscription = await tx.subscription.findFirst({
      where: {
        id: subscriptionId,
        status: "ACTIVE",
        customerProfile: {
          userId,
          businessId,
        },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new Error("SUBSCRIPTION_NOT_FOUND");
    }

    if (subscription.planId === input.planId) {
      throw new Error("ALREADY_ON_PLAN");
    }

    if (subscription.pendingPlanId) {
      throw new Error("PENDING_PLAN_CHANGE_EXISTS");
    }

    const newPlan = await tx.plan.findFirst({
      where: {
        id: input.planId,
        serviceId: subscription.plan.serviceId,
        isActive: true,
      },
    });

    if (!newPlan) {
      throw new Error("PLAN_NOT_FOUND");
    }

    if (newPlan.currency !== subscription.currency) {
      throw new Error("CURRENCY_NOT_SUPPORTED");
    }

    if (newPlan.price >= subscription.price) {
      throw new Error("NOT_A_DOWNGRADE");
    }

    const result = await tx.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        pendingPlanId: newPlan.id,
      },
      include: {
        plan: true,
        pendingPlan: true,
      },
    });

    await completeIdempotency(
      tx,
      idempotency.record.id,
      200,
      result
    );

    return result;
  });
}
export async function cancelSubscription(
  userId: string,
  businessId: string,
  subscriptionId: string,
  mode: "PERIOD_END" | "IMMEDIATE",
  idempotencyKey: string
) {
  const requestHash = createRequestHash({
    subscriptionId,
    mode,
  });

  return prisma.$transaction(async (tx) => {
    const idempotency = await startIdempotency({
      tx,
      key: idempotencyKey,
      userId,
      businessId,
      operation: "CANCEL_SUBSCRIPTION",
      requestHash,
    });

    if (!idempotency.isNew) {
      return idempotency.record.responseBody;
    }

    const subscription = await tx.subscription.findFirst({
      where: {
        id: subscriptionId,
        status: "ACTIVE",
        customerProfile: {
          userId,
          businessId,
        },
      },
      include: {
        plan: true,
        customerProfile: true,
      },
    });

    if (!subscription) {
      throw new Error("SUBSCRIPTION_NOT_FOUND");
    }

    if (mode === "PERIOD_END") {
      if (subscription.cancelAtPeriodEnd) {
        throw new Error("CANCELLATION_ALREADY_SCHEDULED");
      }

      const result = await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          cancelAtPeriodEnd: true,
        },
      });

      await completeIdempotency(
        tx,
        idempotency.record.id,
        200,
        result
      );

      return result;
    }

    const now = new Date();

    const totalPeriodMs =
      subscription.billingPeriodEnd.getTime() -
      subscription.billingPeriodStart.getTime();

    const remainingMs = Math.max(
      subscription.billingPeriodEnd.getTime() -
        now.getTime(),
      0
    );

    const unusedAmount = Math.floor(
      (subscription.price * remainingMs) /
        totalPeriodMs
    );

    if (unusedAmount > 0) {
      await createCredit(tx, {
        customerProfileId: subscription.customerProfileId,
        amount: unusedAmount,
        currency: subscription.currency,
        description:
          "Credit from immediate subscription cancellation.",
      });
    }

    const result = await tx.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelAtPeriodEnd: false,
        pendingPlanId: null,
      },
    });

    await completeIdempotency(
      tx,
      idempotency.record.id,
      200,
      result
    );

    return result;
  });
}