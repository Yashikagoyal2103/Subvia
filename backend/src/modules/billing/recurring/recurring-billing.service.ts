import { SubscriptionStatus } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import { processPayment } from "../../payments/payment.service.js";
import { applyCredit } from "../../credits/credit.service.js";
import { generateInvoiceNumber } from "../../invoices/invoice-number.service.js";
import { addBillingInterval } from "../billing-interval.js";
import { calculateTax } from "../tax/tax.service.js";
import { createSubscriptionEvent } from "../../subscriptions/subscription-event.service.js";

type RenewalResult =
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "SKIPPED";

export async function processDueSubscriptions(
  now: Date = new Date(),
  paymentResult: "SUCCESS" | "FAILED" = "SUCCESS"
) {
  const subscriptions =
    await prisma.subscription.findMany({
      where: {
        status:
          SubscriptionStatus.ACTIVE,
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
    const result =
      await processSubscriptionRenewal(
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
  return prisma.$transaction(
    async (tx) => {
      const lockedSubscriptions =
        await tx.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT "id"
          FROM "Subscription"
          WHERE "id" = ${subscriptionId}
            AND "billingPeriodEnd" <= ${now}
          FOR UPDATE
        `;

      if (
        lockedSubscriptions.length === 0
      ) {
        return "SKIPPED";
      }

      const subscription =
        await tx.subscription.findUnique({
          where: {
            id: subscriptionId,
          },
          include: {
            plan: true,
            pendingPlan: true,
            customerProfile: true,
          },
        });

      if (!subscription) {
        return "SKIPPED";
      }

      if (
        subscription.status !==
        SubscriptionStatus.ACTIVE
      ) {
        return "SKIPPED";
      }

      if (
        subscription.billingPeriodEnd >
        now
      ) {
        return "SKIPPED";
      }

      if (subscription.cancelAtPeriodEnd) {
        await tx.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            status:
              SubscriptionStatus.CANCELLED,
            cancelledAt: now,
            cancelAtPeriodEnd: false,
            pendingPlanId: null,
          },
        });

        await createSubscriptionEvent(
          tx,
          {
            subscriptionId:
              subscription.id,
            type: "CANCELLED",
            metadata: {
              mode: "PERIOD_END",
            },
          }
        );

        return "CANCELLED";
      }

      const renewalPlan =
        subscription.pendingPlan ??
        subscription.plan;

      const isPlanChange =
        subscription.pendingPlan !== null;

      const nextPeriodStart =
        subscription.billingPeriodEnd;

      const nextPeriodEnd =
        addBillingInterval(
          nextPeriodStart,
          renewalPlan.interval
        );

      const business =
        await tx.business.findUnique({
          where: {
            id: subscription
              .customerProfile
              .businessId,
          },
          select: {
            taxRate: true,
          },
        });

      if (!business) {
        throw new Error(
          "BUSINESS_NOT_FOUND"
        );
      }

      const tax = calculateTax(
        renewalPlan.price,
        business.taxRate
      );

      const invoiceNumber =
        await generateInvoiceNumber(
          tx,
          now
        );

      const invoice =
        await tx.invoice.create({
          data: {
            invoiceNumber,
            customerProfileId:
              subscription.customerProfileId,
            subscriptionId:
              subscription.id,
            status: "OPEN",
            currency:
              renewalPlan.currency,
            subtotal:
              renewalPlan.price,
            taxRate:
              tax.taxRate,
            taxAmount:
              tax.taxAmount,
            total:
              tax.total,
            dueAt: now,
            items: {
              create: {
                description:
                  `${renewalPlan.name} subscription renewal`,
                quantity: 1,
                unitPrice:
                  renewalPlan.price,
                amount:
                  renewalPlan.price,
              },
            },
          },
        });

      const creditResult =
        await applyCredit(tx, {
          customerProfileId:
            subscription.customerProfileId,
          invoiceId: invoice.id,
          amount: invoice.total,
          currency:
            invoice.currency,
        });

      await tx.invoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          total:
            creditResult.remainingAmount,
        },
      });

      if (
        creditResult.remainingAmount === 0
      ) {
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
            billingPeriodStart:
              nextPeriodStart,
            billingPeriodEnd:
              nextPeriodEnd,
            planId:
              renewalPlan.id,
            price:
              renewalPlan.price,
            currency:
              renewalPlan.currency,
            billingInterval:
              renewalPlan.interval,
            pendingPlanId: null,
            status:
              SubscriptionStatus.ACTIVE,
          },
        });

        if (isPlanChange) {
          await createSubscriptionEvent(
            tx,
            {
              subscriptionId:
                subscription.id,
              type:
                "DOWNGRADE_APPLIED",
              metadata: {
                fromPlanId:
                  subscription.plan.id,
                fromPlanName:
                  subscription.plan.name,
                toPlanId:
                  renewalPlan.id,
                toPlanName:
                  renewalPlan.name,
              },
            }
          );
        }

        await createSubscriptionEvent(
          tx,
          {
            subscriptionId:
              subscription.id,
            type:
              "PAYMENT_SUCCEEDED",
            metadata: {
              invoiceId:
                invoice.id,
              amount: 0,
              currency:
                invoice.currency,
              paymentMethod:
                "CREDIT",
            },
          }
        );

        await createSubscriptionEvent(
          tx,
          {
            subscriptionId:
              subscription.id,
            type: "RENEWED",
            metadata: {
              invoiceId:
                invoice.id,
              planId:
                renewalPlan.id,
              planName:
                renewalPlan.name,
            },
          }
        );

        return "SUCCEEDED";
      }

      await processPayment(tx, {
        invoiceId: invoice.id,
        subscriptionId:
          subscription.id,
        amount:
          creditResult.remainingAmount,
        currency:
          renewalPlan.currency,
        paymentMethod: "DEMO",
        result: paymentResult,
      });

      if (
        paymentResult === "FAILED"
      ) {
        await tx.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            status:
              SubscriptionStatus.PAST_DUE,
          },
        });

        return "FAILED";
      }

      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          billingPeriodStart:
            nextPeriodStart,
          billingPeriodEnd:
            nextPeriodEnd,
          planId:
            renewalPlan.id,
          price:
            renewalPlan.price,
          currency:
            renewalPlan.currency,
          billingInterval:
            renewalPlan.interval,
          pendingPlanId: null,
          status:
            SubscriptionStatus.ACTIVE,
        },
      });

      if (isPlanChange) {
        await createSubscriptionEvent(
          tx,
          {
            subscriptionId:
              subscription.id,
            type:
              "DOWNGRADE_APPLIED",
            metadata: {
              fromPlanId:
                subscription.plan.id,
              fromPlanName:
                subscription.plan.name,
              toPlanId:
                renewalPlan.id,
              toPlanName:
                renewalPlan.name,
            },
          }
        );
      }

      await createSubscriptionEvent(
        tx,
        {
          subscriptionId:
            subscription.id,
          type: "RENEWED",
          metadata: {
            invoiceId:
              invoice.id,
            planId:
              renewalPlan.id,
            planName:
              renewalPlan.name,
          },
        }
      );

      return "SUCCEEDED";
    }
  );
}