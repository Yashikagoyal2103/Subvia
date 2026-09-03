import { prisma } from "../../config/prisma.js";

export async function getCustomerProfile(userId: string, businessId: string ) {
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

  return customer;
}