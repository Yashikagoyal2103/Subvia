import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export const updateBusinessSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  taxRate: z.number().int().min(0).max(100).optional(),
}).refine(
  (data) =>
    data.name !== undefined ||
    data.taxRate !== undefined,
  {
    message: "At least one field must be provided.",
  }
);

export const businessIdSchema = z.object({
  id: z.uuid(),
});

export type CreateBusinessInput =
  z.infer<typeof createBusinessSchema>;

export type UpdateBusinessInput =
  z.infer<typeof updateBusinessSchema>;