import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import crypto from "node:crypto";

let server: ReturnType<typeof app.listen> | undefined;
let baseUrl = "";

export async function startTestServer() {
  if (server) return;
  server = app.listen(0);
  await new Promise<void>((resolve) => server!.once("listening", resolve));
  const address = server!.address();
  if (!address || typeof address === "string") throw new Error("Unable to determine test server address.");
  baseUrl = `http://127.0.0.1:${address.port}`;
}

export async function stopTestServer() {
  if (!server) return;
  await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()));
  server = undefined;
  baseUrl = "";
}

export async function request(path: string, options: RequestInit = {}) {
  if (!baseUrl) throw new Error("Test server has not been started.");
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return fetch(`${baseUrl}${path}`, { ...options, headers });
}

export async function registerAndLogin(
  email = `${crypto.randomUUID()}@example.com`,
  accountType: "ADMIN" | "CUSTOMER" = "ADMIN",
  password = "Password123!",
) {
  const register = await request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Test",
      lastName: "User",
      email,
      password,
      confirmPassword: password,
      intent: accountType,
    }),
  });
  if (register.status !== 201) throw new Error(`Registration failed: ${register.status} ${await register.text()}`);

  const login = await request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (login.status !== 200) throw new Error(`Login failed: ${login.status} ${await login.text()}`);

  const body = await login.json();
  const user = await prisma.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });

  return {
    userId: user.id,
    accessToken: body.data.accessToken as string,
    refreshToken: body.data.refreshToken as string,
    accountType: user.accountType as "ADMIN" | "CUSTOMER",
  };
}

export async function createBusiness(accessToken: string, name = "Acme SaaS") {
  const response = await request("/api/v1/businesses", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name }),
  });
  await expectStatus(response, 201);
  return (await response.json()).data;
}

export async function createService(accessToken: string, businessId: string, name = "Analytics") {
  const response = await request(`/api/v1/businesses/${businessId}/services`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name, description: "Analytics service" }),
  });
  await expectStatus(response, 201);
  return (await response.json()).data;
}

export async function createPlan(
  accessToken: string,
  businessId: string,
  serviceId: string,
  input: {
    name?: string;
    price?: number;
    currency?: "INR" | "USD";
    interval?: "MONTHLY" | "YEARLY";
  } = {},
) {
  const response = await request(`/api/v1/businesses/${businessId}/services/${serviceId}/plans`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      name: input.name ?? "Starter",
      price: input.price ?? 3000,
      currency: input.currency ?? "INR",
      interval: input.interval ?? "MONTHLY",
    }),
  });
  await expectStatus(response, 201);
  return (await response.json()).data;
}

export async function createActiveSubscription(accessToken: string, businessId: string, planId: string, currency: "INR" | "USD" = "INR") {
  const create = await request(`/api/v1/businesses/${businessId}/subscriptions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "Idempotency-Key": `sub-${crypto.randomUUID()}`,
    },
    body: JSON.stringify({ planId, currency }),
  });
  await expectStatus(create, 201);
  const created = (await create.json()).data;

  const payment = await request(`/api/v1/businesses/${businessId}/payments`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "Idempotency-Key": `pay-${crypto.randomUUID()}`,
    },
    body: JSON.stringify({ invoiceId: created.invoice.id, paymentMethod: "DEMO", result: "SUCCESS" }),
  });
  await expectStatus(payment, 201);

  return {
    subscription: await prisma.subscription.findUniqueOrThrow({ where: { id: created.subscription.id } }),
    invoice: await prisma.invoice.findUniqueOrThrow({ where: { id: created.invoice.id } }),
  };
}

export async function expectStatus(response: Response, expected: number) {
  if (response.status !== expected) {
    throw new Error(`Expected HTTP ${expected}, got ${response.status}: ${await response.text()}`);
  }
}
