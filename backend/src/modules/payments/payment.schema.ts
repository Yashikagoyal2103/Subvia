import { z } from "zod";

export const createPaymentSchema = z.object({
  invoiceId: z.uuid(),
  paymentMethod: z.enum(["DEMO", "CARD", "UPI"]),
  result: z.enum(["SUCCESS", "FAILED"]),
});

export const paymentParamsSchema = z.object({
  businessId: z.uuid(),
  paymentId: z.uuid().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;