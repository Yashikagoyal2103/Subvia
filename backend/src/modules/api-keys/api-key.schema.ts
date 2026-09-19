import { z } from "zod";

export const apiKeyParamsSchema = z.object({
  businessId: z.uuid(),
  apiKeyId: z.uuid().optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  expiresAt: z.coerce.date().optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;