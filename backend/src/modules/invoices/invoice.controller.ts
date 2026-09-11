import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { invoiceParamsSchema } from "./invoice.schema.js";
import { getInvoice, getInvoices } from "./invoice.service.js";
import { paginationSchema } from "../../shared/utils/pagination.js";

export async function list(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId } =
    invoiceParamsSchema.parse(req.params);

  const pagination = paginationSchema.parse(req.query);

  const result = await getInvoices(
    req.userId,
    businessId,
    pagination
  );

  return res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const { businessId, invoiceId } = invoiceParamsSchema.parse(req.params);
  const invoice = await getInvoice(req.userId, businessId, invoiceId!);

  return res.status(200).json({ success: true, data: invoice });
}