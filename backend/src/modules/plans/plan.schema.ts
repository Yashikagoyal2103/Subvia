import { z } from "zod";

export const planParamsSchema = z.object({
  businessId: z.uuid(),
  serviceId: z.uuid(),
  planId: z.uuid().optional(),
});

export const createPlanSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  price: z.number().int().positive(),
  currency: z.enum(["INR", "USD"]),
  interval: z.enum(["MONTHLY", "YEARLY"]),
});

export const updatePlanSchema = createPlanSchema.partial();

export type PlanParams = z.infer<typeof planParamsSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

