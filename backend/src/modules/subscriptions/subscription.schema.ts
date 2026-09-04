import { z } from "zod";

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  currency: z.enum(["INR", "USD"]),
});

export const subscriptionParamsSchema = z.object({
  businessId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;