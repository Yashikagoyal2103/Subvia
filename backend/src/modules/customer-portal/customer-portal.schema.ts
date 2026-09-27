
import { z } from "zod";

export const customerSubscriptionParamsSchema = z.object({
  subscriptionId: z.uuid(),
});

export const customerInvoiceParamsSchema = z.object({
  invoiceId: z.uuid(),
});

export const customerInvoicePaymentSchema = z.object({
  paymentMethod: z.literal("DEMO"),
  result: z.enum(["SUCCESS", "FAILED"]),
});

export type CustomerInvoicePaymentInput = z.infer<
  typeof customerInvoicePaymentSchema
>;
