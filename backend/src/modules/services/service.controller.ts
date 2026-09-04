import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { createServiceSchema, serviceParamsSchema, updateServiceSchema } from "./service.schema.js";
import { createService, getService, getServices, updateService } from "./service.service.js";

export async function create(req: AuthenticatedRequest, res: Response) {
  const { businessId } = serviceParamsSchema.parse(req.params);
  const input = createServiceSchema.parse(req.body);

  const service = await createService(businessId, input);

  return res.status(201).json({ success: true, data: service });
}

export async function list(req: AuthenticatedRequest, res: Response) {
  const { businessId } = serviceParamsSchema.parse(req.params);
  const services = await getServices(businessId);

  return res.status(200).json({ success: true, data: services });
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const { businessId, serviceId } = serviceParamsSchema.parse(req.params);
  const service = await getService(businessId, serviceId!);

  return res.status(200).json({ success: true, data: service });
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const { businessId, serviceId } = serviceParamsSchema.parse(req.params);
  const input = updateServiceSchema.parse(req.body);

  const service = await updateService(businessId, serviceId!, input);

  return res.status(200).json({ success: true, data: service });
}