import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import { prisma } from "../config/prisma.js";

type BusinessParams = {
  businessId: string;
};

export function requireBusinessRole(
  ...allowedRoles: ("BUSINESS_ADMIN" | "CUSTOMER")[]
) {
  return async (
    req: AuthenticatedRequest<BusinessParams>,
    res: Response,
    next: NextFunction
  ) => {
    const { businessId } = req.params;

    const userId = req.userId;

    const membership = await prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: "BUSINESS_ACCESS_DENIED",
          message: "You do not have access to this business.",
        },
      });
    }

    if (!allowedRoles.includes(membership.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "You do not have permission for this action.",
        },
      });
    }

    next();
  };
}