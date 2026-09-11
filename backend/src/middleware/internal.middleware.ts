import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

function secureTokenMatch(
  providedToken: string,
  expectedToken: string
): boolean {
  const provided = Buffer.from(providedToken);
  const expected = Buffer.from(expectedToken);

  if (provided.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(provided, expected);
}

export function internalOnly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const providedToken = req.header("X-Internal-Token");

  if (
    !providedToken ||
    !secureTokenMatch(
      providedToken,
      env.INTERNAL_BILLING_SECRET
    )
  ) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INTERNAL_AUTHENTICATION_FAILED",
        message: "Internal authentication required.",
      },
    });
  }

  next();
}