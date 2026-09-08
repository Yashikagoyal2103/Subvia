export function getBillingPeriod(
  interval: "MONTHLY" | "YEARLY",
  start: Date
) {
  const end = new Date(start);

  if (interval === "MONTHLY") {
    const originalDay = end.getUTCDate();

    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const lastDay = new Date(
      Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth() + 1,
        0
      )
    ).getUTCDate();

    end.setUTCDate(Math.min(originalDay, lastDay));
  } else {
    const originalMonth = end.getUTCMonth();
    const originalDay = end.getUTCDate();

    end.setUTCFullYear(end.getUTCFullYear() + 1);

    // Handle Feb 29 → Feb 28 in a non-leap year.
    if (
      originalMonth === 1 &&
      originalDay === 29 &&
      end.getUTCMonth() !== 1
    ) {
      end.setUTCMonth(1);
      end.setUTCDate(28);
    }
  }

  return end;
}