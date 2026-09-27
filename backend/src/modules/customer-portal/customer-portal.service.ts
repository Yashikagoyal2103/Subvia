
import { prisma } from "../../config/prisma.js";
import {
  getPagination,
  type PaginationInput,
} from "../../shared/utils/pagination.js";

export async function getCustomerSubscriptions(
  userId: string,
  pagination: PaginationInput,
) {
  const { skip, take } = getPagination(pagination);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      customerProfile: {
        userId,
      },
    },
    include: {
      plan: {
        include: {
          service: {
            include: {
              business: true,
            },
          },
        },
      },
      pendingPlan: true,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    skip,
    take: take + 1,
  });

  const hasNextPage = subscriptions.length > take;

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

export async function getCustomerSubscription(
  userId: string,
  subscriptionId: string,
) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      customerProfile: {
        userId,
      },
    },
    include: {
      plan: {
        include: {
          service: {
            include: {
              business: true,
            },
          },
        },
      },
      pendingPlan: true,
    },
  });

  if (!subscription) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  return subscription;
}

export async function getCustomerSubscriptionEvents(
  userId: string,
  subscriptionId: string,
) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      customerProfile: {
        userId,
      },
    },
    select: {
      id: true,
      events: {
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
      },
    },
  });

  if (!subscription) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  return subscription.events;
}

export async function getCustomerInvoices(
  userId: string,
  pagination: PaginationInput,
) {
  const { skip, take } = getPagination(pagination);

  const invoices = await prisma.invoice.findMany({
    where: {
      customerProfile: {
        userId,
      },
    },
    include: {
      items: true,
      subscription: {
        include: {
          plan: {
            include: {
              service: {
                include: {
                  business: true,
                },
              },
            },
          },
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

  const hasNextPage = invoices.length > take;

  return {
    items: hasNextPage
      ? invoices.slice(0, take)
      : invoices,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      hasNextPage,
    },
  };
}

export async function getCustomerInvoice(
  userId: string,
  invoiceId: string,
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      customerProfile: {
        userId,
      },
    },
    include: {
      items: true,
      subscription: {
        include: {
          plan: {
            include: {
              service: {
                include: {
                  business: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  return invoice;
}

export async function getCustomerCredits(userId: string) {
  const entries = await prisma.creditLedger.findMany({
    where: {
      customerProfile: {
        userId,
      },
    },
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" },
    ],
  });

  const balance = {
    INR: 0,
    USD: 0,
  };

  for (const entry of entries) {
    if (entry.type === "CREDIT") {
      balance[entry.currency] += entry.amount;
    } else {
      balance[entry.currency] -= entry.amount;
    }
  }

  return {
    INR: Math.max(balance.INR, 0),
    USD: Math.max(balance.USD, 0),
  };
}

export async function getCustomerBillingActivity(
  userId: string,
  pagination: PaginationInput,
) {
  const { skip, take } = getPagination(pagination);
  const fetchTake = skip + take + 1;

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        customerProfile: {
          userId,
        },
      },
      include: {
        subscription: {
          include: {
            plan: {
              include: {
                service: true,
              },
            },
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: fetchTake,
    }),
    prisma.payment.findMany({
      where: {
        invoice: {
          customerProfile: {
            userId,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: fetchTake,
    }),
  ]);

  const activities = [
    ...invoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      type: "INVOICE" as const,
      createdAt: invoice.createdAt,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      amount: invoice.total,
      currency: invoice.currency,
      service: invoice.subscription.plan.service.name,
    })),
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "PAYMENT" as const,
      createdAt: payment.createdAt,
      invoiceId: payment.invoiceId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
    })),
  ]
    .sort((a, b) => {
      const timeDiff =
        b.createdAt.getTime() - a.createdAt.getTime();
      return timeDiff !== 0 ? timeDiff : b.id.localeCompare(a.id);
    });

  const pageItems = activities.slice(skip, skip + take);

  return {
    items: pageItems,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      hasNextPage: activities.length > skip + take,
    },
  };
}
