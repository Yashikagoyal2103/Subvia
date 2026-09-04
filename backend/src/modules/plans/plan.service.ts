import { prisma } from "../../config/prisma.js";
import type { CreatePlanInput, UpdatePlanInput } from "./plan.schema.js";

export async function createPlan(
  businessId: string,
  serviceId: string,
  input: CreatePlanInput
) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId },
  });

  if (!service) throw new Error("SERVICE_NOT_FOUND");

  return prisma.plan.create({
    data: { serviceId, ...input },
  });
}

export async function getPlans(businessId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId },
  });

  if (!service) throw new Error("SERVICE_NOT_FOUND");

  return prisma.plan.findMany({ where: { serviceId } });
}

export async function getPlan(
  businessId: string,
  serviceId: string,
  planId: string
) {
  const plan = await prisma.plan.findFirst({
    where: {
      id: planId,
      serviceId,
      service: { businessId },
    },
  });

  if (!plan) throw new Error("PLAN_NOT_FOUND");

  return plan;
}

export async function updatePlan(
  businessId: string,
  serviceId: string,
  planId: string,
  input: UpdatePlanInput
) {
  const plan = await getPlan(businessId, serviceId, planId);

  return prisma.plan.update({
    where: { id: plan.id },
    data: input,
  });
}