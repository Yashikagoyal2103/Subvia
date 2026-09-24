import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { catalogQuerySchema } from "./catalog.schema.js";
import { getCustomerCatalog } from "./catalog.service.js";

export async function list(
  req: AuthenticatedRequest,
  res: Response
) {
  const query = catalogQuerySchema.parse(
    req.query
  );

  const catalog =
    await getCustomerCatalog(query);

  return res.status(200).json({
    success: true,
    data: catalog,
  });
}