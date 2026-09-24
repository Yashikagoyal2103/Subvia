import "dotenv/config";
import crypto from "node:crypto";
import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

type JsonObject = Record<string, any>;
type Auth = { accessToken: string };
type Plan = { id: string; name: string };
type ServiceWithPlans = { id: string; name: string; plans: Record<string, Plan> };

const PORT = 0;
const PASSWORD = "DemoPassword123!";

const DEMO_BUSINESSES = ["CloudBox Demo", "NovaStack Demo", "LedgerPro Demo"];
const DEMO_EMAILS = [
  "demo.admin@saasbilling.local",
  "demo.hybrid@saasbilling.local",
  "demo.customer@saasbilling.local",
  "demo.teamadmin@saasbilling.local",
  "customer.alice@saasbilling.local",
  "customer.bob@saasbilling.local",
  "customer.charlie@saasbilling.local",
  "customer.diana@saasbilling.local",
  "customer.emma@saasbilling.local",
  "customer.farhan@saasbilling.local",
  "customer.gaurav@saasbilling.local",
];

const SERVICE_CATALOG = [
  {
    name: "Cloud Storage",
    description: "Secure cloud storage for files, backups, and team assets.",
    plans: [
      ["Starter", 900, "MONTHLY"],
      ["Pro", 2400, "MONTHLY"],
      ["Business", 24000, "YEARLY"],
    ],
  },
  {
    name: "Analytics Suite",
    description: "Dashboards and reporting for product and business analytics.",
    plans: [
      ["Basic", 1500, "MONTHLY"],
      ["Pro", 4200, "MONTHLY"],
      ["Enterprise", 48000, "YEARLY"],
    ],
  },
  {
    name: "Managed Database",
    description: "Managed PostgreSQL databases with backups and monitoring.",
    plans: [
      ["Basic", 3200, "MONTHLY"],
      ["Pro", 7800, "MONTHLY"],
      ["Scale", 84000, "YEARLY"],
    ],
  },
  {
    name: "Team Collaboration",
    description: "Shared workspaces, permissions, and collaboration tools.",
    plans: [
      ["Basic", 1800, "MONTHLY"],
      ["Pro", 4500, "MONTHLY"],
      ["Business", 50000, "YEARLY"],
    ],
  },
  {
    name: "Email Delivery",
    description: "Transactional email delivery and delivery monitoring.",
    plans: [
      ["Basic", 1200, "MONTHLY"],
      ["Pro", 3500, "MONTHLY"],
      ["Business", 39000, "YEARLY"],
    ],
  },
  {
    name: "Observability",
    description: "Application logs, service health, and operational visibility.",
    plans: [
      ["Starter", 2100, "MONTHLY"],
      ["Pro", 5600, "MONTHLY"],
      ["Scale", 62000, "YEARLY"],
    ],
  },
] as const;

const BUSINESS_CONFIG = [
  { name: "CloudBox Demo", taxRate: 18 },
  { name: "NovaStack Demo", taxRate: 12 },
  { name: "LedgerPro Demo", taxRate: 5 },
] as const;

async function startServer() {
  const server = app.listen(PORT);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to start seed server.");
  return { server, baseUrl: `http://127.0.0.1:${address.port}/api/v1` };
}

async function api(baseUrl: string, path: string, options: RequestInit = {}): Promise<JsonObject> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const text = await response.text();
  let body: JsonObject = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }

  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

function authHeaders(accessToken: string, idempotencyKey?: string) {
  const headers: Record<string, string> = { authorization: `Bearer ${accessToken}` };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return headers;
}

async function register(baseUrl: string, email: string, name: string) {
  const result = await api(baseUrl, "/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD, name }),
  });
  return result.data as { id: string; email: string; name?: string };
}

async function login(baseUrl: string, email: string): Promise<Auth> {
  const result = await api(baseUrl, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  return result.data as Auth;
}

async function createBusiness(baseUrl: string, accessToken: string, name: string, taxRate: number) {
  const created = await api(baseUrl, "/businesses", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ name }),
  });
  const business = created.data;

  return (await api(baseUrl, `/businesses/${business.id}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ taxRate }),
  })).data;
}

async function createService(baseUrl: string, accessToken: string, businessId: string, name: string, description: string) {
  return (await api(baseUrl, `/businesses/${businessId}/services`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ name, description }),
  })).data;
}

async function createPlan(baseUrl: string, accessToken: string, businessId: string, serviceId: string, name: string, price: number, interval: "MONTHLY" | "YEARLY") {
  return (await api(baseUrl, `/businesses/${businessId}/services/${serviceId}/plans`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      name,
      description: `${name} plan with predictable subscription billing.`,
      price,
      currency: "INR",
      interval,
    }),
  })).data as Plan;
}

async function createSubscription(baseUrl: string, accessToken: string, businessId: string, planId: string) {
  return (await api(baseUrl, `/businesses/${businessId}/subscriptions`, {
    method: "POST",
    headers: authHeaders(accessToken, `seed-sub-${crypto.randomUUID()}`),
    body: JSON.stringify({ planId, currency: "INR" }),
  })).data;
}

async function pay(baseUrl: string, accessToken: string, businessId: string, invoiceId: string, result: "SUCCESS" | "FAILED") {
  return (await api(baseUrl, `/businesses/${businessId}/payments`, {
    method: "POST",
    headers: authHeaders(accessToken, `seed-pay-${crypto.randomUUID()}`),
    body: JSON.stringify({ invoiceId, paymentMethod: "DEMO", result }),
  })).data;
}

async function upgrade(baseUrl: string, accessToken: string, businessId: string, subscriptionId: string, planId: string) {
  return (await api(baseUrl, `/businesses/${businessId}/subscriptions/${subscriptionId}/upgrade`, {
    method: "POST",
    headers: authHeaders(accessToken, `seed-upgrade-${crypto.randomUUID()}`),
    body: JSON.stringify({ planId }),
  })).data;
}

async function downgrade(baseUrl: string, accessToken: string, businessId: string, subscriptionId: string, planId: string) {
  return api(baseUrl, `/businesses/${businessId}/subscriptions/${subscriptionId}/downgrade`, {
    method: "POST",
    headers: authHeaders(accessToken, `seed-downgrade-${crypto.randomUUID()}`),
    body: JSON.stringify({ planId }),
  });
}

async function cancel(baseUrl: string, accessToken: string, businessId: string, subscriptionId: string, mode: "PERIOD_END" | "IMMEDIATE") {
  return api(baseUrl, `/businesses/${businessId}/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: authHeaders(accessToken, `seed-cancel-${crypto.randomUUID()}`),
    body: JSON.stringify({ mode }),
  });
}

async function runBilling(baseUrl: string, result: "SUCCESS" | "FAILED") {
  const secret = process.env.INTERNAL_BILLING_SECRET;
  if (!secret) throw new Error("INTERNAL_BILLING_SECRET is not configured.");
  return api(baseUrl, "/internal/billing/run", {
    method: "POST",
    headers: { "X-Internal-Token": secret },
    body: JSON.stringify({ result }),
  });
}

async function addCustomerProfile(userId: string, businessId: string) {
  return prisma.customerProfile.upsert({
    where: { userId_businessId: { userId, businessId } },
    update: {},
    create: { userId, businessId },
  });
}

async function addAdminMembership(userId: string, businessId: string) {
  return prisma.businessMember.upsert({
    where: { userId_businessId: { userId, businessId } },
    update: { role: "BUSINESS_ADMIN" },
    create: { userId, businessId, role: "BUSINESS_ADMIN" },
  });
}

async function createWebhook(baseUrl: string, accessToken: string, businessId: string, url: string) {
  return (await api(baseUrl, `/${businessId}/webhooks`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ url }),
  })).data;
}

async function createApiKey(baseUrl: string, accessToken: string, businessId: string, name: string, expiresAt?: string) {
  return (await api(baseUrl, `/${businessId}/api-keys`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ name, ...(expiresAt ? { expiresAt } : {}) }),
  })).data;
}

async function seedBusiness(
  baseUrl: string,
  adminToken: string,
  businessId: string,
  businessIndex: number,
  customerTokens: Auth[],
) {
  const services: ServiceWithPlans[] = [];

  for (let i = 0; i < SERVICE_CATALOG.length; i += 1) {
    const definition = SERVICE_CATALOG[i];
    const service = await createService(baseUrl, adminToken, businessId, definition.name, definition.description);
    const plans: Record<string, Plan> = {};

    for (const [name, price, interval] of definition.plans) {
      plans[name] = await createPlan(baseUrl, adminToken, businessId, service.id, name, price, interval);
    }

    services.push({ id: service.id, name: service.name, plans });

    // Give the admin UI a real inactive catalog item to test filters/badges.
    if ((i + businessIndex) % 5 === 0) {
      await prisma.service.update({ where: { id: service.id }, data: { isActive: false } });
    }
    if ((i + businessIndex) % 4 === 0) {
      const firstPlan = Object.values(plans)[0];
      await prisma.plan.update({ where: { id: firstPlan.id }, data: { isActive: false } });
    }
  }

  const [storage, analytics, database, collaboration, email, observability] = services;

  // Customer 0: active subscriptions + successful payments.
  const subA = await createSubscription(baseUrl, customerTokens[0].accessToken, businessId, storage.plans.Pro.id);
  await pay(baseUrl, customerTokens[0].accessToken, businessId, subA.invoice.id, "SUCCESS");

  const subB = await createSubscription(baseUrl, customerTokens[0].accessToken, businessId, analytics.plans.Pro.id);
  await pay(baseUrl, customerTokens[0].accessToken, businessId, subB.invoice.id, "SUCCESS");

  // Customer 0: scheduled downgrade.
  const subC = await createSubscription(baseUrl, customerTokens[0].accessToken, businessId, collaboration.plans.Pro.id);
  await pay(baseUrl, customerTokens[0].accessToken, businessId, subC.invoice.id, "SUCCESS");
  await downgrade(baseUrl, customerTokens[0].accessToken, businessId, subC.subscription.id, collaboration.plans.Basic.id);

  // Customer 0: upgrade creates another invoice/payment.
  const subD = await createSubscription(baseUrl, customerTokens[0].accessToken, businessId, email.plans.Basic.id);
  await pay(baseUrl, customerTokens[0].accessToken, businessId, subD.invoice.id, "SUCCESS");
  const upgraded = await upgrade(baseUrl, customerTokens[0].accessToken, businessId, subD.subscription.id, email.plans.Pro.id);
  await pay(baseUrl, customerTokens[0].accessToken, businessId, upgraded.invoice.id, "SUCCESS");

  // Customer 1: active + immediate cancellation.
  const subE = await createSubscription(baseUrl, customerTokens[1].accessToken, businessId, database.plans.Basic.id);
  await pay(baseUrl, customerTokens[1].accessToken, businessId, subE.invoice.id, "SUCCESS");
  await cancel(baseUrl, customerTokens[1].accessToken, businessId, subE.subscription.id, "IMMEDIATE");

  // Customer 2: active + period-end cancellation.
  const subF = await createSubscription(baseUrl, customerTokens[2].accessToken, businessId, observability.plans.Pro.id);
  await pay(baseUrl, customerTokens[2].accessToken, businessId, subF.invoice.id, "SUCCESS");
  await cancel(baseUrl, customerTokens[2].accessToken, businessId, subF.subscription.id, "PERIOD_END");

  // Customer 3: failed initial payment -> pending/open invoice.
  const subG = await createSubscription(baseUrl, customerTokens[3].accessToken, businessId, database.plans.Pro.id);
  await pay(baseUrl, customerTokens[3].accessToken, businessId, subG.invoice.id, "FAILED");

  // Customer 4: due renewal that fails -> PAST_DUE + new OPEN invoice.
  const subH = await createSubscription(baseUrl, customerTokens[4].accessToken, businessId, storage.plans.Starter.id);
  await pay(baseUrl, customerTokens[4].accessToken, businessId, subH.invoice.id, "SUCCESS");
  await prisma.subscription.update({
    where: { id: subH.subscription.id },
    data: {
      billingPeriodStart: new Date("2026-08-01T00:00:00Z"),
      billingPeriodEnd: new Date("2026-09-01T00:00:00Z"),
    },
  });
  await runBilling(baseUrl, "FAILED");

  // Add credits for the first customer in every business.
  const profile = await prisma.customerProfile.findUniqueOrThrow({
    where: { userId_businessId: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "demo.customer@saasbilling.local" } })).id, businessId } },
  });
  await prisma.creditLedger.createMany({
    data: [
      { customerProfileId: profile.id, amount: 1500 + businessIndex * 500, currency: "INR", type: "CREDIT", description: "Promotional billing credit" },
      { customerProfileId: profile.id, amount: 500, currency: "INR", type: "CREDIT", description: "Service adjustment credit" },
      { customerProfileId: profile.id, amount: 300, currency: "INR", type: "DEBIT", description: "Credit applied to a previous invoice" },
    ],
  });
}

async function main() {
  const { server, baseUrl } = await startServer();

  try {
    await prisma.business.deleteMany({ where: { name: { in: DEMO_BUSINESSES } } });
    await prisma.user.deleteMany({ where: { email: { in: DEMO_EMAILS } } });

    const admin = await register(baseUrl, "demo.admin@saasbilling.local", "Demo Admin");
    const hybrid = await register(baseUrl, "demo.hybrid@saasbilling.local", "Demo Hybrid");
    const customer = await register(baseUrl, "demo.customer@saasbilling.local", "Demo Customer");
    const teamAdmin = await register(baseUrl, "demo.teamadmin@saasbilling.local", "Demo Team Admin");

    const customerNames = [
      ["customer.alice@saasbilling.local", "Alice Sharma"],
      ["customer.bob@saasbilling.local", "Bob Mehta"],
      ["customer.charlie@saasbilling.local", "Charlie Singh"],
      ["customer.diana@saasbilling.local", "Diana Kapoor"],
      ["customer.emma@saasbilling.local", "Emma Wilson"],
      ["customer.farhan@saasbilling.local", "Farhan Khan"],
      ["customer.gaurav@saasbilling.local", "Gaurav Patel"],
    ] as const;

    const extraCustomers = [] as { id: string; email: string }[];
    for (const [email, name] of customerNames) {
      extraCustomers.push(await register(baseUrl, email, name));
    }

    const adminAuth = await login(baseUrl, admin.email);
    const hybridAuth = await login(baseUrl, hybrid.email);
    const customerAuth = await login(baseUrl, customer.email);
    const teamAdminAuth = await login(baseUrl, teamAdmin.email);
    const extraAuths = [] as Auth[];
    for (const person of extraCustomers) extraAuths.push(await login(baseUrl, person.email));

    const businesses = [] as { id: string; name: string }[];
    for (const config of BUSINESS_CONFIG) {
      businesses.push(await createBusiness(baseUrl, adminAuth.accessToken, config.name, config.taxRate));
    }

    // Admin context: one user owns all businesses, another admin is a member of two.
    await addAdminMembership(hybrid.id, businesses[0].id);
    await addAdminMembership(teamAdmin.id, businesses[1].id);
    await addAdminMembership(teamAdmin.id, businesses[2].id);

    // Customer contexts: one customer belongs to all businesses, hybrid belongs to two.
    await addCustomerProfile(customer.id, businesses[0].id);
    await addCustomerProfile(customer.id, businesses[1].id);
    await addCustomerProfile(customer.id, businesses[2].id);
    await addCustomerProfile(hybrid.id, businesses[0].id);
    await addCustomerProfile(hybrid.id, businesses[1].id);

    const allCustomerIds = [customer.id, ...extraCustomers.map((x) => x.id)];
    for (let businessIndex = 0; businessIndex < businesses.length; businessIndex += 1) {
      const business = businesses[businessIndex];
      for (const userId of allCustomerIds) await addCustomerProfile(userId, business.id);

      // Use five different customer tokens for each business so admin tables contain varied states.
      const tokens = [customerAuth, extraAuths[0], extraAuths[1], extraAuths[2], extraAuths[3]];
      await seedBusiness(baseUrl, adminAuth.accessToken, business.id, businessIndex, tokens);
    }

    // Webhook and API-key pages should have realistic configuration data.
    for (const business of businesses) {
      await createWebhook(baseUrl, adminAuth.accessToken, business.id, "https://example.com/hooks/billing");
      await createWebhook(baseUrl, adminAuth.accessToken, business.id, "https://example.com/hooks/subscriptions");

      await createApiKey(baseUrl, adminAuth.accessToken, business.id, "Production Integration");
      const expiring = await createApiKey(
        baseUrl,
        adminAuth.accessToken,
        business.id,
        "Partner Sandbox",
        new Date("2027-03-01T00:00:00Z").toISOString(),
      );

      await api(baseUrl, `/${business.id}/api-keys/${expiring.id}`, {
        method: "DELETE",
        headers: authHeaders(adminAuth.accessToken),
      });
    }

    // Disable one webhook per business directly so the Admin Webhooks page has both states.
    const endpoints = await prisma.webhookEndpoint.findMany({ where: { businessId: { in: businesses.map((b) => b.id) } } });
    for (const endpoint of endpoints.filter((_, index) => index % 2 === 1)) {
      await prisma.webhookEndpoint.update({ where: { id: endpoint.id }, data: { status: "DISABLED" } });
    }

    // Add a few ledger entries to the hybrid customer's second business for mixed-context testing.
    const hybridProfile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId_businessId: { userId: hybrid.id, businessId: businesses[1].id } },
    });
    await prisma.creditLedger.createMany({
      data: [
        { customerProfileId: hybridProfile.id, amount: 2200, currency: "INR", type: "CREDIT", description: "Migration credit" },
        { customerProfileId: hybridProfile.id, amount: 700, currency: "INR", type: "DEBIT", description: "Invoice credit application" },
      ],
    });

    console.log("\nAdmin/customer demo seed completed successfully.\n");
    console.log("Primary admin:", "demo.admin@saasbilling.local / " + PASSWORD);
    console.log("Hybrid:", "demo.hybrid@saasbilling.local / " + PASSWORD);
    console.log("Customer:", "demo.customer@saasbilling.local / " + PASSWORD);
    console.log("Second admin:", "demo.teamadmin@saasbilling.local / " + PASSWORD);
    console.log("Businesses:", DEMO_BUSINESSES.join(", "));
    console.log("Catalog:", SERVICE_CATALOG.length, "services per business x", SERVICE_CATALOG.length * 3, "plans per business");
    console.log("Customers:", DEMO_EMAILS.length, "demo users total");
    console.log("States seeded: active, scheduled downgrade, upgrade history, cancelled, period-end cancellation, pending/failed payment, past due, credits, inactive catalog items, webhooks, API keys, multiple business memberships.");
  } finally {
    await server.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Admin demo seed failed:", error);
  process.exitCode = 1;
});
