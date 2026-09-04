import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import type { CreatePaymentInput } from "./payment.schema.js";

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

  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  if (invoice.status === "PAID") {
    throw new Error("INVOICE_ALREADY_PAID");
  }

  if (invoice.status !== "OPEN") {
    throw new Error("INVOICE_NOT_PAYABLE");
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.total,
        currency: invoice.currency,
        status: input.result,
        paymentMethod: input.paymentMethod,
        transactionId: input.result === "SUCCESS" ? crypto.randomUUID() : null,
        failureReason:
          input.result === "FAILED" ? "Simulated payment failure." : null,
      },
    });

    if (input.result === "SUCCESS") {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      await tx.subscription.update({
        where: { id: invoice.subscriptionId },
        data: { status: "ACTIVE" },
      });
    }

    return payment;
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

  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  return payment;
}