import { prisma } from "../../config/prisma.js";
import type { CreateBusinessInput } from "./business.schema.js";

export async function createBusiness( userId: string, input: CreateBusinessInput ) {
  return prisma.business.create({
    data: {
      name: input.name,

      members: {
        create: {
          userId,
          role: "BUSINESS_ADMIN",
        },
      },
    },
  });
}

export async function getBusiness(
  userId: string,
  businessId: string
) {
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      members: {
        some: {
          userId,
        },
      },
    },
  });

  if (!business) {
    throw new Error("BUSINESS_NOT_FOUND");
  }

  return business;
}