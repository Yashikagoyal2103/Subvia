import type {
  ErrorRequestHandler,
} from "express";

import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data.",
        details: error.issues,
      },
    });
  }

  if (error.message === "USER_ALREADY_EXISTS") {
    return res.status(409).json({
      success: false,
      error: {
        code: "USER_ALREADY_EXISTS",
        message: "A user with this email already exists.",
      },
    });
  }

  if (error.message === "INVALID_CREDENTIALS") {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
  }

  if (error.message === "INVALID_REFRESH_TOKEN") {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid or expired refresh token.",
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};