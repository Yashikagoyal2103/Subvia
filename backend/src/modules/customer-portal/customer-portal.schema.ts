import { z } from "zod";

export const customerSubscriptionParamsSchema = z.object({
  subscriptionId: z.uuid(),
});

export const customerInvoiceParamsSchema = z.object({
  invoiceId: z.uuid(),
});