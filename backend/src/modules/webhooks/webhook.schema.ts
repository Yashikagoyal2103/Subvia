import { z } from "zod";

export const webhookParamsSchema = z.object({
  businessId: z.uuid(),
  endpointId: z.uuid().optional(),
});

export const createWebhookEndpointSchema = z.object({
  url: z.url().max(500),
});

export const updateWebhookEndpointSchema = z.object({
  url: z.url().max(500).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
}).refine((input) => input.url !== undefined || input.status !== undefined, {
  message: "At least one field is required.",
});

export type CreateWebhookEndpointInput = z.infer<typeof createWebhookEndpointSchema>;
export type UpdateWebhookEndpointInput = z.infer<typeof updateWebhookEndpointSchema>;