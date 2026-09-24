import { prisma } from "../../config/prisma.js";
import type { CreateBusinessInput, UpdateBusinessInput, } from "./business.schema.js";

export async function createBusiness(
  userId: string,
  input: CreateBusinessInput
) {
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

export async function updateBusiness(
  userId: string,
  businessId: string,
  input: UpdateBusinessInput
) {
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      members: {
        some: {
          userId,
          role: "BUSINESS_ADMIN",
        },
      },
    },
  });

  if (!business) {
    throw new Error("BUSINESS_NOT_FOUND");
  }

  return prisma.business.update({
    where: {
      id: businessId,
    },
    data: input,
  });
}

export async function getMyBusinesses(
  userId: string
) {
  const memberships =
    await prisma.businessMember.findMany({
      where: {
        userId,
        role: "BUSINESS_ADMIN",
      },
      include: {
        business: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  return memberships.map((membership) => ({
    id: membership.business.id,
    name: membership.business.name,
    taxRate: membership.business.taxRate,
    role: membership.role,
    createdAt: membership.business.createdAt,
    updatedAt: membership.business.updatedAt,
  }));
}