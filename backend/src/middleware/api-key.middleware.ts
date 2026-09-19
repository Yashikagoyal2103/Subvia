import type { NextFunction, Request, Response } from "express";
import { authenticateApiKey } from "../modules/api-keys/api-key.service.js";

export interface ApiKeyRequest extends Request {
  apiKeyId: string;
  businessId: string;
}

export async function authenticateApiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        code: "API_KEY_REQUIRED",
        message: "API key authentication is required.",
      },
    });
  }

  const key = header.slice("Bearer ".length).trim();

  if (!key) {
    return res.status(401).json({
      success: false,
      error: {
        code: "API_KEY_REQUIRED",
        message: "API key authentication is required.",
      },
    });
  }

  try {
    const result = await authenticateApiKey(key);

    res.locals.apiKeyId = result.apiKeyId;
    res.locals.businessId = result.businessId;

    next();
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "INVALID_API_KEY";

    return res.status(401).json({
      success: false,
      error: {
        code,
        message: "Invalid API key.",
      },
    });
  }
}