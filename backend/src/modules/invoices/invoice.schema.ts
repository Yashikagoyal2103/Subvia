import { z } from "zod";

export const invoiceParamsSchema = z.object({
  businessId: z.uuid(),
  invoiceId: z.uuid().optional(),
});