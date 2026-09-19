import { z } from "zod";

export const adminListParamsSchema = z.object({ businessId: z.uuid() });

export const adminCustomerParamsSchema = z.object({ businessId: z.uuid(), customerId: z.uuid() });
export const adminSubscriptionParamsSchema = z.object({ businessId: z.uuid(), subscriptionId: z.uuid() });
export const adminInvoiceParamsSchema = z.object({ businessId: z.uuid(), invoiceId: z.uuid() });
export const adminPaymentParamsSchema = z.object({ businessId: z.uuid(), paymentId: z.uuid() });