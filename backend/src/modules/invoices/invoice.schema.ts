import { z } from "zod";

export const invoiceParamsSchema = z.object({
  businessId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
});