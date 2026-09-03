import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export type CreateBusinessInput = z.infer<
  typeof createBusinessSchema
>;

export const businessIdSchema = z.object({
  id: z.string().uuid(),
});