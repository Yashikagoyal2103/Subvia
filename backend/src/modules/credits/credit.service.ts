import { prisma } from "../../config/prisma.js";
import type { Prisma, Currency } from "../../generated/prisma/client.js";

type CreateCreditInput = {
  customerProfileId: string;
  amount: number;
  currency: Currency;
  description: string;
  invoiceId?: string;
};
type ApplyCreditInput = {
  customerProfileId: string;
  invoiceId: string;
  amount: number;
  currency: Currency;
};

export async function createCredit(
  tx: Prisma.TransactionClient,
  input: CreateCreditInput
) {
  if (input.amount <= 0) {
    throw new Error("INVALID_CREDIT_AMOUNT");
  }

  return tx.creditLedger.create({
    data: {
      customerProfileId: input.customerProfileId,
      amount: input.amount,
      currency: input.currency,
      type: "CREDIT",
      description: input.description,
      invoiceId: input.invoiceId,
    },
  });
}

export async function getCreditBalance(
  userId: string,
  businessId: string
) {
  const customer = await prisma.customerProfile.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId,
      },
    },
  });

  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  const entries = await prisma.creditLedger.findMany({
    where: {
      customerProfileId: customer.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const balanceByCurrency: Record<Currency, number> = {
    INR: 0,
    USD: 0,
  };

  for (const entry of entries) {
    if (entry.type === "CREDIT") {
      balanceByCurrency[entry.currency] += entry.amount;
    } else {
      balanceByCurrency[entry.currency] -= entry.amount;
    }
  }

  return balanceByCurrency;
}

export async function applyCredit(
  tx: Prisma.TransactionClient,
  input: ApplyCreditInput
) {
  if (input.amount < 0) {
    throw new Error("INVALID_CREDIT_AMOUNT");
  }

  if (input.amount === 0) {
    return {
      creditApplied: 0,
      remainingAmount: 0,
    };
  }

  const entries = await tx.creditLedger.findMany({
    where: {
      customerProfileId: input.customerProfileId,
      currency: input.currency,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  let availableCredit = 0;

  for (const entry of entries) {
    if (entry.type === "CREDIT") {
      availableCredit += entry.amount;
    } else {
      availableCredit -= entry.amount;
    }
  }

  availableCredit = Math.max(availableCredit, 0);

  const creditApplied = Math.min(
    availableCredit,
    input.amount
  );

  const remainingAmount = input.amount - creditApplied;

  if (creditApplied > 0) {
    await tx.creditLedger.create({
      data: {
        customerProfileId: input.customerProfileId,
        invoiceId: input.invoiceId,
        amount: creditApplied,
        currency: input.currency,
        type: "DEBIT",
        description: "Credit applied to invoice.",
      },
    });
  }

  return {
    creditApplied,
    remainingAmount,
  };
}