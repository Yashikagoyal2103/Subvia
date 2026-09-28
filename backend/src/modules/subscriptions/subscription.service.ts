
import { prisma } from "../../config/prisma.js";
import type {
  CreateSubscriptionInput,
  UpgradeSubscriptionInput,
  DowngradeSubscriptionInput,
  CreateCustomerSubscriptionInput,
} from "./subscription.schema.js";
import { getBillingPeriod } from "../../shared/utils/billing-period.js";
import { calculateProration } from "../billing/proration/proration.service.js";
import { applyCredit, createCredit } from "../credits/credit.service.js";
import { processPayment } from "../payments/payment.service.js";
import {
  createRequestHash,
  startIdempotency,
  completeIdempotency,
} from "../../shared/utils/idempotency.js";
import { generateInvoiceNumber } from "../invoices/invoice-number.service.js";
import {
  getPagination,
  type PaginationInput,
} from "../../shared/utils/pagination.js";
import { calculateTax } from "../billing/tax/tax.service.js";
import { createSubscriptionEvent } from "./subscription-event.service.js";

export async function createSubscription(
  userId: string,
  businessId: string,
  input: CreateSubscriptionInput,
  idempotencyKey: string
) {
  const requestHash = createRequestHash({
    planId: input.planId,
    currency: input.currency,
  });

  return prisma.$transaction(async (tx) => {
    const idempotency = await startIdempotency({
      tx,
      key: idempotencyKey,
      userId,
      businessId,
      operation: "CREATE_SUBSCRIPTION",
      requestHash,
    });

    if (!idempotency.isNew) {
      return idempotency.record.responseBody;
    }

    const plan = await tx.plan.findFirst({
      where: {
        id: input.planId,
        isActive: true,
        service: {
          isActive: true,
          businessId,
        },
      },
      include: {
        service: {
          select: {
            id: true,
            businessId: true,
          },
        },
      },
    });

    if (!plan) {
      throw new Error("PLAN_NOT_FOUND");
    }

    if (plan.currency !== input.currency) {
      throw new Error("CURRENCY_NOT_SUPPORTED");
    }

    const customer = await tx.customerProfile.upsert({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
      update: {},
      create: {
        userId,
        businessId,
      },
    });

    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtext(${`subscription-create:${customer.id}:${plan.serviceId}`})
      )
    `;

    const existingSubscription =
      await tx.subscription.findFirst({
        where: {
          customerProfileId: customer.id,
          status: {
            in: ["PENDING", "ACTIVE"],
          },
          plan: {
            serviceId: plan.serviceId,
          },
        },
      });

    if (existingSubscription) {
      throw new Error("ACTIVE_SUBSCRIPTION_EXISTS");
    }

    const start = new Date();

    const end = getBillingPeriod(
      plan.interval,
      start
    );

    const subscription =
      await tx.subscription.create({
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

    await createSubscriptionEvent(tx, {
      subscriptionId: subscription.id,
      type: "CREATED",
      metadata: {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        currency: plan.currency,
        billingInterval: plan.interval,
      },
    });

    const business = await tx.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        taxRate: true,
      },
    });

    if (!business) {
      throw new Error("BUSINESS_NOT_FOUND");
    }

    const tax = calculateTax(
      plan.price,
      business.taxRate
    );

    const invoiceNumber =
      await generateInvoiceNumber(
        tx,
        start
      );

    const invoice =
      await tx.invoice.create({
        data: {
          invoiceNumber,
          customerProfileId: customer.id,
          subscriptionId: subscription.id,
          status: "OPEN",
          currency: plan.currency,
          subtotal: plan.price,
          taxRate: tax.taxRate,
          taxAmount: tax.taxAmount,
          total: tax.total,
          items: {
            create: {
              description:
                `${plan.name} subscription`,
              quantity: 1,
              unitPrice: plan.price,
              amount: plan.price,
            },
          },
        },
        include: {
          items: true,
        },
      });

    const creditResult = await applyCredit(tx, {
      customerProfileId: customer.id,
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: invoice.currency,
    });

    const adjustedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: { total: creditResult.remainingAmount },
      include: { items: true },
    });

    let finalSubscription = subscription;
    let finalInvoice = adjustedInvoice;

    if (creditResult.remainingAmount === 0) {
      await processPayment(tx, {
        invoiceId: adjustedInvoice.id,
        subscriptionId: subscription.id,
        amount: 0,
        currency: adjustedInvoice.currency,
        paymentMethod: "CREDIT",
        result: "SUCCESS",
      });
      finalSubscription = await tx.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
      finalInvoice = await tx.invoice.findUniqueOrThrow({ where: { id: adjustedInvoice.id }, include: { items: true } });
    }

    const response = {
      subscription: finalSubscription,
      invoice: finalInvoice,
    };

    await completeIdempotency(
      tx,
      idempotency.record.id,
      201,
      response
    );

    return response;
  });
}

export async function getSubscriptions(
  userId: string,
  businessId: string,
  pagination: PaginationInput
) {
  const { skip, take } =
    getPagination(pagination);

  const subscriptions =
    await prisma.subscription.findMany({
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
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      skip,
      take: take + 1,
    });

  const hasNextPage =
    subscriptions.length > take;

  return {
    items: hasNextPage
      ? subscriptions.slice(0, take)
      : subscriptions,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      hasNextPage,
    },
  };
}

export async function getSubscription(
  userId: string,
  businessId: string,
  subscriptionId: string
) {
  const subscription =
    await prisma.subscription.findFirst({
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

export async function getSubscriptionEvents(
  userId: string,
  businessId: string,
  subscriptionId: string
) {
  const subscription =
    await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        customerProfile: {
          userId,
          businessId,
        },
      },
      select: {
        id: true,
      },
    });

  if (!subscription) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  return prisma.subscriptionEvent.findMany({
    where: {
      subscriptionId: subscription.id,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });
}

export async function upgradeSubscription(
  userId: string,
  businessId: string,
  subscriptionId: string,
  input: UpgradeSubscriptionInput,
  idempotencyKey: string
) {
  const requestHash = createRequestHash({
    subscriptionId,
    planId: input.planId,
  });

  return prisma.$transaction(async (tx) => {
    const idempotency = await startIdempotency({
      tx,
      key: idempotencyKey,
      userId,
      businessId,
      operation: "UPGRADE_SUBSCRIPTION",
      requestHash,
    });

    if (!idempotency.isNew) {
      return idempotency.record.responseBody;
    }

    const subscription =
      await tx.subscription.findFirst({
        where: {
          id: subscriptionId,
          status: "ACTIVE",
          customerProfile: {
            userId,
            businessId,
          },
        },
        include: {
          plan: true,
        },
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

    const newPlan =
      await tx.plan.findFirst({
        where: {
          id: input.planId,
          serviceId:
            subscription.plan.serviceId,
          isActive: true,
        },
      });

    if (!newPlan) {
      throw new Error("PLAN_NOT_FOUND");
    }

    if (
      newPlan.currency !==
      subscription.currency
    ) {
      throw new Error(
        "CURRENCY_NOT_SUPPORTED"
      );
    }

    if (
      newPlan.price <=
      subscription.price
    ) {
      throw new Error("NOT_AN_UPGRADE");
    }

    const changeTime = new Date();

    const proration =
      calculateProration({
        oldPlanPrice:
          subscription.price,
        newPlanPrice:
          newPlan.price,
        billingPeriodStart:
          subscription.billingPeriodStart,
        billingPeriodEnd:
          subscription.billingPeriodEnd,
        changeTime,
      });

    const updatedSubscription =
      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          pendingPlanId: newPlan.id,
        },
      });

    const business =
      await tx.business.findUnique({
        where: {
          id: businessId,
        },
        select: {
          taxRate: true,
        },
      });

    if (!business) {
      throw new Error("BUSINESS_NOT_FOUND");
    }

    const tax = calculateTax(
      proration.netAmount,
      business.taxRate
    );

    const invoiceNumber =
      await generateInvoiceNumber(
        tx,
        changeTime
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
            subscription.currency,
          subtotal:
            proration.netAmount,
          taxRate: tax.taxRate,
          taxAmount: tax.taxAmount,
          total: tax.total,
          items: {
            create: [
              {
                description:
                  `${newPlan.name} upgrade charge`,
                quantity: 1,
                unitPrice:
                  proration.newPlanCharge,
                amount:
                  proration.newPlanCharge,
              },
              {
                description:
                  `${subscription.plan.name} unused time credit`,
                quantity: 1,
                unitPrice:
                  -proration.oldPlanCredit,
                amount:
                  -proration.oldPlanCredit,
              },
            ],
          },
        },
        include: {
          items: true,
        },
      });

    const creditResult = await applyCredit(tx, {
      customerProfileId: subscription.customerProfileId,
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: invoice.currency,
    });

    let finalSubscription = updatedSubscription;
    let finalInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: { total: creditResult.remainingAmount },
      include: { items: true },
    });

    if (creditResult.remainingAmount === 0) {
      await processPayment(tx, {
        invoiceId: finalInvoice.id,
        subscriptionId: subscription.id,
        amount: 0,
        currency: finalInvoice.currency,
        paymentMethod: "CREDIT",
        result: "SUCCESS",
      });
      finalSubscription = await tx.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
      finalInvoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoice.id }, include: { items: true } });
    }

    const response = {
      subscription: finalSubscription,
      invoice: finalInvoice,
      proration,
    };

    await completeIdempotency(
      tx,
      idempotency.record.id,
      201,
      response
    );

    return response;
  });
}

export async function downgradeSubscription(
  userId: string,
  businessId: string,
  subscriptionId: string,
  input: DowngradeSubscriptionInput,
  idempotencyKey: string
) {
  const requestHash = createRequestHash({
    subscriptionId,
    planId: input.planId,
  });

  return prisma.$transaction(async (tx) => {
    const idempotency = await startIdempotency({
      tx,
      key: idempotencyKey,
      userId,
      businessId,
      operation: "DOWNGRADE_SUBSCRIPTION",
      requestHash,
    });

    if (!idempotency.isNew) {
      return idempotency.record.responseBody;
    }

    const subscription =
      await tx.subscription.findFirst({
        where: {
          id: subscriptionId,
          status: "ACTIVE",
          customerProfile: {
            userId,
            businessId,
          },
        },
        include: {
          plan: true,
        },
      });

    if (!subscription) {
      throw new Error("SUBSCRIPTION_NOT_FOUND");
    }

    if (
      subscription.planId ===
      input.planId
    ) {
      throw new Error("ALREADY_ON_PLAN");
    }

    if (subscription.pendingPlanId) {
      throw new Error(
        "PENDING_PLAN_CHANGE_EXISTS"
      );
    }

    const newPlan =
      await tx.plan.findFirst({
        where: {
          id: input.planId,
          serviceId:
            subscription.plan.serviceId,
          isActive: true,
        },
      });

    if (!newPlan) {
      throw new Error("PLAN_NOT_FOUND");
    }

    if (
      newPlan.currency !==
      subscription.currency
    ) {
      throw new Error(
        "CURRENCY_NOT_SUPPORTED"
      );
    }

    if (
      newPlan.price >=
      subscription.price
    ) {
      throw new Error(
        "NOT_A_DOWNGRADE"
      );
    }

    const result =
      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          pendingPlanId: newPlan.id,
        },
        include: {
          plan: true,
          pendingPlan: true,
        },
      });

    await createSubscriptionEvent(
      tx,
      {
        subscriptionId:
          subscription.id,
        type:
          "DOWNGRADE_SCHEDULED",
        metadata: {
          fromPlanId:
            subscription.planId,
          fromPlanName:
            subscription.plan.name,
          toPlanId:
            newPlan.id,
          toPlanName:
            newPlan.name,
          effectiveAt:
            subscription.billingPeriodEnd.toISOString(),
        },
      }
    );

    await completeIdempotency(
      tx,
      idempotency.record.id,
      200,
      result
    );

    return result;
  });
}

export async function cancelSubscription(
  userId: string,
  businessId: string,
  subscriptionId: string,
  mode: "PERIOD_END" | "IMMEDIATE",
  idempotencyKey: string
) {
  const requestHash = createRequestHash({
    subscriptionId,
    mode,
  });

  return prisma.$transaction(async (tx) => {
    const idempotency = await startIdempotency({
      tx,
      key: idempotencyKey,
      userId,
      businessId,
      operation: "CANCEL_SUBSCRIPTION",
      requestHash,
    });

    if (!idempotency.isNew) {
      return idempotency.record.responseBody;
    }

    const subscription =
      await tx.subscription.findFirst({
        where: {
          id: subscriptionId,
          status: "ACTIVE",
          customerProfile: {
            userId,
            businessId,
          },
        },
        include: {
          plan: true,
          customerProfile: true,
        },
      });

    if (!subscription) {
      throw new Error("SUBSCRIPTION_NOT_FOUND");
    }

    if (mode === "PERIOD_END") {
      if (subscription.cancelAtPeriodEnd) {
        throw new Error(
          "CANCELLATION_ALREADY_SCHEDULED"
        );
      }

      const result =
        await tx.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            cancelAtPeriodEnd: true,
          },
        });

      await createSubscriptionEvent(
        tx,
        {
          subscriptionId:
            subscription.id,
          type:
            "CANCEL_REQUESTED",
          metadata: {
            mode: "PERIOD_END",
            effectiveAt:
              subscription.billingPeriodEnd.toISOString(),
          },
        }
      );

      await completeIdempotency(
        tx,
        idempotency.record.id,
        200,
        result
      );

      return result;
    }

    const now = new Date();

    const totalPeriodMs =
      subscription.billingPeriodEnd.getTime() -
      subscription.billingPeriodStart.getTime();

    const remainingMs =
      Math.max(
        subscription.billingPeriodEnd.getTime() -
          now.getTime(),
        0
      );

    const unusedAmount =
      totalPeriodMs > 0
        ? Math.floor(
            (subscription.price *
              remainingMs) /
              totalPeriodMs
          )
        : 0;

    if (unusedAmount > 0) {
      await createCredit(tx, {
        customerProfileId:
          subscription.customerProfileId,
        amount: unusedAmount,
        currency:
          subscription.currency,
        description:
          "Credit from immediate subscription cancellation.",
      });
    }

    const result =
      await tx.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: "CANCELLED",
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
          mode: "IMMEDIATE",
          creditCreated:
            unusedAmount,
        },
      }
    );

    await completeIdempotency(
      tx,
      idempotency.record.id,
      200,
      result
    );

    return result;
  });
}

export async function createCustomerSubscription(
  userId: string,
  input: CreateCustomerSubscriptionInput,
  idempotencyKey: string
) {
  const plan = await prisma.plan.findFirst({
    where: {
      id: input.planId,
      isActive: true,
      service: {
        isActive: true,
      },
    },
    select: {
      id: true,
      currency: true,
      service: {
        select: {
          businessId: true,
        },
      },
    },
  });

  if (!plan) {
    throw new Error("PLAN_NOT_FOUND");
  }

  if (plan.currency !== input.currency) {
    throw new Error("CURRENCY_NOT_SUPPORTED");
  }

  return createSubscription(
    userId,
    plan.service.businessId,
    {
      planId: plan.id,
      currency: input.currency,
    },
    idempotencyKey
  );
}
