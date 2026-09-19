import { prisma } from "../../config/prisma.js";
import { getPagination, type PaginationInput } from "../../shared/utils/pagination.js";

export async function getAdminCustomers(businessId: string, pagination: PaginationInput) {
  const { skip, take } = getPagination(pagination);

  const customers = await prisma.customerProfile.findMany({
    where: { businessId },
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
  });

  const hasNextPage = customers.length > take;

  return {
    items: hasNextPage ? customers.slice(0, take) : customers,
    pagination: { page: pagination.page, limit: pagination.limit, hasNextPage },
  };
}

export async function getAdminCustomer(businessId: string, customerId: string) {
  const customer = await prisma.customerProfile.findFirst({
    where: { id: customerId, businessId },
    include: {
      user: { select: { id: true, email: true, createdAt: true } },
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

  const subscriptions = await prisma.subscription.findMany({
    where: { customerProfile: { businessId } },
    include: {
      customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
      plan: { include: { service: true } },
      pendingPlan: true,
      _count: { select: { invoices: true, events: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip,
    take: take + 1,
  });

  const hasNextPage = subscriptions.length > take;

  return {
    items: hasNextPage ? subscriptions.slice(0, take) : subscriptions,
    pagination: { page: pagination.page, limit: pagination.limit, hasNextPage },
  };
}

export async function getAdminSubscription(businessId: string, subscriptionId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, customerProfile: { businessId } },
    include: {
      customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
      plan: { include: { service: true } },
      pendingPlan: true,
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

  const invoices = await prisma.invoice.findMany({
    where: { customerProfile: { businessId } },
    include: {
      customerProfile: { select: { id: true, user: { select: { id: true, email: true } } } },
      subscription: { include: { plan: { include: { service: true } } } },
      items: true,
      payments: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip,
    take: take + 1,
  });

  const hasNextPage = invoices.length > take;

  return {
    items: hasNextPage ? invoices.slice(0, take) : invoices,
    pagination: { page: pagination.page, limit: pagination.limit, hasNextPage },
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

  const payments = await prisma.payment.findMany({
    where: { invoice: { customerProfile: { businessId } } },
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
  });

  const hasNextPage = payments.length > take;

  return {
    items: hasNextPage ? payments.slice(0, take) : payments,
    pagination: { page: pagination.page, limit: pagination.limit, hasNextPage },
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

  const events = await prisma.subscriptionEvent.findMany({
    where: { subscription: { customerProfile: { businessId } } },
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
  });

  const hasNextPage = events.length > take;

  return {
    items: hasNextPage ? events.slice(0, take) : events,
    pagination: { page: pagination.page, limit: pagination.limit, hasNextPage },
  };
}