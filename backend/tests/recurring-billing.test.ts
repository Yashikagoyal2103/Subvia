import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import { addBillingInterval } from "../src/modules/billing/billing-interval.js";
import { createActiveSubscription,createBusiness, createPlan, createService, registerAndLogin, request } from "./helpers.js";

const INTERNAL_BILLING_SECRET =
  process.env.INTERNAL_BILLING_SECRET;

if (!INTERNAL_BILLING_SECRET) {
  throw new Error(
    "INTERNAL_BILLING_SECRET is not configured for tests"
  );
}

async function fixture() {
  const auth = await registerAndLogin("recurring@example.com");
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

  return { auth, business, service, starter, pro };
}

async function makeDue(subscriptionId: string) {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      billingPeriodStart: new Date("2020-01-01T00:00:00Z"),
      billingPeriodEnd: new Date("2020-02-01T00:00:00Z"),
    },
  });
}
async function makeCurrentlyDue(subscriptionId: string) {
  const billingPeriodEnd = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  );

  const billingPeriodStart = new Date(billingPeriodEnd);
  billingPeriodStart.setUTCMonth(
    billingPeriodStart.getUTCMonth() - 1
  );

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      billingPeriodStart,
      billingPeriodEnd,
    },
  });
}
async function makeDueForRecovery(subscriptionId: string) {
  const billingPeriodEnd = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  );

  const billingPeriodStart = new Date(
    billingPeriodEnd
  );

  billingPeriodStart.setUTCMonth(
    billingPeriodStart.getUTCMonth() - 1
  );

  await prisma.subscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      billingPeriodStart,
      billingPeriodEnd,
    },
  });

  return {
    billingPeriodStart,
    billingPeriodEnd,
  };
}

describe("Recurring billing", () => {
  it("renews a due subscription after successful payment", async () => {
    const { auth, business, starter } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    await makeDue(active.subscription.id);

    const response = await request("/api/v1/internal/billing/run", {
      method: "POST",
      headers: {
        "X-Internal-Token":INTERNAL_BILLING_SECRET,
      },
      body: JSON.stringify({ result: "SUCCESS" }),
    });

    expect(response.status).toBe(200);
    expect((await response.json()).data.processed).toBe(1);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: active.subscription.id },
    });

    expect(subscription.status).toBe("ACTIVE");
    expect(subscription.billingPeriodStart).toEqual(
      new Date("2020-02-01T00:00:00Z")
    );
    expect(subscription.billingPeriodEnd).toEqual(
      new Date("2020-03-01T00:00:00Z")
    );

    const invoices = await prisma.invoice.findMany({
      where: { subscriptionId: active.subscription.id },
      orderBy: { createdAt: "desc" },
    });

    expect(invoices).toHaveLength(2);
    expect(invoices[0].status).toBe("PAID");
    expect(invoices[0].total).toBe(3000);

    const payment = await prisma.payment.findFirstOrThrow({
      where: { invoiceId: invoices[0].id },
    });

    expect(payment.status).toBe("SUCCESS");
    expect(payment.amount).toBe(3000);
  });

  it("moves a due subscription to PAST_DUE when renewal payment fails", async () => {
    const { auth, business, starter } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    await makeDue(active.subscription.id);

    const response = await request("/api/v1/internal/billing/run", {
      method: "POST",
      headers: {
        "X-Internal-Token":INTERNAL_BILLING_SECRET,
      },
      body: JSON.stringify({ result: "FAILED" }),
    });

    expect(response.status).toBe(200);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: active.subscription.id },
    });

    expect(subscription.status).toBe("PAST_DUE");

    const renewal = await prisma.invoice.findFirstOrThrow({
      where: { subscriptionId: active.subscription.id },
      orderBy: { createdAt: "desc" },
    });

    expect(renewal.status).toBe("OPEN");

    const payment = await prisma.payment.findFirstOrThrow({
      where: { invoiceId: renewal.id },
    });

    expect(payment.status).toBe("FAILED");
  });

  it("applies a scheduled downgrade at renewal", async () => {
    const { auth, business, starter, pro } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      pro.id
    );

    const downgrade = await request(
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

    expect(downgrade.status).toBe(200);

    await makeDue(active.subscription.id);

    const run = await request("/api/v1/internal/billing/run", {
      method: "POST",
      headers: {
        "X-Internal-Token":INTERNAL_BILLING_SECRET,
      },
      body: JSON.stringify({ result: "SUCCESS" }),
    });


    expect(run.status).toBe(200);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: active.subscription.id },
    });

    expect(subscription.planId).toBe(starter.id);
    expect(subscription.pendingPlanId).toBeNull();
    expect(subscription.price).toBe(3000);
    expect(subscription.status).toBe("ACTIVE");
  });

  it("cancels a period-end cancellation without creating a renewal invoice", async () => {
    const { auth, business, starter } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    const cancel = await request(
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

    expect(cancel.status).toBe(200);

    const before = await prisma.invoice.count({
      where: { subscriptionId: active.subscription.id },
    });

    await makeDue(active.subscription.id);

    const run = await request("/api/v1/internal/billing/run", {
      method: "POST",
      headers: {
        "X-Internal-Token":INTERNAL_BILLING_SECRET,
      },
      body: JSON.stringify({ result: "SUCCESS" }),
    });

    expect(run.status).toBe(200);

    const after = await prisma.invoice.count({
      where: { subscriptionId: active.subscription.id },
    });

    expect(after).toBe(before);

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: active.subscription.id },
    });

    expect(subscription.status).toBe("CANCELLED");
    expect(subscription.cancelledAt).not.toBeNull();
  });

  it("does not process a non-due active subscription", async () => {
    const { auth, business, starter } = await fixture();

    const active = await createActiveSubscription(
      auth.accessToken,
      business.id,
      starter.id
    );

    const response = await request("/api/v1/internal/billing/run", {
      method: "POST",
      headers: {
        "X-Internal-Token":INTERNAL_BILLING_SECRET,
      },
      body: JSON.stringify({ result: "SUCCESS" }),
    });

    expect(response.status).toBe(200);

    const invoices = await prisma.invoice.count({
      where: { subscriptionId: active.subscription.id },
    });

    expect(invoices).toBe(1);
  });

  it(
    "must reject unauthenticated access to the internal billing trigger",
    async () => {
      const response = await request("/api/v1/internal/billing/run", {
        method: "POST",
        body: JSON.stringify({ result: "SUCCESS" }),
      });

      expect(response.status).toBe(401);
    }
  );
  it("recovers a PAST_DUE subscription after a successful manual payment", async () => {
  const { auth, business, starter } = await fixture();

  const active = await createActiveSubscription(
    auth.accessToken,
    business.id,
    starter.id
  );

  // Make the subscription due for renewal.
  const duePeriod = await makeDueForRecovery(
    active.subscription.id
  );

  // First attempt: renewal payment fails.
  const failedRenewal = await request(
    "/api/v1/internal/billing/run",
    {
      method: "POST",
      headers: {
      "X-Internal-Token":INTERNAL_BILLING_SECRET,
    },
      body: JSON.stringify({
        result: "FAILED",
      }),
    }
  );

  expect(failedRenewal.status).toBe(200);

  const pastDue =
    await prisma.subscription.findUniqueOrThrow({
      where: {
        id: active.subscription.id,
      },
    });

  expect(pastDue.status).toBe("PAST_DUE");

  // Find the failed renewal invoice.
  const renewal =
    await prisma.invoice.findFirstOrThrow({
      where: {
        subscriptionId: active.subscription.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  expect(renewal.status).toBe("OPEN");

  // Manually retry the failed invoice.
  const recoveryPayment = await request(
    `/api/v1/businesses/${business.id}/payments`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${auth.accessToken}`,
        "Idempotency-Key": `recovery-payment-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        invoiceId: renewal.id,
        paymentMethod: "DEMO",
        result: "SUCCESS",
      }),
    }
  );

  console.log(
    "RECOVERY PAYMENT:",
    recoveryPayment.status,
    await recoveryPayment.text()
  );

  expect(recoveryPayment.status).toBe(201);

  const recovered =
    await prisma.subscription.findUniqueOrThrow({
      where: {
        id: active.subscription.id,
      },
    });

  const paidInvoice =
    await prisma.invoice.findUniqueOrThrow({
      where: {
        id: renewal.id,
      },
    });

  expect(paidInvoice.status).toBe("PAID");
  expect(paidInvoice.paidAt).not.toBeNull();

  expect(recovered.status).toBe("ACTIVE");

  // The failed period must become the next completed billing period.
  expect(recovered.billingPeriodStart).toEqual(
    duePeriod.billingPeriodEnd
  );

  expect(recovered.billingPeriodEnd).toEqual(
    expect.any(Date)
  );

  expect(
    recovered.billingPeriodEnd.getTime()
  ).toBeGreaterThan(
    recovered.billingPeriodStart.getTime()
  );

  // Two payment attempts should now exist:
  // 1. FAILED renewal attempt
  // 2. SUCCESS recovery attempt
  const payments = await prisma.payment.findMany({
    where: {
      invoiceId: renewal.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  expect(payments).toHaveLength(2);

  expect(payments[0].status).toBe("FAILED");
  expect(payments[1].status).toBe("SUCCESS");
});

  it(
    "must not process the same due subscription twice concurrently",
    async () => {
      const { auth, business, starter } = await fixture();

      const active = await createActiveSubscription(
        auth.accessToken,
        business.id,
        starter.id
      );

      await makeCurrentlyDue(active.subscription.id);

      const [first, second] = await Promise.all([
        request("/api/v1/internal/billing/run", {
          method: "POST",
          headers: {
            "X-Internal-Token":INTERNAL_BILLING_SECRET,
          },
          body: JSON.stringify({ result: "SUCCESS" }),
        }),
        request("/api/v1/internal/billing/run", {
          method: "POST",
          headers: {
            "X-Internal-Token":INTERNAL_BILLING_SECRET,
          },
          body: JSON.stringify({ result: "SUCCESS" }),
        }),
      ]);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);

      const renewalInvoices = await prisma.invoice.count({
        where: {
          subscriptionId: active.subscription.id,
        },
      });
      

      expect(renewalInvoices).toBe(2);
    }
  );
});

describe("Billing interval calculations", () => {
  it("handles monthly billing from January 31 without overflowing into March", () => {
    const date = new Date(
      "2025-01-31T00:00:00.000Z"
    );

    const result = addBillingInterval(
      date,
      "MONTHLY"
    );

    expect(result).toEqual(
      new Date("2025-02-28T00:00:00.000Z")
    );
  });

  it("handles February 29 correctly in a leap year", () => {
    const date = new Date(
      "2024-02-29T00:00:00.000Z"
    );

    const result = addBillingInterval(
      date,
      "MONTHLY"
    );

    expect(result).toEqual(
      new Date("2024-03-29T00:00:00.000Z")
    );
  });

  it("handles December 31 when adding one month", () => {
    const date = new Date(
      "2025-12-31T00:00:00.000Z"
    );

    const result = addBillingInterval(
      date,
      "MONTHLY"
    );

    expect(result).toEqual(
      new Date("2026-01-31T00:00:00.000Z")
    );
  });

  it("handles February 29 when adding one year", () => {
    const date = new Date(
      "2024-02-29T00:00:00.000Z"
    );

    const result = addBillingInterval(
      date,
      "YEARLY"
    );

    expect(result).toEqual(
      new Date("2025-02-28T00:00:00.000Z")
    );
  });
  it("rejects requests without the internal billing secret", async () => {
    const response = await request(
      "/api/v1/internal/billing/run",
      {
        method: "POST",
        body: JSON.stringify({
          result: "SUCCESS",
        }),
      }
    );

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body.error.code).toBe(
      "INTERNAL_AUTHENTICATION_FAILED"
    );
  });
  it("rejects requests with an invalid internal billing secret", async () => {
    const response = await request(
      "/api/v1/internal/billing/run",
      {
        method: "POST",
        headers: {
          "X-Internal-Token": "wrong-secret",
        },
        body: JSON.stringify({
          result: "SUCCESS",
        }),
      }
    );

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body.error.code).toBe(
      "INTERNAL_AUTHENTICATION_FAILED"
    );
  });

  it("adds one normal monthly interval correctly", () => {
    const date = new Date(
      "2025-05-15T00:00:00.000Z"
    );

    const result = addBillingInterval(
      date,
      "MONTHLY"
    );

    expect(result).toEqual(
      new Date("2025-06-15T00:00:00.000Z")
    );
  });

  it("adds one normal yearly interval correctly", () => {
    const date = new Date(
      "2025-05-15T00:00:00.000Z"
    );

    const result = addBillingInterval(
      date,
      "YEARLY"
    );

    expect(result).toEqual(
      new Date("2026-05-15T00:00:00.000Z")
    );
  });
});
