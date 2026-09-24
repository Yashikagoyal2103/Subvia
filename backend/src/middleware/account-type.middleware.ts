import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { prisma } from "../config/prisma.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

type AccountType = "ADMIN" | "CUSTOMER";

export function requireAccountType(
  ...allowedTypes: AccountType[]
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const authenticatedReq =
      req as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: {
        id: authenticatedReq.userId,
      },
      select: {
        accountType: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "Authenticated user was not found.",
        },
      });
    }

    if (!allowedTypes.includes(user.accountType)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_TYPE_NOT_ALLOWED",
          message:
            "This account type cannot access this resource.",
        },
      });
    }

    next();
  };
}