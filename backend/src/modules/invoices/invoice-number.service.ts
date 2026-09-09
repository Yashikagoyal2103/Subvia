import type { Prisma } from "../../generated/prisma/client.js";

export async function generateInvoiceNumber(
  tx: Prisma.TransactionClient,
  date: Date
): Promise<string> {
  const result = await tx.$queryRaw<Array<{ number: bigint }>>`
    SELECT nextval('invoice_number_seq') AS number
  `;

  if (result.length === 0) {
    throw new Error("INVOICE_NUMBER_GENERATION_FAILED");
  }

  const sequenceNumber = result[0].number.toString();

  return `INV-${date.getUTCFullYear()}-${sequenceNumber.padStart(6, "0")}`;
}