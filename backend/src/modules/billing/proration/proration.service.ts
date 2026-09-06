export interface ProrationInput {
  oldPlanPrice: number;
  newPlanPrice: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  changeTime: Date;
}

export interface ProrationResult {
  oldPlanCredit: number;
  newPlanCharge: number;
  netAmount: number;
}

export function calculateProration(
  input: ProrationInput
): ProrationResult {
  const {
    oldPlanPrice,
    newPlanPrice,
    billingPeriodStart,
    billingPeriodEnd,
    changeTime,
  } = input;

  const totalTime =
    billingPeriodEnd.getTime() - billingPeriodStart.getTime();

  const remainingTime =
    billingPeriodEnd.getTime() - changeTime.getTime();

  if (totalTime <= 0) {
    throw new Error("INVALID_BILLING_PERIOD");
  }

  if (changeTime <= billingPeriodStart || changeTime >= billingPeriodEnd) {
    throw new Error("INVALID_CHANGE_TIME");
  }

  const remainingRatio = remainingTime / totalTime;

  const oldPlanCredit = Math.round(oldPlanPrice * remainingRatio);
  const newPlanCharge = Math.round(newPlanPrice * remainingRatio);
  const netAmount = newPlanCharge - oldPlanCredit;

  return {
    oldPlanCredit,
    newPlanCharge,
    netAmount,
  };
}