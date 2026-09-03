import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import { businessIdSchema } from "./customer.schema.js";
import { getCustomerProfile } from "./customer.service.js";

export async function getByBusiness( req: AuthenticatedRequest, res: Response) {
  const userId = req.userId;

  const { businessId } = businessIdSchema.parse(req.params);

  const customer = await getCustomerProfile(
    userId,
    businessId
  );

  return res.status(200).json({
    success: true,
    data: customer,
  });
}