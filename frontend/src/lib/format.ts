/**
 * Display-only formatters. Money is stored as integer minor units
 * (backend contract) — divide by 100 to display.
 */

export function formatMoney(amountMinorUnits: number, currency: string): string {
  const major = amountMinorUnits / 100;
  const negative = major < 0;
  const abs = Math.abs(major);
  const sign = negative ? "-" : "";

  if (currency === "INR") {
    return `${sign}₹${abs.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  if (currency === "USD") {
    return `${sign}$${abs.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${sign}${abs.toLocaleString()} ${currency}`;
}

export interface MoneyParts {
  symbol: string;
  whole: string;
  decimals: string;
  negative: boolean;
}

export function formatMoneyParts(
  amountMinorUnits: number,
  currency: string,
): MoneyParts {
  const major = amountMinorUnits / 100;
  const negative = major < 0;
  const abs = Math.abs(major);

  let symbol = currency;
  let locale = "en-US";

  if (currency === "INR") { symbol = "₹"; locale = "en-IN"; }
  else if (currency === "USD") { symbol = "$"; locale = "en-US"; }

  const formatted = abs.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const dot = formatted.lastIndexOf(".");
  const whole = dot >= 0 ? formatted.slice(0, dot) : formatted;
  const decimals = dot >= 0 ? formatted.slice(dot) : "";

  return { symbol, whole, decimals, negative };
}