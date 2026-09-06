import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { createSubscriptionSchema, subscriptionParamsSchema ,upgradeSubscriptionSchema } from "./subscription.schema.js";
import {createSubscription, getSubscription, getSubscriptions ,upgradeSubscription } from "./subscription.service.js";

export async function create(req: AuthenticatedRequest, res: Response) {
  const { businessId } = subscriptionParamsSchema.parse(req.params);
  const input = createSubscriptionSchema.parse(req.body);

  const subscription = await createSubscription( req.userId, businessId, input);

  return res.status(201).json({
    success: true,
    data: subscription,
  });
}

export async function list(req: AuthenticatedRequest, res: Response) {
  const { businessId } = subscriptionParamsSchema.parse(req.params);

  const subscriptions = await getSubscriptions( req.userId, businessId );

  return res.status(200).json({
    success: true,
    data: subscriptions,
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

  const result = await upgradeSubscription(
    req.userId,
    businessId,
    subscriptionId!,
    input
  );

  return res.status(201).json({
    success: true,
    data: result,
  });
}