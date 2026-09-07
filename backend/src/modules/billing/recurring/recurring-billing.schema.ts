import { z } from "zod";

export const runRecurringBillingSchema = z.object({
  result: z.enum(["SUCCESS", "FAILED"]),
});

export type RunRecurringBillingInput = z.infer<
  typeof runRecurringBillingSchema
>;