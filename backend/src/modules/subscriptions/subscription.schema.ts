import { z } from "zod";

export const createSubscriptionSchema = z.object({
  planId: z.uuid(),
  currency: z.enum(["INR", "USD"]),
});

export const subscriptionParamsSchema = z.object({
  businessId: z.uuid(),
  subscriptionId: z.uuid().optional(),
});
export const upgradeSubscriptionSchema = z.object({
  planId: z.uuid(),
});
export const downgradeSubscriptionSchema = z.object({
  planId: z.uuid(),
});
export const cancelSubscriptionSchema = z.object({
  mode: z.enum(["PERIOD_END", "IMMEDIATE"]),
});

export type DowngradeSubscriptionInput = z.infer<typeof downgradeSubscriptionSchema>;
export type UpgradeSubscriptionInput = z.infer<typeof upgradeSubscriptionSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type SubscriptionParams = z.infer<typeof subscriptionParamsSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;