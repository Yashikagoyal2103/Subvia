import type { ErrorRequestHandler } from "express";

import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = ( error, _req, res, _next ) => {
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
  if (error.message === "BUSINESS_NOT_FOUND") {
  return res.status(404).json({
    success: false,
    error: {
      code: "BUSINESS_NOT_FOUND",
      message: "Business not found or you don't have access.",
      },
    });
  }
  if (error.message === "CUSTOMER_ALREADY_EXISTS") {
  return res.status(409).json({
    success: false,
    error: {
      code: "CUSTOMER_ALREADY_EXISTS",
      message: "You are already a customer of this business.",
    },
  });
}

  if (error.message === "CUSTOMER_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      error: {
        code: "CUSTOMER_NOT_FOUND",
        message: "Customer profile not found.",
      },
    });
  }
  if (error.message === "SERVICE_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      error: {
        code: "SERVICE_NOT_FOUND",
        message: "Service not found.",
      },
    });
  }

  if (error.message === "PLAN_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      error: {
        code: "PLAN_NOT_FOUND",
        message: "Plan not found.",
      },
    });
  }

  if (error.message === "CURRENCY_NOT_SUPPORTED") {
    return res.status(400).json({
      success: false,
      error: {
        code: "CURRENCY_NOT_SUPPORTED",
        message: "This plan does not support the selected currency.",
      },
    });
  }

  if (error.message === "ACTIVE_SUBSCRIPTION_EXISTS") {
    return res.status(409).json({
      success: false,
      error: {
        code: "ACTIVE_SUBSCRIPTION_EXISTS",
        message: "You already have an active subscription for this service.",
      },
    });
  }

  if (error.message === "SUBSCRIPTION_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      error: {
        code: "SUBSCRIPTION_NOT_FOUND",
        message: "Subscription not found.",
      },
    });
  }
  if (error.message === "INVOICE_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      error: {
        code: "INVOICE_NOT_FOUND",
        message: "Invoice not found.",
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

