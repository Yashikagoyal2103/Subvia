import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { businessIdSchema, createBusinessSchema, updateBusinessSchema, } from "./business.schema.js";
import { createBusiness, getBusiness, updateBusiness, getMyBusinesses, } from "./business.service.js";

export async function create( req: AuthenticatedRequest<{ id: string }>, res: Response) {
  const userId = req.userId;

  const input = createBusinessSchema.parse(req.body);

  const business = await createBusiness(userId, input);

  return res.status(201).json({
    success: true,
    data: business,
  });
}

export async function getById( req: AuthenticatedRequest, res: Response ) {
  const userId = req.userId;

  const { id } = businessIdSchema.parse(req.params);

  const business = await getBusiness(userId, id);

  return res.status(200).json({
    success: true,
    data: business,
  });
}

export async function update(
  req: AuthenticatedRequest,
  res: Response
) {
  const { id } = businessIdSchema.parse(req.params);

  const input = updateBusinessSchema.parse(
    req.body
  );

  const business = await updateBusiness(
    req.userId,
    id,
    input
  );

  return res.status(200).json({
    success: true,
    data: business,
  });
}

export async function getMine(
  req: AuthenticatedRequest,
  res: Response
) {
  const businesses = await getMyBusinesses(
    req.userId
  );

  return res.status(200).json({
    success: true,
    data: businesses,
  });
}