export function getBillingPeriod(
  interval: "MONTHLY" | "YEARLY",
  start: Date
) {
  const end = new Date(start);

  if (interval === "MONTHLY") {
    const originalDay = end.getDate();
    end.setDate(1);
    end.setMonth(end.getMonth() + 1);

    const lastDay = new Date(
      end.getFullYear(),
      end.getMonth() + 1,
      0
    ).getDate();

    end.setDate(Math.min(originalDay, lastDay));
  } else {
    const originalMonth = end.getMonth();
    const originalDay = end.getDate();

    end.setFullYear(end.getFullYear() + 1);

    // Handle Feb 29 → Feb 28 in a non-leap year.
    if (
      originalMonth === 1 &&
      originalDay === 29 &&
      end.getMonth() !== 1
    ) {
      end.setMonth(1);
      end.setDate(28);
    }
  }

  return end;
}