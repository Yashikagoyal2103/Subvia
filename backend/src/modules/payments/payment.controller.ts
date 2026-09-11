import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { createPaymentSchema, paymentParamsSchema, } from "./payment.schema.js";
import { createPayment, getPayment, getPayments, } from "./payment.service.js";
import { paginationSchema } from "../../shared/utils/pagination.js";

export async function create(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId } =
    paymentParamsSchema.parse(req.params);

  const input = createPaymentSchema.parse(req.body);

  const idempotencyKey =
    req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  const payment = await createPayment(
    req.userId,
    businessId,
    input,
    idempotencyKey
  );

  return res.status(201).json({
    success: true,
    data: payment,
  });
}

export async function list(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId } =
    paymentParamsSchema.parse(req.params);

  const pagination = paginationSchema.parse(req.query);

  const result = await getPayments(
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

export async function getById(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId, paymentId } = paymentParamsSchema.parse(req.params);
  const payment = await getPayment(
    req.userId,
    businessId,
    paymentId!
  );

  return res.status(200).json({ success: true, data: payment });
}