import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { paginationSchema } from "../../shared/utils/pagination.js";
import {
  customerInvoiceParamsSchema,
  customerSubscriptionParamsSchema,
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