import { prisma } from "../../config/prisma.js";
import { getPagination, type PaginationInput } from "../../shared/utils/pagination.js";

export async function getAdminCustomers(businessId: string, pagination: PaginationInput) {
  const { skip, take } = getPagination(pagination);
  const where = { businessId };

  const [customers, total] = await Promise.all([
    prisma.customerProfile.findMany({
      where,
      select: {
        id: true,
        userId: true,
        createdAt: true,
        user: { select: { id: true, email: true, createdAt: true } },
        _count: { select: { subscriptions: true, invoices: true, creditLedger: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: take + 1,
    }),
    prisma.customerProfile.count({ where }),
  ]);

  const hasNextPage = customers.length > take;

  return {
    items: hasNextPage ? customers.slice(0, take) : customers,
    pagination: { page: pagination.page, limit: pagination.limit, total, hasNextPage },
  };
}

export async function getAdminCustomer(businessId: string, customerId: string) {
  const customer = await prisma.customerProfile.findFirst({
    where: { id: customerId, businessId },
    include: {
      user: { select: { id: true, email: true, createdAt: true } },
      _count: { select: { subscriptions: true, invoices: true, creditLedger: true } },
      subscriptions: {
        include: { plan: { include: { service: true } }, pendingPlan: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      },
      invoices: {
        select: { id: true, invoiceNumber: true, status: true, currency: true, total: true, issuedAt: true, paidAt: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      },
    },
  });

  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");

  return customer;
}

export async function getAdminSubscriptions(businessId: string, pagination: PaginationInput) {
  const { skip, take } = getPagination(pagination);
  const where = { customerProfile: { businessId } };

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
        plan: { include: { service: true } },
        pendingPlan: true,
        _count: { select: { invoices: true, events: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: take + 1,
    }),
    prisma.subscription.count({ where }),
  ]);

  const hasNextPage = subscriptions.length > take;

  return {
    items: hasNextPage ? subscriptions.slice(0, take) : subscriptions,
    pagination: { page: pagination.page, limit: pagination.limit, total, hasNextPage },
  };
}

export async function getAdminSubscription(businessId: string, subscriptionId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, customerProfile: { businessId } },
    include: {
      customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
      plan: { include: { service: true } },
      pendingPlan: true,
      _count: { select: { invoices: true, events: true } },
      invoices: {
        include: { items: true, payments: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      },
      events: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
    },
  });

  if (!subscription) throw new Error("SUBSCRIPTION_NOT_FOUND");

  return subscription;
}

export async function getAdminInvoices(businessId: string, pagination: PaginationInput) {
  const { skip, take } = getPagination(pagination);
  const where = { customerProfile: { businessId } };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
        subscription: { include: { plan: { include: { service: true } } } },
        items: true,
        payments: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: take + 1,
    }),
    prisma.invoice.count({ where }),
  ]);

  const hasNextPage = invoices.length > take;

  return {
    items: hasNextPage ? invoices.slice(0, take) : invoices,
    pagination: { page: pagination.page, limit: pagination.limit, total, hasNextPage },
  };
}

export async function getAdminInvoice(businessId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, customerProfile: { businessId } },
    include: {
      customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
      subscription: { include: { plan: { include: { service: true } } } },
      items: true,
      payments: true,
    },
  });

  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  return invoice;
}

export async function getAdminPayments(businessId: string, pagination: PaginationInput) {
  const { skip, take } = getPagination(pagination);
  const where = { invoice: { customerProfile: { businessId } } };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            currency: true,
            customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
            subscription: { select: { id: true, plan: { select: { id: true, name: true, service: { select: { id: true, name: true } } } } } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: take + 1,
    }),
    prisma.payment.count({ where }),
  ]);

  const hasNextPage = payments.length > take;

  return {
    items: hasNextPage ? payments.slice(0, take) : payments,
    pagination: { page: pagination.page, limit: pagination.limit, total, hasNextPage },
  };
}

export async function getAdminPayment(businessId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, invoice: { customerProfile: { businessId } } },
    include: {
      invoice: {
        include: {
          customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
          subscription: { include: { plan: { include: { service: true } } } },
          items: true,
        },
      },
    },
  });

  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  return payment;
}

export async function getAdminBillingActivity(businessId: string, pagination: PaginationInput) {
  const { skip, take } = getPagination(pagination);
  const where = { subscription: { customerProfile: { businessId } } };

  const [events, total] = await Promise.all([
    prisma.subscriptionEvent.findMany({
      where,
      include: {
        subscription: {
          select: {
            id: true,
            status: true,
            customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
            plan: { select: { id: true, name: true, service: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: take + 1,
    }),
    prisma.subscriptionEvent.count({ where }),
  ]);

  const hasNextPage = events.length > take;

  return {
    items: hasNextPage ? events.slice(0, take) : events,
    pagination: { page: pagination.page, limit: pagination.limit, total, hasNextPage },
  };
}

export async function getAdminDashboard(businessId: string) {
  const [
    services,
    customers,
    subscriptionGroups,
    invoices,
    paidInvoices,
    payments,
    successfulPayments,
  ] = await Promise.all([
    prisma.service.count({ where: { businessId } }),
    prisma.customerProfile.count({ where: { businessId } }),
    prisma.subscription.groupBy({
      by: ["status"],
      where: { customerProfile: { businessId } },
      _count: { _all: true },
    }),
    prisma.invoice.count({ where: { customerProfile: { businessId } } }),
    prisma.invoice.count({ where: { customerProfile: { businessId }, status: "PAID" } }),
    prisma.payment.count({ where: { invoice: { customerProfile: { businessId } } } }),
    prisma.payment.count({ where: { invoice: { customerProfile: { businessId } }, status: "SUCCESS" } }),
  ]);

  const byStatus = Object.fromEntries(
    subscriptionGroups.map((group) => [group.status, group._count._all]),
  );

  return {
    services,
    customers,
    subscriptions: {
      total: subscriptionGroups.reduce((sum, group) => sum + group._count._all, 0),
      active: byStatus.ACTIVE ?? 0,
      pending: byStatus.PENDING ?? 0,
      pastDue: byStatus.PAST_DUE ?? 0,
      cancelled: byStatus.CANCELLED ?? 0,
    },
    invoices: { total: invoices, paid: paidInvoices },
    payments: { total: payments, successful: successfulPayments },
  };
}

export async function addCustomerToBusiness(
  businessId: string,
  email: string,
) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, accountType: true },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.accountType !== "CUSTOMER") throw new Error("CUSTOMER_ACCOUNT_REQUIRED");

  const existingProfile = await prisma.customerProfile.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });

  if (existingProfile) throw new Error("CUSTOMER_ALREADY_EXISTS");

  return prisma.customerProfile.create({
    data: { userId: user.id, businessId },
    include: { user: { select: { id: true, email: true, createdAt: true } } },
  });
}
