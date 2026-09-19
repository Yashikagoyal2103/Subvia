import type { Response, Request } from "express";
import { getPublicCatalog } from "./public-api.service.js";

export async function catalog(
  _req: Request,
  res: Response
) {
  const services = await getPublicCatalog(
    res.locals.businessId
  );

  return res.status(200).json({
    success: true,
    data: services,
  });
}