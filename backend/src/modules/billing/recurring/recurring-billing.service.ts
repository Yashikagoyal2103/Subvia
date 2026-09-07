import { BillingInterval, InvoiceStatus, SubscriptionStatus, } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import crypto from "node:crypto";
import type { Prisma } from "../../../generated/prisma/client.js";
import { processPayment, } from "../../payments/payment.service.js";

function addBillingInterval(
  date: Date,
  interval: BillingInterval
): Date {
  const nextDate = new Date(date);

  if (interval === BillingInterval.MONTHLY) {
    nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  } else {
    nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
  }

  return nextDate;
}

export async function processDueSubscriptions(
  now: Date = new Date(),
  paymentResult: "SUCCESS" | "FAILED" = "SUCCESS"
) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      billingPeriodEnd: {
        lte: now,
      },
    },
    include: {
      plan: true,
      pendingPlan: true,
    },
  });

  for (const subscription of subscriptions) {
    await processSubscriptionRenewal(subscription.id, now, paymentResult);
  }

  return {
    processed: subscriptions.length,
  };
}

async function processSubscriptionRenewal(
  subscriptionId: string,
  now: Date,
  paymentResult: "SUCCESS" | "FAILED"
) {
  await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({
      where: {
        id: subscriptionId,
      },
      include: {
        plan: true,
        pendingPlan: true,
      },
    });

    if (!subscription) {
      return;
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return;
    }

    if (subscription.billingPeriodEnd > now) {
      return;
    }
    if (subscription.cancelAtPeriodEnd) {
      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: now,
          cancelAtPeriodEnd: false,
          pendingPlanId: null,
        },
      });

      return;
    }

    const renewalPlan = subscription.pendingPlan ?? subscription.plan;

    const nextPeriodStart = subscription.billingPeriodEnd;

    const nextPeriodEnd = addBillingInterval(
      nextPeriodStart,
      renewalPlan.interval
    );

    const invoice = await createRenewalInvoice(
      tx,
      subscription.id,
      subscription.customerProfileId,
      renewalPlan.name,
      renewalPlan.price,
      renewalPlan.currency,
      nextPeriodStart
    );
    await processPayment(tx, {
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
      amount: renewalPlan.price,
      currency: renewalPlan.currency,
      paymentMethod: "DEMO",
      result: paymentResult,
    });

    if (paymentResult === "FAILED") {
      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: SubscriptionStatus.PAST_DUE,
        },
      });

      return;
    }

    await tx.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        billingPeriodStart: nextPeriodStart,
        billingPeriodEnd: nextPeriodEnd,
        planId: renewalPlan.id,
        price: renewalPlan.price,
        currency: renewalPlan.currency,
        billingInterval: renewalPlan.interval,
        pendingPlanId: null,
        status: SubscriptionStatus.ACTIVE,
      },
  });
  });
}

async function createRenewalInvoice(
  tx: Prisma.TransactionClient,
  subscriptionId: string,
  customerProfileId: string,
  planName: string,
  price: number,
  currency: "INR" | "USD",
  periodStart: Date
) {
  const invoiceNumber = generateInvoiceNumber();

  return tx.invoice.create({
    data: {
      invoiceNumber,
      customerProfileId,
      subscriptionId,
      status: InvoiceStatus.OPEN,
      currency,
      subtotal: price,
      total: price,
      dueAt: periodStart,

      items: {
        create: {
          description: `${planName} subscription renewal`,
          quantity: 1,
          unitPrice: price,
          amount: price,
        },
      },
    },
  });
}

function generateInvoiceNumber(): string {
  const year = new Date().getUTCFullYear();
  const shortId = crypto.randomUUID().split("-")[0].toUpperCase();

  return `INV-${year}-${shortId}`;
}