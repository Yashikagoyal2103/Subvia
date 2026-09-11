import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { createSubscriptionSchema, subscriptionParamsSchema ,upgradeSubscriptionSchema, downgradeSubscriptionSchema, cancelSubscriptionSchema } from "./subscription.schema.js";
import {createSubscription, getSubscription, getSubscriptions ,upgradeSubscription , downgradeSubscription, cancelSubscription } from "./subscription.service.js";
import { paginationSchema } from "../../shared/utils/pagination.js";

export async function create(req: AuthenticatedRequest, res: Response) {
  const { businessId } = subscriptionParamsSchema.parse(req.params);
  const input = createSubscriptionSchema.parse(req.body);

  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  const subscription = await createSubscription(
    req.userId,
    businessId,
    input,
    idempotencyKey
  );

  return res.status(201).json({
    success: true,
    data: subscription,
  });
}

export async function list(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId } =
    subscriptionParamsSchema.parse(req.params);

  const pagination = paginationSchema.parse(req.query);

  const result = await getSubscriptions(
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
  const { businessId, subscriptionId } =
    subscriptionParamsSchema.parse(req.params);

  const subscription = await getSubscription(
    req.userId,
    businessId,
    subscriptionId!
  );

  return res.status(200).json({
    success: true,
    data: subscription,
  });
}

export async function upgrade(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId, subscriptionId } =
    subscriptionParamsSchema.parse(req.params);

  const input = upgradeSubscriptionSchema.parse(req.body);

  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  const result = await upgradeSubscription(
    req.userId,
    businessId,
    subscriptionId!,
    input,
    idempotencyKey
  );

  return res.status(201).json({
    success: true,
    data: result,
  });
}

export async function downgrade(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId, subscriptionId } =
    subscriptionParamsSchema.parse(req.params);

  const input = downgradeSubscriptionSchema.parse(req.body);

  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  const result = await downgradeSubscription(
    req.userId,
    businessId,
    subscriptionId!,
    input,
    idempotencyKey
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function cancel(
  req: AuthenticatedRequest,
  res: Response
) {
  const { businessId, subscriptionId } =
    subscriptionParamsSchema.parse(req.params);

  const input = cancelSubscriptionSchema.parse(req.body);

  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  const result = await cancelSubscription(
    req.userId,
    businessId,
    subscriptionId!,
    input.mode,
    idempotencyKey
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
}