import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";

config({
  path: ".env.test",
  override: true,
});

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required. Check backend/.env.test",
  );
}

const testDatabase = new URL(testDatabaseUrl).pathname.slice(1);

if (!testDatabase || !testDatabase.endsWith("_test")) {
  throw new Error(
    `Refusing to run tests against database "${testDatabase}". TEST_DATABASE_URL must point to a *_test database.`,
  );
}

// IMPORTANT:
// Set DATABASE_URL before importing anything that can initialize Prisma.
process.env.DATABASE_URL = testDatabaseUrl;

const { prisma } = await import("../src/config/prisma.js");
const { startTestServer, stopTestServer } = await import("./helpers.js");

async function assertTestDatabase() {
  const result = await prisma.$queryRaw<
    { current_database: string }[]
  >`SELECT current_database()`;

  const currentDatabase = result[0]?.current_database;

  if (currentDatabase !== testDatabase) {
    throw new Error(
      `Refusing to modify database "${currentDatabase}". Expected test database "${testDatabase}".`,
    );
  }
}

async function resetDatabase() {
  await assertTestDatabase();

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "WebhookDelivery",
      "WebhookEndpoint",
      "ApiKey",
      "IdempotencyRecord",
      "CreditLedger",
      "Payment",
      "InvoiceItem",
      "Invoice",
      "SubscriptionEvent",
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

  // Fail closed before the first destructive operation.
  await assertTestDatabase();

  await resetDatabase();
  await startTestServer();
});

beforeEach(async () => {
  // Protect every individual test reset as well.
  await assertTestDatabase();
  await resetDatabase();
});

afterAll(async () => {
  await stopTestServer();
  await prisma.$disconnect();
});
