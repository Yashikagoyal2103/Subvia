export interface TaxCalculation {
  taxRate: number;
  taxAmount: number;
  total: number;
}

export function calculateTax(
  subtotal: number,
  taxRate: number
): TaxCalculation {
  if (subtotal < 0) {
    throw new Error("INVALID_TAX_SUBTOTAL");
  }

  if (taxRate < 0 || taxRate > 100) {
    throw new Error("INVALID_TAX_RATE");
  }

  const taxAmount = Math.round(
    (subtotal * taxRate) / 100
  );

  return {
    taxRate,
    taxAmount,
    total: subtotal + taxAmount,
  };
}