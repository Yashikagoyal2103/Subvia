import { prisma } from "../../config/prisma.js";
import type { CreatePlanInput, UpdatePlanInput } from "./plan.schema.js";
import { getPagination, type PaginationInput, } from "../../shared/utils/pagination.js";


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

export async function getPlans(
  businessId: string,
  serviceId: string,
  pagination: PaginationInput
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

  const { skip, take } =
    getPagination(pagination);

  const plans = await prisma.plan.findMany({
    where: {
      serviceId,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    skip,
    take: take + 1,
  });

  const hasNextPage = plans.length > take;

  return {
    items: hasNextPage
      ? plans.slice(0, take)
      : plans,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      hasNextPage,
    },
  };
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