import type { BillingInterval } from "../../generated/prisma/client.js";

export function addBillingInterval(
  date: Date,
  interval: BillingInterval
): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  if (interval === "MONTHLY") {
    const targetMonth = month + 1;

    const lastDayOfTargetMonth = new Date(
      Date.UTC(year, targetMonth + 1, 0)
    ).getUTCDate();

    return new Date(
      Date.UTC(
        year,
        targetMonth,
        Math.min(day, lastDayOfTargetMonth),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
      )
    );
  }

  const lastDayOfTargetMonth = new Date(
    Date.UTC(year + 1, month + 1, 0)
  ).getUTCDate();

  return new Date(
    Date.UTC(
      year + 1,
      month,
      Math.min(day, lastDayOfTargetMonth),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}