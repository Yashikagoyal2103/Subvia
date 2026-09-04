import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { planParamsSchema, createPlanSchema, updatePlanSchema } from "./plan.schema.js";
import { createPlan, getPlan, getPlans, updatePlan } from "./plan.service.js";

export async function create(req: AuthenticatedRequest, res: Response) {
  const { businessId, serviceId } = planParamsSchema.parse(req.params);
  const input = createPlanSchema.parse(req.body);

  const plan = await createPlan(businessId, serviceId, input);

  return res.status(201).json({ success: true, data: plan });
}

export async function list(req: AuthenticatedRequest, res: Response) {
  const { businessId, serviceId } = planParamsSchema.parse(req.params);
  const plans = await getPlans(businessId, serviceId);

  return res.status(200).json({ success: true, data: plans });
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const { businessId, serviceId, planId } = planParamsSchema.parse(req.params);
  const plan = await getPlan(businessId, serviceId, planId!);

  return res.status(200).json({ success: true, data: plan });
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const { businessId, serviceId, planId } = planParamsSchema.parse(req.params);
  const input = updatePlanSchema.parse(req.body);

  const plan = await updatePlan(businessId, serviceId, planId!, input);

  return res.status(200).json({ success: true, data: plan });
}