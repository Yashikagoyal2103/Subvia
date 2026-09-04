import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { invoiceParamsSchema } from "./invoice.schema.js";
import { getInvoice, getInvoices } from "./invoice.service.js";

export async function list(req: AuthenticatedRequest, res: Response) {
  const { businessId } = invoiceParamsSchema.parse(req.params);
  const invoices = await getInvoices(req.userId, businessId);

  return res.status(200).json({ success: true, data: invoices });
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const { businessId, invoiceId } = invoiceParamsSchema.parse(req.params);
  const invoice = await getInvoice(req.userId, businessId, invoiceId!);

  return res.status(200).json({ success: true, data: invoice });
}