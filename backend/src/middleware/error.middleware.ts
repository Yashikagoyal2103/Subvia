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
  if (error.message === "PENDING_PLAN_CHANGE_EXISTS") {
  return res.status(409).json({
    success: false,
    error: {
      code: "PENDING_PLAN_CHANGE_EXISTS",
      message: "There is already a pending plan change. Please wait for it to complete.",
    },
  });
}

if (error.message === "NOT_AN_UPGRADE") {
  return res.status(400).json({
    success: false,
    error: {
      code: "NOT_AN_UPGRADE",
      message: "The selected plan is not an upgrade. Downgrades are not supported at this time.",
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

  console.error(error);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
  
};

