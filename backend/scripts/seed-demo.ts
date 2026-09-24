// backend/scripts/seed-demo.ts

import "dotenv/config";
import crypto from "node:crypto";

const API =
  process.env.SEED_API_URL ??
  "http://localhost:3000/api/v1";

const ADMIN_EMAIL = "demo.admin@saasbilling.local";
const CUSTOMER_EMAIL = "demo.customer@saasbilling.local";
const PASSWORD = "DemoPassword123!";

type Json = Record<string, any>;

async function request(
  path: string,
  options: RequestInit = {},
  token?: string,
) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token
        ? { authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers ?? {}),
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }

  return body as Json;
}

async function registerOrLogin(
  email: string,
  input: {
    firstName: string;
    lastName: string;
    intent: "ADMIN" | "CUSTOMER";
  }
) {
  try {
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        intent: input.intent,
      }),
    });
  } catch (error) {
    if (!String(error).includes("USER_ALREADY_EXISTS")) {
      throw error;
    }
  }

  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: PASSWORD,
    }),
  });

  return result.data.accessToken as string;
}

async function createBusiness(
  token: string,
  name: string,
) {
  const result = await request(
    "/businesses",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
    token,
  );

  return result.data;
}

async function createService(
  token: string,
  businessId: string,
  name: string,
  description: string,
) {
  const result = await request(
    `/businesses/${businessId}/services`,
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
      }),
    },
    token,
  );

  return result.data;
}

async function createPlan(
  token: string,
  businessId: string,
  serviceId: string,
  input: {
    name: string;
    description: string;
    price: number;
    currency: "INR" | "USD";
    interval: "MONTHLY" | "YEARLY";
  },
) {
  const result = await request(
    `/businesses/${businessId}/services/${serviceId}/plans`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );

  return result.data;
}

async function createSubscription(
  token: string,
  businessId: string,
  planId: string,
  key: string,
) {
  const result = await request(
    `/businesses/${businessId}/subscriptions`,
    {
      method: "POST",
      headers: {
        "Idempotency-Key": key,
      },
      body: JSON.stringify({
        planId,
        currency: "INR",
      }),
    },
    token,
  );

  return result.data;
}

async function pay(
  token: string,
  businessId: string,
  invoiceId: string,
  result: "SUCCESS" | "FAILED",
) {
  const response = await request(
    `/businesses/${businessId}/payments`,
    {
      method: "POST",
      headers: {
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        invoiceId,
        paymentMethod: "DEMO",
        result,
      }),
    },
    token,
  );

  return response.data;
}

async function main() {
  console.log(
    "\n🌱 Creating SaaS Billing demo data...\n",
  );

  /*
   * --------------------------------------------------
   * 1. Demo users
   * --------------------------------------------------
   */

  const adminToken = await registerOrLogin(
    ADMIN_EMAIL,
    {
      firstName: "Demo",
      lastName: "Admin",
      intent: "ADMIN",
    }
  );

  const customerToken = await registerOrLogin(
    CUSTOMER_EMAIL,
    {
      firstName: "Demo",
      lastName: "Customer",
      intent: "CUSTOMER",
    }
  );

  /*
   * --------------------------------------------------
   * 2. Business
   * --------------------------------------------------
   */

  const business = await createBusiness(
    adminToken,
    "CloudBox",
  );

  console.log(
    `Business created: ${business.name}`,
  );

  /*
   * --------------------------------------------------
   * 3. Services
   * --------------------------------------------------
   */

  const storage = await createService(
    adminToken,
    business.id,
    "Cloud Storage",
    "Reliable storage subscriptions for teams and growing businesses.",
  );

  const analytics = await createService(
    adminToken,
    business.id,
    "Analytics",
    "Subscription analytics and reporting for growing teams.",
  );

  const database = await createService(
    adminToken,
    business.id,
    "Managed Database",
    "Managed database plans for production applications.",
  );

  const collaboration = await createService(
    adminToken,
    business.id,
    "Team Collaboration",
    "Collaboration tools for distributed teams.",
  );

  /*
   * --------------------------------------------------
   * 4. Storage plans
   * --------------------------------------------------
   */

  const storageStarter = await createPlan(
    adminToken,
    business.id,
    storage.id,
    {
      name: "Starter",
      description:
        "Essential storage for individuals and small projects.",
      price: 29900,
      currency: "INR",
      interval: "MONTHLY",
    },
  );

  const storagePro = await createPlan(
    adminToken,
    business.id,
    storage.id,
    {
      name: "Pro",
      description:
        "More capacity for growing teams.",
      price: 69900,
      currency: "INR",
      interval: "MONTHLY",
    },
  );

  const storageBusiness = await createPlan(
    adminToken,
    business.id,
    storage.id,
    {
      name: "Business",
      description:
        "Higher limits for established teams.",
      price: 149900,
      currency: "INR",
      interval: "MONTHLY",
    },
  );

  /*
   * --------------------------------------------------
   * 5. Analytics plans
   * --------------------------------------------------
   */

  const analyticsBasic = await createPlan(
    adminToken,
    business.id,
    analytics.id,
    {
      name: "Analytics Basic",
      description:
        "Core analytics for small teams.",
      price: 39900,
      currency: "INR",
      interval: "MONTHLY",
    },
  );

  const analyticsPro = await createPlan(
    adminToken,
    business.id,
    analytics.id,
    {
      name: "Analytics Pro",
      description:
        "Advanced reporting for growing businesses.",
      price: 99900,
      currency: "INR",
      interval: "MONTHLY",
    },
  );

  /*
   * --------------------------------------------------
   * 6. Database plans
   * --------------------------------------------------
   */

  const databaseBasic = await createPlan(
    adminToken,
    business.id,
    database.id,
    {
      name: "Database Basic",
      description:
        "Managed database for smaller workloads.",
      price: 49900,
      currency: "INR",
      interval: "MONTHLY",
    },
  );

  /*
   * --------------------------------------------------
   * 7. Collaboration plans
   * --------------------------------------------------
   */

  const collaborationStarter =
    await createPlan(
      adminToken,
      business.id,
      collaboration.id,
      {
        name: "Team Starter",
        description:
          "Essential collaboration tools for small teams.",
        price: 24900,
        currency: "INR",
        interval: "MONTHLY",
      },
    );

  const collaborationPro =
    await createPlan(
      adminToken,
      business.id,
      collaboration.id,
      {
        name: "Team Pro",
        description:
          "Advanced collaboration features for growing teams.",
        price: 59900,
        currency: "INR",
        interval: "MONTHLY",
      },
    );

  console.log(
    "Services and plans created.",
  );

  /*
   * --------------------------------------------------
   * 8. Scenario: Active subscription
   *
   * Cloud Storage → Pro
   * --------------------------------------------------
   */

  const active =
    await createSubscription(
      customerToken,
      business.id,
      storagePro.id,
      "demo-active-subscription",
    );

  await pay(
    customerToken,
    business.id,
    active.invoice.id,
    "SUCCESS",
  );

  console.log(
    "✓ Active Cloud Storage Pro subscription",
  );

  /*
   * --------------------------------------------------
   * 9. Scenario: Second active subscription
   *
   * Analytics → Pro
   * Different service, therefore valid.
   * --------------------------------------------------
   */

  const analyticsSubscription =
    await createSubscription(
      customerToken,
      business.id,
      analyticsPro.id,
      "demo-analytics-subscription",
    );

  await pay(
    customerToken,
    business.id,
    analyticsSubscription.invoice.id,
    "SUCCESS",
  );

  console.log(
    "✓ Active Analytics Pro subscription",
  );

  /*
   * --------------------------------------------------
   * 10. Scenario: Failed payment
   *
   * Managed Database → Basic
   *
   * The subscription remains PENDING and
   * the invoice/payment demonstrate failure.
   * --------------------------------------------------
   */

  const failed =
    await createSubscription(
      customerToken,
      business.id,
      databaseBasic.id,
      "demo-failed-subscription",
    );

  await pay(
    customerToken,
    business.id,
    failed.invoice.id,
    "FAILED",
  );

  console.log(
    "✓ Failed Managed Database payment",
  );

  /*
   * --------------------------------------------------
   * 11. Scenario: Scheduled downgrade
   *
   * Analytics Pro → Analytics Basic
   *
   * Same service, valid downgrade.
   * --------------------------------------------------
   */

  await request(
    `/businesses/${business.id}/subscriptions/${analyticsSubscription.subscription.id}/downgrade`,
    {
      method: "POST",
      headers: {
        "Idempotency-Key":
          "demo-scheduled-downgrade",
      },
      body: JSON.stringify({
        planId: analyticsBasic.id,
      }),
    },
    customerToken,
  );

  console.log(
    "✓ Analytics Pro → Analytics Basic downgrade scheduled",
  );

  /*
   * --------------------------------------------------
   * 12. Scenario: Upgrade
   *
   * Team Starter → Team Pro
   *
   * Same service, valid upgrade.
   * --------------------------------------------------
   */

  const upgradeSub =
    await createSubscription(
      customerToken,
      business.id,
      collaborationStarter.id,
      "demo-upgrade-subscription",
    );

  await pay(
    customerToken,
    business.id,
    upgradeSub.invoice.id,
    "SUCCESS",
  );

  const upgrade = await request(
    `/businesses/${business.id}/subscriptions/${upgradeSub.subscription.id}/upgrade`,
    {
      method: "POST",
      headers: {
        "Idempotency-Key": "demo-upgrade",
      },
      body: JSON.stringify({
        planId: collaborationPro.id,
      }),
    },
    customerToken,
  );

  if (upgrade.data?.invoice?.id) {
    await pay(
      customerToken,
      business.id,
      upgrade.data.invoice.id,
      "SUCCESS",
    );
  }

  console.log(
    "✓ Team Starter → Team Pro upgrade",
  );

  /*
   * --------------------------------------------------
   * 13. Scenario: Immediate cancellation
   *
   * Cancel the upgraded Team Pro subscription.
   * This demonstrates the cancellation + credit flow.
   * --------------------------------------------------
   */

  await request(
    `/businesses/${business.id}/subscriptions/${upgradeSub.subscription.id}/cancel`,
    {
      method: "POST",
      headers: {
        "Idempotency-Key":
          "demo-immediate-cancel",
      },
      body: JSON.stringify({
        mode: "IMMEDIATE",
      }),
    },
    customerToken,
  );

  console.log(
    "✓ Immediate cancellation + credit scenario",
  );

  /*
   * --------------------------------------------------
   * Done
   * --------------------------------------------------
   */

  console.log(
    "\n✅ Demo data created successfully.",
  );

  console.log("\nDemo customer login:");
  console.log(`Email:    ${CUSTOMER_EMAIL}`);
  console.log(`Password: ${PASSWORD}`);

  console.log("\nDemo admin login:");
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${PASSWORD}`);

  console.log(
    `\nBusiness: ${business.name}`,
  );

  console.log(
    `Business ID: ${business.id}\n`,
  );
}

main().catch((error) => {
  console.error("\n❌ Seed failed:");
  console.error(error);
  process.exit(1);
});