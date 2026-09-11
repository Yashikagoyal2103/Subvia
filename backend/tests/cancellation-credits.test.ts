import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import { createActiveSubscription, createBusiness, createPlan, createService, registerAndLogin, request, } from "./helpers.js";

const INTERNAL_BILLING_SECRET =
  process.env.INTERNAL_BILLING_SECRET;

if (!INTERNAL_BILLING_SECRET) {
  throw new Error(
    "INTERNAL_BILLING_SECRET is not configured for tests"
  );
}

async function fixture() {
  const auth = await registerAndLogin("credits@example.com");
  const business = await createBusiness(auth.accessToken);
  const service = await createService(auth.accessToken, business.id);

  const plan = await createPlan(
    auth.accessToken,
    business.id,
    service.id,
    { name: "Monthly", price: 3000 }
  );

  return { auth, business, service, plan };
}

describe("Cancellation and credit ledger", () => {
  it("schedules period-end cancellation without cancelling immediately", async () => {
    const { auth, business, plan } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      plan.id
    );

    const response = await request(
      `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/cancel`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `cancel-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ mode: "PERIOD_END" }),
      }
    );

    expect(response.status).toBe(200);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: active.subscription.id },
    });

    expect(subscription.status).toBe("ACTIVE");
    expect(subscription.cancelAtPeriodEnd).toBe(true);
  });

  it("rejects duplicate period-end cancellation", async () => {
    const { auth, business, plan } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      plan.id
    );

    const path = `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/cancel`;
    const options = {
      method: "POST",
      headers: {
        authorization: `Bearer ${auth.accessToken}`,
        "Idempotency-Key": `cancel-first-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({ mode: "PERIOD_END" }),
    };

    expect((await request(path, options)).status).toBe(200);

    const second = await request(path, {
      ...options,
      headers: {
        ...options.headers,
        "Idempotency-Key": `cancel-second-${crypto.randomUUID()}`,
      },
    });

    expect(second.status).toBe(409);
    expect((await second.json()).error.code).toBe(
      "CANCELLATION_ALREADY_SCHEDULED"
    );
  });

  it("immediately cancels and creates a reusable credit", async () => {
    const { auth, business, plan } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      plan.id
    );

    const start = new Date("2026-09-01T00:00:00Z");
    const end = new Date("2026-10-01T00:00:00Z");

    await prisma.subscription.update({
      where: { id: active.subscription.id },
      data: {
        billingPeriodStart: start,
        billingPeriodEnd: end,
      },
    });

    const response = await request(
      `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/cancel`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `cancel-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ mode: "IMMEDIATE" }),
      }
    );

    expect(response.status).toBe(200);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: active.subscription.id },
    });

    expect(subscription.status).toBe("CANCELLED");
    expect(subscription.cancelledAt).not.toBeNull();

    const ledger = await prisma.creditLedger.findMany({
      where: { customerProfileId: active.subscription.customerProfileId },
    });

    expect(ledger).toHaveLength(1);
    expect(ledger[0].type).toBe("CREDIT");
    expect(ledger[0].amount).toBeGreaterThan(0);
    expect(ledger[0].currency).toBe("INR");
  });

  it("exposes the customer's credit balance", async () => {
    const { auth, business, plan } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      plan.id
    );

    await prisma.creditLedger.create({
      data: {
        customerProfileId: active.subscription.customerProfileId,
        amount: 700,
        currency: "INR",
        type: "CREDIT",
        description: "Test credit",
      },
    });

    const response = await request(
      `/api/v1/businesses/${business.id}/credits`,
      {
        headers: { authorization: `Bearer ${auth.accessToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({
      INR: 700,
      USD: 0,
    });
  });

  it("keeps INR and USD credit balances separate", async () => {
    const { auth, business, plan } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      plan.id
    );

    await prisma.creditLedger.createMany({
      data: [
        {
          customerProfileId: active.subscription.customerProfileId,
          amount: 500,
          currency: "INR",
          type: "CREDIT",
          description: "INR credit",
        },
        {
          customerProfileId: active.subscription.customerProfileId,
          amount: 20,
          currency: "USD",
          type: "CREDIT",
          description: "USD credit",
        },
        {
          customerProfileId: active.subscription.customerProfileId,
          amount: 100,
          currency: "INR",
          type: "DEBIT",
          description: "INR debit",
        },
      ],
    });

    const response = await request(
      `/api/v1/businesses/${business.id}/credits`,
      {
        headers: { authorization: `Bearer ${auth.accessToken}` },
      }
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({
      INR: 400,
      USD: 20,
    });
  });

  it("applies available credit to a recurring invoice and records a debit", async () => {
    const { auth, business, plan } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      plan.id
    );

    await prisma.creditLedger.create({
      data: {
        customerProfileId: active.subscription.customerProfileId,
        amount: 1000,
        currency: "INR",
        type: "CREDIT",
        description: "Reusable credit",
      },
    });

    await prisma.subscription.update({
      where: { id: active.subscription.id },
      data: {
        billingPeriodEnd: new Date("2020-01-01T00:00:00Z"),
      },
    });

    const response = await request("/api/v1/internal/billing/run", {
      method: "POST",
      headers: {"X-Internal-Token": INTERNAL_BILLING_SECRET} ,
      body: JSON.stringify({ result: "SUCCESS" }),
    });

    expect(response.status).toBe(200);

    const invoice = await prisma.invoice.findFirstOrThrow({
      where: { subscriptionId: active.subscription.id },
      orderBy: { createdAt: "desc" },
    });

    expect(invoice.total).toBe(2000);
    expect(invoice.status).toBe("PAID");

    const debits = await prisma.creditLedger.findMany({
      where: {
        customerProfileId: active.subscription.customerProfileId,
        type: "DEBIT",
      },
    });

    expect(debits).toHaveLength(1);
    expect(debits[0].amount).toBe(1000);
    expect(debits[0].invoiceId).toBe(invoice.id);
  });

  it("does not apply credit from a different currency to a renewal", async () => {
    const { auth, business, plan } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      plan.id
    );

    await prisma.creditLedger.create({
      data: {
        customerProfileId: active.subscription.customerProfileId,
        amount: 500,
        currency: "USD",
        type: "CREDIT",
        description: "Wrong-currency credit",
      },
    });

    await prisma.subscription.update({
      where: { id: active.subscription.id },
      data: {
        billingPeriodEnd: new Date("2020-02-01T00:00:00Z"),
      },
    });

    const response = await request("/api/v1/internal/billing/run", {
      method: "POST",
      headers: {"X-Internal-Token": INTERNAL_BILLING_SECRET},
      body: JSON.stringify({ result: "SUCCESS" }),
    });

    expect(response.status).toBe(200);

    const invoice = await prisma.invoice.findFirstOrThrow({
      where: { subscriptionId: active.subscription.id },
      orderBy: { createdAt: "desc" },
    });

    expect(invoice.currency).toBe("INR");
    expect(invoice.total).toBe(3000);

    const wrongCurrencyDebits = await prisma.creditLedger.count({
      where: {
        customerProfileId: active.subscription.customerProfileId,
        currency: "USD",
        type: "DEBIT",
      },
    });

    expect(wrongCurrencyDebits).toBe(0);
  });

  it("does not create a payment when credit fully covers a renewal", async () => {
    const { auth, business, plan } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      plan.id
    );

    await prisma.creditLedger.create({
      data: {
        customerProfileId: active.subscription.customerProfileId,
        amount: 5000,
        currency: "INR",
        type: "CREDIT",
        description: "Full renewal credit",
      },
    });

    await prisma.subscription.update({
      where: { id: active.subscription.id },
      data: {
        billingPeriodEnd: new Date("2020-01-01T00:00:00Z"),
      },
    });

    const response = await request("/api/v1/internal/billing/run", {
      method: "POST",
      headers: {
        "X-Internal-Token": INTERNAL_BILLING_SECRET,
      },
      body: JSON.stringify({ result: "FAILED" }),
    });

    expect(response.status).toBe(200);

    const renewal = await prisma.invoice.findFirstOrThrow({
      where: { subscriptionId: active.subscription.id },
      orderBy: { createdAt: "desc" },
    });

    expect(renewal.status).toBe("PAID");
    expect(renewal.total).toBe(0);

    const payments = await prisma.payment.count({
      where: { invoiceId: renewal.id },
    });

    expect(payments).toBe(0);
  });
});
