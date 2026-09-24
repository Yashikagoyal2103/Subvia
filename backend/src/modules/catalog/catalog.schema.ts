import { z } from "zod";

export const catalogQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  currency: z.enum(["INR", "USD"]).optional(),
  interval: z.enum(["MONTHLY", "YEARLY"]).optional(),
  businessId: z.uuid().optional(),
});

export type CatalogQuery = z.infer<
  typeof catalogQuerySchema
>;