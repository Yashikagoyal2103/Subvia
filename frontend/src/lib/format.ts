/**
 * Display-only formatter. Money is stored as integer minor units
 * (per backend contract) — divide by 100 to display.
 */
export function formatMoney(amountMinorUnits: number, currency: string): string {
  const major = amountMinorUnits / 100;

  if (currency === "INR") {
    return `₹${major.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  if (currency === "USD") {
    return `$${major.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${major.toLocaleString()} ${currency}`;
}