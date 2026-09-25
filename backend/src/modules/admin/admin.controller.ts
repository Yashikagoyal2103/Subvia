import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { paginationSchema } from "../../shared/utils/pagination.js";
import { adminListParamsSchema, adminCustomerParamsSchema, adminSubscriptionParamsSchema, adminInvoiceParamsSchema, adminPaymentParamsSchema,addCustomerSchema, } from "./admin.schema.js";
import { getAdminCustomers, getAdminCustomer, getAdminSubscriptions, getAdminSubscription, getAdminInvoices, getAdminInvoice, getAdminPayments, getAdminPayment, getAdminBillingActivity, addCustomerToBusiness } from "./admin.service.js";

export async function listCustomers(req: AuthenticatedRequest, res: Response) {
  const { businessId } = adminListParamsSchema.parse(req.params);
  const pagination = paginationSchema.parse(req.query);
  const result = await getAdminCustomers(businessId, pagination);
  return res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
}

export async function getCustomer(req: AuthenticatedRequest, res: Response) {
  const { businessId, customerId } = adminCustomerParamsSchema.parse(req.params);
  const customer = await getAdminCustomer(businessId, customerId);
  return res.status(200).json({ success: true, data: customer });
}

export async function listSubscriptions(req: AuthenticatedRequest, res: Response) {
  const { businessId } = adminListParamsSchema.parse(req.params);
  const pagination = paginationSchema.parse(req.query);
  const result = await getAdminSubscriptions(businessId, pagination);
  return res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
}

export async function getSubscription(req: AuthenticatedRequest, res: Response) {
  const { businessId, subscriptionId } = adminSubscriptionParamsSchema.parse(req.params);
  const subscription = await getAdminSubscription(businessId, subscriptionId);
  return res.status(200).json({ success: true, data: subscription });
}

export async function listInvoices(req: AuthenticatedRequest, res: Response) {
  const { businessId } = adminListParamsSchema.parse(req.params);
  const pagination = paginationSchema.parse(req.query);
  const result = await getAdminInvoices(businessId, pagination);
  return res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
}

export async function getInvoice(req: AuthenticatedRequest, res: Response) {
  const { businessId, invoiceId } = adminInvoiceParamsSchema.parse(req.params);
  const invoice = await getAdminInvoice(businessId, invoiceId);
  return res.status(200).json({ success: true, data: invoice });
}

export async function listPayments(req: AuthenticatedRequest, res: Response) {
  const { businessId } = adminListParamsSchema.parse(req.params);
  const pagination = paginationSchema.parse(req.query);
  const result = await getAdminPayments(businessId, pagination);
  return res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
}

export async function getPayment(req: AuthenticatedRequest, res: Response) {
  const { businessId, paymentId } = adminPaymentParamsSchema.parse(req.params);
  const payment = await getAdminPayment(businessId, paymentId);
  return res.status(200).json({ success: true, data: payment });
}

export async function listBillingActivity(req: AuthenticatedRequest, res: Response) {
  const { businessId } = adminListParamsSchema.parse(req.params);
  const pagination = paginationSchema.parse(req.query);
  const result = await getAdminBillingActivity(businessId, pagination);
  return res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
}

export async function addCustomer(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { businessId } =
    adminListParamsSchema.parse(req.params);

  const { email } =
    addCustomerSchema.parse(req.body);

  const customer = await addCustomerToBusiness(
    businessId,
    email,
  );

  return res.status(201).json({
    success: true,
    data: customer,
  });
}