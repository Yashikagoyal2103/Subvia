
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { paginationSchema } from "../../shared/utils/pagination.js";
import {
  cancelSubscriptionSchema,
  downgradeSubscriptionSchema,
  upgradeSubscriptionSchema,
} from "../subscriptions/subscription.schema.js";
import { createPayment } from "../payments/payment.service.js";
import {
  cancelSubscription,
  downgradeSubscription,
  upgradeSubscription,
} from "../subscriptions/subscription.service.js";
import {
  customerInvoiceParamsSchema,
  customerSubscriptionParamsSchema,
  customerInvoicePaymentSchema,
} from "./customer-portal.schema.js";
import {
  getCustomerBillingActivity,
  getCustomerCredits,
  getCustomerInvoice,
  getCustomerInvoices,
  getCustomerSubscription,
  getCustomerSubscriptionEvents,
  getCustomerSubscriptions,
} from "./customer-portal.service.js";

export async function listSubscriptions(
  req: AuthenticatedRequest,
  res: Response,
) {
  const pagination = paginationSchema.parse(req.query);

  const result = await getCustomerSubscriptions(
    req.userId,
    pagination,
  );

  return res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
}

export async function getSubscription(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { subscriptionId } =
    customerSubscriptionParamsSchema.parse(req.params);

  const subscription = await getCustomerSubscription(
    req.userId,
    subscriptionId,
  );

  return res.status(200).json({
    success: true,
    data: subscription,
  });
}

export async function getSubscriptionEvents(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { subscriptionId } =
    customerSubscriptionParamsSchema.parse(req.params);

  const events = await getCustomerSubscriptionEvents(
    req.userId,
    subscriptionId,
  );

  return res.status(200).json({
    success: true,
    data: events,
  });
}

export async function listInvoices(
  req: AuthenticatedRequest,
  res: Response,
) {
  const pagination = paginationSchema.parse(req.query);

  const result = await getCustomerInvoices(
    req.userId,
    pagination,
  );

  return res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
}

export async function getInvoice(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { invoiceId } =
    customerInvoiceParamsSchema.parse(req.params);

  const invoice = await getCustomerInvoice(
    req.userId,
    invoiceId,
  );

  return res.status(200).json({
    success: true,
    data: invoice,
  });
}

export async function getCredits(
  req: AuthenticatedRequest,
  res: Response,
) {
  const credits = await getCustomerCredits(
    req.userId,
  );

  return res.status(200).json({
    success: true,
    data: credits,
  });
}

export async function getBillingActivity(
  req: AuthenticatedRequest,
  res: Response,
) {
  const pagination = paginationSchema.parse(req.query);

  const result = await getCustomerBillingActivity(
    req.userId,
    pagination,
  );

  return res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
}
export async function payCustomerInvoice(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { invoiceId } =
    customerInvoiceParamsSchema.parse(req.params);
  const input = customerInvoicePaymentSchema.parse(req.body);
  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  const invoice = await getCustomerInvoice(
    req.userId,
    invoiceId,
  );

  const result = await createPayment(
    req.userId,
    invoice.subscription.plan.service.businessId,
    {
      invoiceId,
      paymentMethod: input.paymentMethod,
      result: input.result,
    },
    idempotencyKey,
  );

  return res.status(201).json({
    success: true,
    data: result,
  });
}

export async function upgradeCustomerSubscription(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { subscriptionId } =
    customerSubscriptionParamsSchema.parse(req.params);
  const input = upgradeSubscriptionSchema.parse(req.body);
  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  const subscription = await getCustomerSubscription(
    req.userId,
    subscriptionId,
  );

  const result = await upgradeSubscription(
    req.userId,
    subscription.plan.service.businessId,
    subscriptionId,
    input,
    idempotencyKey,
  );

  return res.status(201).json({
    success: true,
    data: result,
  });
}

export async function downgradeCustomerSubscription(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { subscriptionId } =
    customerSubscriptionParamsSchema.parse(req.params);
  const input = downgradeSubscriptionSchema.parse(req.body);
  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  const subscription = await getCustomerSubscription(
    req.userId,
    subscriptionId,
  );

  const result = await downgradeSubscription(
    req.userId,
    subscription.plan.service.businessId,
    subscriptionId,
    input,
    idempotencyKey,
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function cancelCustomerSubscription(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { subscriptionId } =
    customerSubscriptionParamsSchema.parse(req.params);
  const input = cancelSubscriptionSchema.parse(req.body);
  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  const subscription = await getCustomerSubscription(
    req.userId,
    subscriptionId,
  );

  const result = await cancelSubscription(
    req.userId,
    subscription.plan.service.businessId,
    subscriptionId,
    input.mode,
    idempotencyKey,
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
}


