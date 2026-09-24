import { config } from "dotenv";
import { beforeAll, afterAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
config({ path: ".env.test", override: true });

const { startTestServer, stopTestServer } = await import("./helpers.js");
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL is required. Check backend/.env.test");
process.env.DATABASE_URL = testDatabaseUrl;

const { prisma } = await import("../src/config/prisma.js");

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "WebhookDelivery", "WebhookEndpoint", "ApiKey", "IdempotencyRecord",
      "CreditLedger", "Payment", "InvoiceItem", "Invoice", "SubscriptionEvent",
      "Subscription", "Plan", "Service", "CustomerProfile", "BusinessMember",
      "Business", "RefreshToken", "User"
    CASCADE;
  `);
}

beforeAll(async () => {
  await prisma.$connect();
  await resetDatabase();
  await startTestServer();
});

beforeEach(resetDatabase);

afterAll(async () => {
  await stopTestServer();
  await prisma.$disconnect();
});
