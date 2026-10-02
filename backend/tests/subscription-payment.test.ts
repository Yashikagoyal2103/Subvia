import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import {
  createActiveSubscription,
  createBusiness,
  createPlan,
  createService,
  registerAndLogin,
  request,
} from "./helpers.js";

async function fixture() {
  const auth = await registerAndLogin("billing@example.com");
  const business = await createBusiness(auth.accessToken);
  const service = await createService(auth.accessToken, business.id);

  const starter = await createPlan(
    auth.accessToken,
    business.id,
    service.id,
    { name: "Starter", price: 3000 }
  );

  const pro = await createPlan(
    auth.accessToken,
    business.id,
    service.id,
    { name: "Pro", price: 5000 }
  );

  const cheap = await createPlan(
    auth.accessToken,
    business.id,
    service.id,
    { name: "Basic", price: 1000 }
  );

  return { auth, business, service, starter, pro, cheap };
}

describe("Subscription and payment lifecycle", () => {
  it("creates a pending subscription and an open invoice atomically", async () => {
    const { auth, business, starter } = await fixture();

    const response = await request(
      `/api/v1/businesses/${business.id}/subscriptions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `sub-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          planId: starter.id,
          currency: "INR",
        }),
      }
    );

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.data.subscription.status).toBe("PENDING");
    expect(body.data.invoice.status).toBe("OPEN");
    expect(body.data.invoice.total).toBe(3000);
    expect(body.data.invoice.items).toHaveLength(1);
  });

  it("rejects a currency mismatch", async () => {
    const { auth, business, starter } = await fixture();

    const response = await request(
      `/api/v1/businesses/${business.id}/subscriptions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `sub-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          planId: starter.id,
          currency: "USD",
        }),
      }
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe(
      "CURRENCY_NOT_SUPPORTED"
    );
  });

  it("activates the subscription only after successful payment", async () => {
    const { auth, business, starter } = await fixture();

    const created = await request(
      `/api/v1/businesses/${business.id}/subscriptions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `sub-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          planId: starter.id,
          currency: "INR",
        }),
      }
    );

    const data = (await created.json()).data;

    const payment = await request(
      `/api/v1/businesses/${business.id}/payments`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `payment-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          invoiceId: data.invoice.id,
          paymentMethod: "DEMO",
          result: "SUCCESS",
        }),
      }
    );

    expect(payment.status).toBe(201);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: data.subscription.id },
    });

    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: data.invoice.id },
    });

    expect(subscription.status).toBe("ACTIVE");
    expect(invoice.status).toBe("PAID");
    expect(invoice.paidAt).not.toBeNull();
  });

  it("keeps the subscription pending when the initial payment fails", async () => {
    const { auth, business, starter } = await fixture();

    const created = await request(
      `/api/v1/businesses/${business.id}/subscriptions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `sub-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          planId: starter.id,
          currency: "INR",
        }),
      }
    );

    const data = (await created.json()).data;

    const payment = await request(
      `/api/v1/businesses/${business.id}/payments`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `payment-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          invoiceId: data.invoice.id,
          paymentMethod: "DEMO",
          result: "FAILED",
        }),
      }
    );

    expect(payment.status).toBe(201);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: data.subscription.id },
    });

    expect(subscription.status).toBe("PENDING");

    const failed = await prisma.payment.findFirstOrThrow({
      where: { invoiceId: data.invoice.id },
    });

    expect(failed.status).toBe("FAILED");
    expect(failed.failureReason).toBeTruthy();
  });

  it("allows a failed initial payment to be retried successfully", async () => {
    const { auth, business, starter } = await fixture();

    const created = await request(
      `/api/v1/businesses/${business.id}/subscriptions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `sub-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          planId: starter.id,
          currency: "INR",
        }),
      }
    );

    const data = (await created.json()).data;

    for (const result of ["FAILED", "SUCCESS"] as const) {
      const response = await request(
        `/api/v1/businesses/${business.id}/payments`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            "Idempotency-Key": `payment-${crypto.randomUUID()}`,
          },
          body: JSON.stringify({
            invoiceId: data.invoice.id,
            paymentMethod: "DEMO",
            result,
          }),
        }
      );

      expect(response.status).toBe(201);
    }

    const payments = await prisma.payment.findMany({
      where: { invoiceId: data.invoice.id },
      orderBy: { createdAt: "asc" },
    });

    expect(payments.map((p) => p.status)).toEqual([
      "FAILED",
      "SUCCESS",
    ]);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: data.subscription.id },
    });

    expect(subscription.status).toBe("ACTIVE");
  });

  it("rejects payment attempts against an already paid invoice", async () => {
    const { auth, business, starter } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    const response = await request(
      `/api/v1/businesses/${business.id}/payments`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `payment-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          invoiceId: active.invoice.id,
          paymentMethod: "DEMO",
          result: "SUCCESS",
        }),
      }
    );

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe(
      "INVOICE_ALREADY_PAID"
    );
  });

  it("rejects payment access across tenants", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const attacker = await registerAndLogin("attacker@example.com");

    const business = await createBusiness(owner.accessToken);
    const service = await createService(owner.accessToken, business.id);
    const plan = await createPlan(
      owner.accessToken,
      business.id,
      service.id
    );

    const active = await createActiveSubscription(
      owner.accessToken,
      business.id,
      plan.id
    );

    const response = await request(
      `/api/v1/businesses/${business.id}/payments`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${attacker.accessToken}`,
          "Idempotency-Key": `payment-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          invoiceId: active.invoice.id,
          paymentMethod: "DEMO",
          result: "SUCCESS",
        }),
      }
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe(
      "INVOICE_NOT_FOUND"
    );
  });

  it("prevents a second active subscription for the same service", async () => {
    const { auth, business, starter, pro } = await fixture();

    await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    const response = await request(
      `/api/v1/businesses/${business.id}/subscriptions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `sub-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          planId: pro.id,
          currency: "INR",
        }),
      }
    );

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe(
      "ACTIVE_SUBSCRIPTION_EXISTS"
    );
  });

  it("does not treat a cheaper plan as an upgrade", async () => {
    const { auth, business, starter, pro } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      pro.id
    );

    const response = await request(
      `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/upgrade`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `plan-change-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ planId: starter.id }),
      }
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("NOT_AN_UPGRADE");
  });

  it("creates an upgrade invoice with correct proration lines", async () => {
    const { auth, business, starter, pro } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const updated = await prisma.subscription.update({
      where: { id: active.subscription.id },
      data: {
        billingPeriodStart: new Date(now - 15 * day),
        billingPeriodEnd: new Date(now + 15 * day),
      },
    });

    const response = await request(
      `/api/v1/businesses/${business.id}/subscriptions/${updated.id}/upgrade`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `plan-change-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ planId: pro.id }),
      }
    );

    expect(response.status).toBe(201);

    const data = (await response.json()).data;

    expect(data.proration.oldPlanCredit).toBeGreaterThan(0);
    expect(data.proration.newPlanCharge).toBeGreaterThan(
      data.proration.oldPlanCredit
    );
    expect(data.invoice.total).toBe(data.proration.netAmount);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: updated.id },
    });

    expect(subscription.planId).toBe(starter.id);
    expect(subscription.pendingPlanId).toBe(pro.id);
  });

  it("applies an upgrade only after the upgrade invoice succeeds", async () => {
    const { auth, business, starter, pro } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    await prisma.subscription.update({
      where: { id: active.subscription.id },
      data: {
        billingPeriodStart: new Date(now - 15 * day),
        billingPeriodEnd: new Date(now + 15 * day),
      },
    });

    const upgrade = await request(
      `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/upgrade`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `plan-change-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ planId: pro.id }),
      }
    );

    const data = (await upgrade.json()).data;

    const failed = await request(
      `/api/v1/businesses/${business.id}/payments`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `payment-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          invoiceId: data.invoice.id,
          paymentMethod: "DEMO",
          result: "FAILED",
        }),
      }
    );

    expect(failed.status).toBe(201);

    let subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: active.subscription.id },
    });

    expect(subscription.planId).toBe(starter.id);
    expect(subscription.pendingPlanId).toBeNull();

    const failedPayment = await prisma.payment.findFirstOrThrow({
      where: { invoiceId: data.invoice.id, status: "FAILED" },
    });

    expect(failedPayment.status).toBe("FAILED");

    const success = await request(
      `/api/v1/businesses/${business.id}/payments`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `payment-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          invoiceId: data.invoice.id,
          paymentMethod: "DEMO",
          result: "SUCCESS",
        }),
      }
    );

    expect(success.status).toBe(201);

    subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: active.subscription.id },
    });

    expect(subscription.planId).toBe(pro.id);
    expect(subscription.pendingPlanId).toBeNull();
    expect(subscription.status).toBe("ACTIVE");
  });

  it("schedules a downgrade instead of changing the plan immediately", async () => {
    const { auth, business, starter, pro } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      pro.id
    );

    const response = await request(
      `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/downgrade`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `plan-change-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ planId: starter.id }),
      }
    );

    expect(response.status).toBe(200);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: active.subscription.id },
    });

    expect(subscription.planId).toBe(pro.id);
    expect(subscription.pendingPlanId).toBe(starter.id);
  });

  it("rejects multiple pending plan changes", async () => {
    const { auth, business, starter, pro, cheap } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      pro.id
    );

    const first = await request(
      `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/downgrade`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `plan-change-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ planId: starter.id }),
      }
    );

    expect(first.status).toBe(200);

    const second = await request(
      `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/downgrade`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": `plan-change-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ planId: cheap.id }),
      }
    );

    expect(second.status).toBe(409);
    expect((await second.json()).error.code).toBe(
      "PENDING_PLAN_CHANGE_EXISTS"
    );
  });

  it("allows only one concurrent subscription creation for the same service", async () => {
    const { auth, business, starter } = await fixture();

    const payload = JSON.stringify({
      planId: starter.id,
      currency: "INR",
    });

    const [first, second] = await Promise.all([
      request(`/api/v1/businesses/${business.id}/subscriptions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": "concurrent-subscription-a",
        },
        body: payload,
      }),
      request(`/api/v1/businesses/${business.id}/subscriptions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": "concurrent-subscription-b",
        },
        body: payload,
      }),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect(await prisma.subscription.count()).toBe(1);
    expect(await prisma.invoice.count()).toBe(1);
  });

  it("generates unique human-readable invoice numbers", async () => {
    const { auth, business, starter } = await fixture();

    const secondService = await createService(
      auth.accessToken,
      business.id,
      "Reporting"
    );

    const secondPlan = await createPlan(
      auth.accessToken,
      business.id,
      secondService.id,
      { name: "Reporting Starter", price: 2000 }
    );

    await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    await createActiveSubscription(
      auth.accessToken,
      business.id,
      secondPlan.id
    );

    const invoices = await prisma.invoice.findMany({
      orderBy: { invoiceNumber: "asc" },
    });

    expect(invoices).toHaveLength(2);
    expect(
      new Set(invoices.map((invoice) => invoice.invoiceNumber)).size
    ).toBe(2);

    for (const invoice of invoices) {
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}$/);
    }
  });

  it("preserves historical invoice amounts when a plan price changes", async () => {
    const { auth, business, starter } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    await prisma.plan.update({
      where: { id: starter.id },
      data: { price: 9999 },
    });

    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: active.invoice.id },
    });

    expect(invoice.subtotal).toBe(3000);
    expect(invoice.total).toBe(3000);

    const item = await prisma.invoiceItem.findFirstOrThrow({
      where: { invoiceId: invoice.id },
    });

    expect(item.unitPrice).toBe(3000);
    expect(item.amount).toBe(3000);
  });

  it("prevents two concurrent successful payments from charging one invoice twice", async () => {
    const { auth, business, starter } = await fixture();

    const pending = await request(
      `/api/v1/businesses/${business.id}/subscriptions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": "concurrent-payment-sub",
        },
        body: JSON.stringify({
          planId: starter.id,
          currency: "INR",
        }),
      }
    );

    expect(pending.status).toBe(201);

    const data = (await pending.json()).data;

    const payload = JSON.stringify({
      invoiceId: data.invoice.id,
      paymentMethod: "DEMO",
      result: "SUCCESS",
    });

    const [first, second] = await Promise.all([
      request(`/api/v1/businesses/${business.id}/payments`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": "concurrent-payment-a",
        },
        body: payload,
      }),
      request(`/api/v1/businesses/${business.id}/payments`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "Idempotency-Key": "concurrent-payment-b",
        },
        body: payload,
      }),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);

    expect(
      await prisma.payment.count({
        where: { invoiceId: data.invoice.id },
      })
    ).toBe(1);

    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: data.invoice.id },
    });

    expect(invoice.status).toBe("PAID");
  });
});