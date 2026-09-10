import { config } from "dotenv";
import { beforeAll, afterAll, beforeEach } from "vitest";
process.env.NODE_ENV = "test";
import { startTestServer, stopTestServer } from "./helpers.js";

config({ path: ".env.test", override: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required. Check backend/.env.test"
  );
}

process.env.DATABASE_URL = testDatabaseUrl;

const { prisma } = await import("../src/config/prisma.js");

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "IdempotencyRecord",
      "CreditLedger",
      "Payment",
      "InvoiceItem",
      "Invoice",
      "Subscription",
      "Plan",
      "Service",
      "CustomerProfile",
      "BusinessMember",
      "Business",
      "RefreshToken",
      "User"
    CASCADE;
  `);
}

beforeAll(async () => {
  await prisma.$connect();
  await resetDatabase();
  await startTestServer();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await stopTestServer();
  await prisma.$disconnect();
});