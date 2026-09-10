import { SubscriptionStatus } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { processPayment } from "../../payments/payment.service.js";
import { applyCredit } from "../../credits/credit.service.js";
import { generateInvoiceNumber } from "../../invoices/invoice-number.service.js";
import { addBillingInterval } from "../billing-interval.js";

type RenewalResult =
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "SKIPPED";

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

  let succeeded = 0;
  let failed = 0;
  let cancelled = 0;
  let skipped = 0;

  for (const subscription of subscriptions) {
    const result = await processSubscriptionRenewal(
      subscription.id,
      now,
      paymentResult
    );

    switch (result) {
      case "SUCCEEDED":
        succeeded++;
        break;

      case "FAILED":
        failed++;
        break;

      case "CANCELLED":
        cancelled++;
        break;

      case "SKIPPED":
        skipped++;
        break;
    }
  }

  return {
    processed: subscriptions.length,
    succeeded,
    failed,
    cancelled,
    skipped,
  };
}

async function processSubscriptionRenewal(
  subscriptionId: string,
  now: Date,
  paymentResult: "SUCCESS" | "FAILED"
): Promise<RenewalResult> {
  return prisma.$transaction(async (tx) => {
    // Lock the subscription row so only one
    // billing transaction can process it at a time.
    const lockedSubscriptions = await tx.$queryRaw<
      Array<{ id: string }>
    >`
      SELECT "id"
      FROM "Subscription"
      WHERE "id" = ${subscriptionId}
        AND "billingPeriodEnd" <= ${now}
      FOR UPDATE
    `;

    if (lockedSubscriptions.length === 0) {
      return "SKIPPED";
    }

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
      return "SKIPPED";
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return "SKIPPED";
    }

    if (subscription.billingPeriodEnd > now) {
      return "SKIPPED";
    }

    // Subscription is cancelled at the end of the
    // current billing period.
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

      return "CANCELLED";
    }

    const renewalPlan =
      subscription.pendingPlan ?? subscription.plan;

    const nextPeriodStart = subscription.billingPeriodEnd;

    const nextPeriodEnd = addBillingInterval(
      nextPeriodStart,
      renewalPlan.interval
    );

    // Generate a concurrency-safe human-readable
    // invoice number.
    const invoiceNumber = await generateInvoiceNumber(
      tx,
      now
    );

    // Create the renewal invoice.
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
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

    // Apply available customer credit.
    const creditResult = await applyCredit(tx, {
      customerProfileId: subscription.customerProfileId,
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: invoice.currency,
    });

    // Store the amount that is actually payable.
    await tx.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        total: creditResult.remainingAmount,
      },
    });

    // Credit completely covered the invoice.
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

      return "SUCCEEDED";
    }

    // Attempt payment for the amount remaining
    // after customer credit.
    await processPayment(tx, {
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
      amount: creditResult.remainingAmount,
      currency: renewalPlan.currency,
      paymentMethod: "DEMO",
      result: paymentResult,
    });

    // Renewal payment failed.
    if (paymentResult === "FAILED") {
      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: SubscriptionStatus.PAST_DUE,
        },
      });

      return "FAILED";
    }

    // Renewal payment succeeded.
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

    return "SUCCEEDED";
  });
}
