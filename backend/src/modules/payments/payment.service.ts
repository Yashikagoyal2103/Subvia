import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import type { CreatePaymentInput } from "./payment.schema.js";
import type { Prisma, Currency } from "../../generated/prisma/client.js";
import { createRequestHash, startIdempotency, completeIdempotency, } from "../../shared/utils/idempotency.js";
import { addBillingInterval } from "../billing/billing-interval.js";


type ProcessPaymentInput = {
  invoiceId: string;
  subscriptionId: string;
  amount: number;
  currency: Currency;
  paymentMethod: string;
  result: "SUCCESS" | "FAILED";
};

export async function processPayment(
  tx: Prisma.TransactionClient,
  input: ProcessPaymentInput
) {
  const payment = await tx.payment.create({
    data: {
      invoiceId: input.invoiceId,
      amount: input.amount,
      currency: input.currency,
      status: input.result,
      paymentMethod: input.paymentMethod,
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

  if (input.result === "SUCCESS") {
    await tx.invoice.update({
      where: { id: input.invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    const subscription = await tx.subscription.findUnique({
      where: { id: input.subscriptionId },
      include: {
        plan: true,
        pendingPlan: true,
      },
    });

    if (!subscription) {
      throw new Error("SUBSCRIPTION_NOT_FOUND");
    }

    // PAST_DUE means this payment is recovering
    // a failed recurring renewal.
    if (subscription.status === "PAST_DUE") {
      const renewalPlan =
        subscription.pendingPlan ?? subscription.plan;

      const nextPeriodStart = subscription.billingPeriodEnd;

      const nextPeriodEnd = addBillingInterval(
        nextPeriodStart,
        renewalPlan.interval
      );

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          billingPeriodStart: nextPeriodStart,
          billingPeriodEnd: nextPeriodEnd,
          planId: renewalPlan.id,
          price: renewalPlan.price,
          currency: renewalPlan.currency,
          billingInterval: renewalPlan.interval,
          pendingPlanId: null,
          status: "ACTIVE",
        },
      });
    } else if (subscription.pendingPlan) {
      // Existing upgrade/payment behaviour.
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: subscription.pendingPlan.id,
          price: subscription.pendingPlan.price,
          currency: subscription.pendingPlan.currency,
          billingInterval: subscription.pendingPlan.interval,
          pendingPlanId: null,
          status: "ACTIVE",
        },
      });
    } else {
      // Existing initial-payment behaviour.
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
        },
      });
    }
  }

  return {
    payment,
    success: input.result === "SUCCESS",
  };
}

export async function createPayment(
  userId: string,
  businessId: string,
  input: CreatePaymentInput,
  idempotencyKey: string
) {
  const requestHash = createRequestHash({
    invoiceId: input.invoiceId,
    paymentMethod: input.paymentMethod,
    result: input.result,
  });

  return prisma.$transaction(async (tx) => {
    const idempotency = await startIdempotency({
      tx,
      key: idempotencyKey,
      userId,
      businessId,
      operation: "CREATE_PAYMENT",
      requestHash,
    });

    if (!idempotency.isNew) {
      return idempotency.record.responseBody;
    }

    const lockedInvoices = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "Invoice"."id"
      FROM "Invoice"
      INNER JOIN "CustomerProfile"
        ON "CustomerProfile"."id" = "Invoice"."customerProfileId"
      WHERE "Invoice"."id" = ${input.invoiceId}
        AND "CustomerProfile"."userId" = ${userId}
        AND "CustomerProfile"."businessId" = ${businessId}
      FOR UPDATE
    `;

    if (lockedInvoices.length === 0) {
      throw new Error("INVOICE_NOT_FOUND");
    }

    const invoice = await tx.invoice.findUnique({
      where: {
        id: input.invoiceId,
      },
    });

    if (!invoice) {
      throw new Error("INVOICE_NOT_FOUND");
    }

    if (invoice.status === "PAID") {
      throw new Error("INVOICE_ALREADY_PAID");
    }

    if (invoice.status !== "OPEN") {
      throw new Error("INVOICE_NOT_PAYABLE");
    }

    const result = await processPayment(tx, {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscriptionId,
      amount: invoice.total,
      currency: invoice.currency,
      paymentMethod: input.paymentMethod,
      result: input.result,
    });

    await completeIdempotency(
      tx,
      idempotency.record.id,
      201,
      result
    );

    return result;
  });
}

export async function getPayments(
  userId: string,
  businessId: string
) {
  return prisma.payment.findMany({
    where: {
      invoice: {
        customerProfile: { userId, businessId },
      },
    },
    include: { invoice: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayment(
  userId: string,
  businessId: string,
  paymentId: string
) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      invoice: {
        customerProfile: { userId, businessId },
      },
    },
    include: { invoice: true },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  return payment;
}