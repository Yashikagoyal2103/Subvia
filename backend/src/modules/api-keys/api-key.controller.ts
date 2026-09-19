import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { apiKeyParamsSchema, createApiKeySchema } from "./api-key.schema.js";
import { createApiKey, getApiKeys, revokeApiKey } from "./api-key.service.js";

export async function create(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId } = apiKeyParamsSchema.parse(req.params);
  const input = createApiKeySchema.parse(req.body);

  const apiKey = await createApiKey(
    req.userId,
    businessId,
    input
  );

  return res.status(201).json({
    success: true,
    data: apiKey,
  });
}

export async function list(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId } = apiKeyParamsSchema.parse(req.params);

  const apiKeys = await getApiKeys(
    req.userId,
    businessId
  );

  return res.status(200).json({
    success: true,
    data: apiKeys,
  });
}

export async function revoke(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId, apiKeyId } =
    apiKeyParamsSchema.parse(req.params);

  const apiKey = await revokeApiKey(
    req.userId,
    businessId,
    apiKeyId!
  );

  return res.status(200).json({
    success: true,
    data: apiKey,
  });
}