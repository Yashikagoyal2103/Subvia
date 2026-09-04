import { z } from "zod";

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentMethod: z.string().trim().min(2).max(50),
  result: z.enum(["SUCCESS", "FAILED"]),
});

export const paymentParamsSchema = z.object({
  businessId: z.string().uuid(),
  paymentId: z.string().uuid().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;