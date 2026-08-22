import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required.",
      },
    });
  }

const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(
      token,
      env.JWT_SECRET
    );

    if (
      typeof payload === "string" ||
      !payload.sub
    ) {
      throw new Error();
    }

    (req as AuthenticatedRequest).userId =
      payload.sub;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired access token.",
      },
    });
  }
}