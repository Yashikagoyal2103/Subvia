import type { Response } from "express";
import type { Request } from "express";
import {
  runRecurringBillingSchema,
} from "./recurring-billing.schema.js";
import {
  processDueSubscriptions,
} from "./recurring-billing.service.js";

export async function run(req: Request, res: Response) {
  const input = runRecurringBillingSchema.parse(req.body);

  const result = await processDueSubscriptions(
    new Date(),
    input.result
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
}