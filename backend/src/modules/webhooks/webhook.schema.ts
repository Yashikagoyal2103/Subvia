
import { z } from "zod";

export const webhookParamsSchema = z.object({
  businessId: z.uuid(),
  endpointId: z.uuid().optional(),
});

const webhookUrl = z
  .url()
  .max(500)
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Webhook URL must use HTTP or HTTPS.");

export const createWebhookEndpointSchema = z.object({
  url: webhookUrl,
});

export const updateWebhookEndpointSchema = z.object({
  url: webhookUrl.optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
}).refine((input) => input.url !== undefined || input.status !== undefined, {
  message: "At least one field is required.",
});

export type CreateWebhookEndpointInput = z.infer<typeof createWebhookEndpointSchema>;
export type UpdateWebhookEndpointInput = z.infer<typeof updateWebhookEndpointSchema>;
