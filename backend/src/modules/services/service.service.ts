import { prisma } from "../../config/prisma.js";
import { getPagination, type PaginationInput, } from "../../shared/utils/pagination.js";
import type { CreateServiceInput, UpdateServiceInput, } from "./service.schema.js";

export async function createService(
  businessId: string,
  input: CreateServiceInput,
) {
  const existing = await prisma.service.findFirst({
    where: {
      businessId,
      name: {
        equals: input.name,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("SERVICE_NAME_ALREADY_EXISTS");
  }

  return prisma.service.create({
    data: {
      businessId,
      ...input,
    },
  });
}

export async function getServices(
  businessId: string,
  pagination: PaginationInput
) {
  const { skip, take } = getPagination(pagination);

  const services = await prisma.service.findMany({
    where: {
      businessId,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    skip,
    take: take + 1,
  });

  const hasNextPage = services.length > take;

  return {
    items: hasNextPage
      ? services.slice(0, take)
      : services,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      hasNextPage,
    },
  };
}

export async function getService(
  businessId: string,
  serviceId: string
) {
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      businessId,
    },
  });

  if (!service) {
    throw new Error("SERVICE_NOT_FOUND");
  }

  return service;
}

export async function updateService(
  businessId: string,
  serviceId: string,
  input: UpdateServiceInput
) {
  const service = await getService(
    businessId,
    serviceId,
  );

  if (input.name !== undefined) {
    const existing = await prisma.service.findFirst({
      where: {
        businessId,
        id: { not: service.id },
        name: {
          equals: input.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new Error("SERVICE_NAME_ALREADY_EXISTS");
    }
  }

  return prisma.service.update({
    where: {
      id: service.id,
    },
    data: input,
  });
}
