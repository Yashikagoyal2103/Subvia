import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { getCreditBalance } from "./credit.service.js";

export async function getBalance(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId } = req.params;

  const balance = await getCreditBalance(
    req.userId,
    businessId
  );

  return res.status(200).json({
    success: true,
    data: balance,
  });
}