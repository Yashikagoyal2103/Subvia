import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // Zod validation errors
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

  // ─── Auth errors ───
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

  // ─── Business & Customer ───
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

  // ─── Service & Plan ───
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

  // ─── Subscription ───
  if (error.message === "SUBSCRIPTION_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      error: {
        code: "SUBSCRIPTION_NOT_FOUND",
        message: "Subscription not found.",
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

  if (error.message === "CURRENCY_NOT_SUPPORTED") {
    return res.status(400).json({
      success: false,
      error: {
        code: "CURRENCY_NOT_SUPPORTED",
        message: "This plan does not support the selected currency.",
      },
    });
  }

  if (error.message === "ALREADY_ON_PLAN") {
    return res.status(400).json({
      success: false,
      error: {
        code: "ALREADY_ON_PLAN",
        message: "You are already subscribed to this plan.",
      },
    });
  }

  if (error.message === "PENDING_PLAN_CHANGE_EXISTS") {
    return res.status(409).json({
      success: false,
      error: {
        code: "PENDING_PLAN_CHANGE_EXISTS",
        message: "There is already a pending plan change. Please wait for it to complete.",
      },
    });
  }

  // ─── Upgrade / Downgrade ───
  if (error.message === "NOT_AN_UPGRADE") {
    return res.status(400).json({
      success: false,
      error: {
        code: "NOT_AN_UPGRADE",
        message: "The selected plan is not an upgrade.",
      },
    });
  }

  if (error.message === "NOT_A_DOWNGRADE") {
    return res.status(400).json({
      success: false,
      error: {
        code: "NOT_A_DOWNGRADE",
        message: "The selected plan is not a downgrade. Upgrades should use the upgrade endpoint.",
      },
    });
  }

  // ─── Proration ───
  if (error.message === "INVALID_BILLING_PERIOD") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_BILLING_PERIOD",
        message: "Invalid billing period configuration.",
      },
    });
  }

  if (error.message === "INVALID_CHANGE_TIME") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_CHANGE_TIME",
        message: "Plan change time must be within the billing period.",
      },
    });
  }

  // ─── Cancellation ───
  if (error.message === "CANCELLATION_ALREADY_SCHEDULED") {
    return res.status(409).json({
      success: false,
      error: {
        code: "CANCELLATION_ALREADY_SCHEDULED",
        message: "Cancellation is already scheduled for the end of the billing period.",
      },
    });
  }

  // ─── Invoice & Payment ───
  if (error.message === "INVOICE_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      error: {
        code: "INVOICE_NOT_FOUND",
        message: "Invoice not found.",
      },
    });
  }

  if (error.message === "INVOICE_ALREADY_PAID") {
    return res.status(409).json({
      success: false,
      error: {
        code: "INVOICE_ALREADY_PAID",
        message: "This invoice has already been paid.",
      },
    });
  }

  if (error.message === "INVOICE_NOT_PAYABLE") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVOICE_NOT_PAYABLE",
        message: "This invoice cannot be paid. It may be void or draft.",
      },
    });
  }

  if (error.message === "PAYMENT_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      error: {
        code: "PAYMENT_NOT_FOUND",
        message: "Payment not found.",
      },
    });
  }

  // ─── Credits ───
  if (error.message === "INVALID_CREDIT_AMOUNT") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_CREDIT_AMOUNT",
        message: "Credit amount must be greater than zero.",
      },
    });
  }
  if (error.message === "IDEMPOTENCY_KEY_REUSED") {
    return res.status(409).json({
      success: false,
      error: {
        code: "IDEMPOTENCY_KEY_REUSED",
        message: "Idempotency key has already been used with a different request.",
      },
    });
  }

  if (error.message === "IDEMPOTENCY_KEY_REQUIRED") {
    return res.status(400).json({
      success: false,
      error: {
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Idempotency-Key header is required.",
      },
    });
  }
    if (error.message === "API_KEY_EXPIRATION_INVALID") {
    return res.status(400).json({
      success: false,
      error: {
        code: "API_KEY_EXPIRATION_INVALID",
        message: "API key expiration must be in the future.",
      },
    });
  }

  if (error.message === "API_KEY_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      error: {
        code: "API_KEY_NOT_FOUND",
        message: "API key not found.",
      },
    });
  }

  if (error.message === "API_KEY_ALREADY_REVOKED") {
    return res.status(409).json({
      success: false,
      error: {
        code: "API_KEY_ALREADY_REVOKED",
        message: "API key has already been revoked.",
      },
    });
  }

  if (
    error.message === "INVALID_API_KEY" ||
    error.message === "API_KEY_REVOKED" ||
    error.message === "API_KEY_EXPIRED"
  ) {
    return res.status(401).json({
      success: false,
      error: {
        code: error.message,
        message: "Invalid or inactive API key.",
      },
    });
  }
    if (error.message === "BUSINESS_ACCESS_DENIED") {
    return res.status(403).json({
      success: false,
      error: {
        code: "BUSINESS_ACCESS_DENIED",
        message: "You do not have access to this business.",
      },
    });
  }

  if (error.message === "INSUFFICIENT_PERMISSIONS") {
    return res.status(403).json({
      success: false,
      error: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "You do not have permission for this action.",
      },
    });
  }

  // ─── Fallback ───
  console.error(error);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};
