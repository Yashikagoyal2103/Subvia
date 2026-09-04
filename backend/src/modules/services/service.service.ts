import { prisma } from "../../config/prisma.js";
import type { CreateServiceInput, UpdateServiceInput } from "./service.schema.js";

export async function createService(businessId: string, input: CreateServiceInput) {
  return prisma.service.create({ data: { businessId, ...input } });
}

export async function getServices(businessId: string) {
  return prisma.service.findMany({ where: { businessId } });
}

export async function getService(businessId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId },
  });

  if (!service) throw new Error("SERVICE_NOT_FOUND");

  return service;
}

export async function updateService(
  businessId: string,
  serviceId: string,
  input: UpdateServiceInput
) {
  const service = await getService(businessId, serviceId);

  return prisma.service.update({
    where: { id: service.id },
    data: input,
  });
}