import { BillingInterval, SubscriptionStatus, } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import crypto from "node:crypto";
import type { Prisma } from "../../../generated/prisma/client.js";
import { processPayment } from "../../payments/payment.service.js";
import { applyCredit } from "../../credits/credit.service.js";

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
    await processSubscriptionRenewal(
      subscription.id,
      now,
      paymentResult
    );
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

    // Subscription is cancelled at the end of the current period.
    // Do not create another invoice or attempt another payment.
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

    const renewalPlan =
      subscription.pendingPlan ?? subscription.plan;

    const nextPeriodStart = subscription.billingPeriodEnd;

    const nextPeriodEnd = addBillingInterval(
      nextPeriodStart,
      renewalPlan.interval
    );

    // Create the renewal invoice using the full plan price.
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        customerProfileId: subscription.customerProfileId,
        subscriptionId: subscription.id,
        status: "OPEN",
        currency: renewalPlan.currency,
        subtotal: renewalPlan.price,
        total: renewalPlan.price,
        dueAt: now,
        items: {
          create: {
            description: `${renewalPlan.name} subscription renewal`,
            quantity: 1,
            unitPrice: renewalPlan.price,
            amount: renewalPlan.price,
          },
        },
      },
    });

    // Apply any available customer credit to the renewal invoice.
    const creditResult = await applyCredit(tx, {
      customerProfileId: subscription.customerProfileId,
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: invoice.currency,
    });

    // Update invoice total to the amount that is still actually payable.
    await tx.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        total: creditResult.remainingAmount,
      },
    });

    // If credit completely covers the invoice,
    // no payment attempt is necessary.
    if (creditResult.remainingAmount === 0) {
      await tx.invoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          status: "PAID",
          paidAt: now,
        },
      });

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

      return;
    }

    // Only charge the amount remaining after credit.
    await processPayment(tx, {
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
      amount: creditResult.remainingAmount,
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

    // Payment succeeded, so move the subscription into its next period.
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

function generateInvoiceNumber(): string {
  const year = new Date().getUTCFullYear();
  const shortId = crypto
    .randomUUID()
    .split("-")[0]
    .toUpperCase();

  return `INV-${year}-${shortId}`;
}