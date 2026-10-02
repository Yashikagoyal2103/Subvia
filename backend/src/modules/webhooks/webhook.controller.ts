import crypto from "node:crypto";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { webhookParamsSchema, createWebhookEndpointSchema, updateWebhookEndpointSchema } from "./webhook.schema.js";
import { createWebhookEndpoint, deleteWebhookEndpoint, getWebhookEndpoints, updateWebhookEndpoint } from "./webhook.config.service.js";

export async function create(req: AuthenticatedRequest, res: Response) {
  const { businessId } = webhookParamsSchema.parse(req.params);
  const input = createWebhookEndpointSchema.parse(req.body);
  const secret = `whsec_${crypto.randomBytes(32).toString("hex")}`;

  const endpoint = await createWebhookEndpoint(req.userId, businessId, input, secret);

  return res.status(201).json({
    success: true,
    data: { ...endpoint, secret },
  });
}

export async function list(req: AuthenticatedRequest, res: Response) {
  const { businessId } = webhookParamsSchema.parse(req.params);
  const endpoints = await getWebhookEndpoints(req.userId, businessId);

  return res.status(200).json({
    success: true,
    data: endpoints,
  });
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const { businessId, endpointId } = webhookParamsSchema.parse(req.params);
  const input = updateWebhookEndpointSchema.parse(req.body);

  const endpoint = await updateWebhookEndpoint(req.userId, businessId, endpointId!, input);

  return res.status(200).json({
    success: true,
    data: endpoint,
  });
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  const { businessId, endpointId } = webhookParamsSchema.parse(req.params);

  await deleteWebhookEndpoint(req.userId, businessId, endpointId!);

  return res.status(204).send();
}
