import { prisma } from "../../config/prisma.js";
import type { CreateSubscriptionInput } from "./subscription.schema.js";

function getBillingPeriod(interval: "MONTHLY" | "YEARLY", start: Date) {
  const end = new Date(start);

  if (interval === "MONTHLY") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }

  return end;
}

export async function createSubscription(
  userId: string,
  businessId: string,
  input: CreateSubscriptionInput
) {
  const plan = await prisma.plan.findFirst({
    where: {
      id: input.planId,
      service: {
        businessId,
      },
      isActive: true,
    },
  });

  if (!plan) {
    throw new Error("PLAN_NOT_FOUND");
  }

  if (plan.currency !== input.currency) {
    throw new Error("CURRENCY_NOT_SUPPORTED");
  }

  let customer = await prisma.customerProfile.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId,
      },
    },
  });

  if (!customer) {
    customer = await prisma.customerProfile.create({
      data: {
        userId,
        businessId,
      },
    });
  }

  const existingSubscription = await prisma.subscription.findFirst({
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

  return prisma.subscription.create({
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