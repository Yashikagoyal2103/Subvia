
import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import type { CreatePaymentInput } from "./payment.schema.js";
import type {
  Prisma,
  Currency,
} from "../../generated/prisma/client.js";
import {
  createRequestHash,
  startIdempotency,
  completeIdempotency,
} from "../../shared/utils/idempotency.js";
import { addBillingInterval } from "../billing/billing-interval.js";
import {
  getPagination,
  type PaginationInput,
} from "../../shared/utils/pagination.js";
import { createSubscriptionEvent } from "../subscriptions/subscription-event.service.js";

type ProcessPaymentInput = {
  invoiceId: string;
  subscriptionId: string;
  amount: number;
  currency: Currency;
  paymentMethod: string;
  result: "SUCCESS" | "FAILED";
  operation?: "UPGRADE";
};

export async function processPayment(
  tx: Prisma.TransactionClient,
  input: ProcessPaymentInput
) {
  const payment =
    await tx.payment.create({
      data: {
        invoiceId:
          input.invoiceId,
        amount:
          input.amount,
        currency:
          input.currency,
        status:
          input.result,
        paymentMethod:
          input.paymentMethod,
        transactionId:
          input.result === "SUCCESS"
            ? crypto.randomUUID()
            : null,
        failureReason:
          input.result === "FAILED"
            ? "Simulated payment failure."
            : null,
      },
    });

  const subscription =
    await tx.subscription.findUnique({
      where: {
        id: input.subscriptionId,
      },
      include: {
        plan: true,
        pendingPlan: true,
      },
    });

  if (!subscription) {
    throw new Error(
      "SUBSCRIPTION_NOT_FOUND"
    );
  }

  if (input.result === "FAILED") {
    await createSubscriptionEvent(tx, {
      subscriptionId: subscription.id,
      type: "PAYMENT_FAILED",
      metadata: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        currency: input.currency,
        ...(input.operation === "UPGRADE" && subscription.pendingPlan
          ? {
              operation: "UPGRADE",
              pendingPlanId: subscription.pendingPlan.id,
              pendingPlanName: subscription.pendingPlan.name,
            }
          : {}),
      },
    });

    if (input.operation === "UPGRADE" && subscription.pendingPlanId) {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { pendingPlanId: null },
      });
    }

    return {
      payment,
      success: false,
    };
  }

  await tx.invoice.update({
    where: {
      id: input.invoiceId,
    },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  await createSubscriptionEvent(
    tx,
    {
      subscriptionId:
        subscription.id,
      type:
        "PAYMENT_SUCCEEDED",
      metadata: {
        invoiceId:
          input.invoiceId,
        amount:
          input.amount,
        currency:
          input.currency,
        paymentMethod:
          input.paymentMethod,
      },
    }
  );

  if (
    subscription.status ===
    "PAST_DUE"
  ) {
    const renewalPlan =
      subscription.pendingPlan ??
      subscription.plan;

    const nextPeriodStart =
      subscription.billingPeriodEnd;

    const nextPeriodEnd =
      addBillingInterval(
        nextPeriodStart,
        renewalPlan.interval
      );

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
        status: "ACTIVE",
      },
    });

    if (
      subscription.pendingPlan
    ) {
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
          planId:
            renewalPlan.id,
          planName:
            renewalPlan.name,
          recoveredFromPastDue:
            true,
        },
      }
    );
  } else {
    let upgradePlan = subscription.pendingPlan;

    if (!upgradePlan) {
      const failedUpgradeEvent = await tx.subscriptionEvent.findFirst({
        where: {
          subscriptionId: subscription.id,
          type: "PAYMENT_FAILED",
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });

      if (failedUpgradeEvent) {
        const metadata =
          failedUpgradeEvent.metadata &&
          typeof failedUpgradeEvent.metadata === "object"
            ? (failedUpgradeEvent.metadata as Record<string, unknown>)
            : null;

        const pendingPlanId =
          metadata?.operation === "UPGRADE" &&
          metadata.invoiceId === input.invoiceId &&
          typeof metadata.pendingPlanId === "string"
            ? metadata.pendingPlanId
            : null;

        if (pendingPlanId) {
          upgradePlan = await tx.plan.findUnique({
            where: { id: pendingPlanId },
          });
        }
      }
    }

    if (upgradePlan) {
      const oldPlan = subscription.plan;
      const newPlan = upgradePlan;

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: newPlan.id,
          price: newPlan.price,
          currency: newPlan.currency,
          billingInterval: newPlan.interval,
          pendingPlanId: null,
          status: "ACTIVE",
        },
      });

      await createSubscriptionEvent(tx, {
        subscriptionId: subscription.id,
        type: "UPGRADED",
        metadata: {
          fromPlanId: oldPlan.id,
          fromPlanName: oldPlan.name,
          toPlanId: newPlan.id,
          toPlanName: newPlan.name,
        },
      });
    } else {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { status: "ACTIVE" },
      });
    }
  }

  return {
    payment,
    success: true,
  };
}

export async function createPayment(
  userId: string,
  businessId: string,
  input: CreatePaymentInput,
  idempotencyKey: string
) {
  const requestHash =
    createRequestHash({
      invoiceId:
        input.invoiceId,
      paymentMethod:
        input.paymentMethod,
      result:
        input.result,
    });

  return prisma.$transaction(
    async (tx) => {
      const idempotency =
        await startIdempotency({
          tx,
          key: idempotencyKey,
          userId,
          businessId,
          operation:
            "CREATE_PAYMENT",
          requestHash,
        });

      if (!idempotency.isNew) {
        return idempotency.record
          .responseBody;
      }

      const lockedInvoices =
        await tx.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT "Invoice"."id"
          FROM "Invoice"
          INNER JOIN "CustomerProfile"
            ON "CustomerProfile"."id" =
               "Invoice"."customerProfileId"
          WHERE "Invoice"."id" =
                ${input.invoiceId}
            AND "CustomerProfile"."userId" =
                ${userId}
            AND "CustomerProfile"."businessId" =
                ${businessId}
          FOR UPDATE
        `;

      if (
        lockedInvoices.length === 0
      ) {
        throw new Error(
          "INVOICE_NOT_FOUND"
        );
      }

      const invoice =
        await tx.invoice.findUnique({
          where: {
            id: input.invoiceId,
          },
        });

      if (!invoice) {
        throw new Error(
          "INVOICE_NOT_FOUND"
        );
      }

      if (
        invoice.status === "PAID"
      ) {
        throw new Error(
          "INVOICE_ALREADY_PAID"
        );
      }

      if (
        invoice.status !== "OPEN"
      ) {
        throw new Error(
          "INVOICE_NOT_PAYABLE"
        );
      }

      const paymentSubscription = await tx.subscription.findUnique({
        where: { id: invoice.subscriptionId },
        select: { status: true, pendingPlanId: true },
      });

      if (!paymentSubscription) {
        throw new Error("SUBSCRIPTION_NOT_FOUND");
      }

      const result = await processPayment(tx, {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscriptionId,
        amount: invoice.total,
        currency: invoice.currency,
        paymentMethod: input.paymentMethod,
        result: input.result,
        operation:
          paymentSubscription.status === "ACTIVE" &&
          paymentSubscription.pendingPlanId
            ? "UPGRADE"
            : undefined,
      });

      await completeIdempotency(
        tx,
        idempotency.record.id,
        201,
        result
      );

      return result;
    }
  );
}

export async function getPayments(
  userId: string,
  businessId: string,
  pagination: PaginationInput
) {
  const { skip, take } =
    getPagination(pagination);

  const payments =
    await prisma.payment.findMany({
      where: {
        invoice: {
          customerProfile: {
            userId,
            businessId,
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      skip,
      take: take + 1,
    });

  const hasNextPage =
    payments.length > take;

  return {
    items: hasNextPage
      ? payments.slice(0, take)
      : payments,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      hasNextPage,
    },
  };
}

export async function getPayment(
  userId: string,
  businessId: string,
  paymentId: string
) {
  const payment =
    await prisma.payment.findFirst({
      where: {
        id: paymentId,
        invoice: {
          customerProfile: {
            userId,
            businessId,
          },
        },
      },
      include: {
        invoice: true,
      },
    });

  if (!payment) {
    throw new Error(
      "PAYMENT_NOT_FOUND"
    );
  }

  return payment;
}
