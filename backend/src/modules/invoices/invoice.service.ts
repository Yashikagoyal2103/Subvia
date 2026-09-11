import { prisma } from "../../config/prisma.js";
import { getPagination, type PaginationInput, } from "../../shared/utils/pagination.js";

export async function getInvoices(
  userId: string,
  businessId: string,
  pagination: PaginationInput
) {
  const { skip, take } = getPagination(pagination);

  const invoices = await prisma.invoice.findMany({
    where: {
      customerProfile: {
        userId,
        businessId,
      },
    },
    include: {
      items: true,
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

export async function getInvoice(
  userId: string,
  businessId: string,
  invoiceId: string
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      customerProfile: { userId, businessId },
    },
    include: {
      items: true,
      subscription: {
        include: {
          plan: { include: { service: true } },
        },
      },
    },
  });

  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  return invoice;
}