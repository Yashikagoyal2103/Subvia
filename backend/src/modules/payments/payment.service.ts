import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import type { CreatePaymentInput } from "./payment.schema.js";
import type { Prisma, Currency } from "../../generated/prisma/client.js";

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
        pendingPlan: true,
      },
    });

    if (!subscription) {
      throw new Error("SUBSCRIPTION_NOT_FOUND");
    }

    if (subscription.pendingPlan) {
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
  input: CreatePaymentInput
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: input.invoiceId,
      customerProfile: { userId, businessId },
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

  return prisma.$transaction(async (tx) => {
    return processPayment(tx, {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscriptionId,
      amount: invoice.total,
      currency: invoice.currency,
      paymentMethod: input.paymentMethod,
      result: input.result,
    });
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