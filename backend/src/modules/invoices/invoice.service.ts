import { prisma } from "../../config/prisma.js";

export async function getInvoices(userId: string, businessId: string) {
  return prisma.invoice.findMany({
    where: {
      customerProfile: { userId, businessId },
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
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