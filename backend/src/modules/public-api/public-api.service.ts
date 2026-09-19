import { prisma } from "../../config/prisma.js";

export async function getPublicCatalog(businessId: string) {
  return prisma.service.findMany({
    where: {
      businessId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      plans: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          interval: true,
        },
        orderBy: {
          price: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}