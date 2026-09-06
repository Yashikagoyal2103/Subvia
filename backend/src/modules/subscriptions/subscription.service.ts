import { prisma } from "../../config/prisma.js";
import type { CreateSubscriptionInput } from "./subscription.schema.js";
import crypto from "node:crypto";
import { getBillingPeriod } from "../../shared/utils/billing-period.js";
import { calculateProration } from "../billing/proration/proration.service.js";
import type { UpgradeSubscriptionInput } from "./subscription.schema.js";

export async function createSubscription(
  userId: string,
  businessId: string,
  input: CreateSubscriptionInput
) {
  const plan = await prisma.plan.findFirst({
    where: {
      id: input.planId,
      service: { businessId },
      isActive: true,
    },
  });

  if (!plan) throw new Error("PLAN_NOT_FOUND");

  if (plan.currency !== input.currency) {
    throw new Error("CURRENCY_NOT_SUPPORTED");
  }

  let customer = await prisma.customerProfile.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });

  if (!customer) {
    customer = await prisma.customerProfile.create({
      data: { userId, businessId },
    });
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      customerProfileId: customer.id,
      status: "ACTIVE",
      plan: { serviceId: plan.serviceId },
    },
  });

  if (existingSubscription) {
    throw new Error("ACTIVE_SUBSCRIPTION_EXISTS");
  }

  const start = new Date();
  const end = getBillingPeriod(plan.interval, start);
  const invoiceNumber = `INV-${start.getFullYear()}-${crypto.randomUUID().slice(0, 8)}`;

  return prisma.$transaction(async (tx) => {
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
    include: { items: true },
  });

  return { subscription, invoice };

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
  input: UpgradeSubscriptionInput
) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      status: "ACTIVE",
      customerProfile: { userId, businessId },
    },
    include: { plan: true },
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

  const newPlan = await prisma.plan.findFirst({
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

  const invoiceNumber = `INV-${changeTime.getFullYear()}-${crypto
    .randomUUID()
    .slice(0, 8)}`;

  return prisma.$transaction(async (tx) => {
    const updatedSubscription = await tx.subscription.update({
      where: { id: subscription.id },
      data: { pendingPlanId: newPlan.id },
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
      include: { items: true },
    });

    return {
      subscription: updatedSubscription,
      invoice,
      proration,
    };
  });
}