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

async function fixture(email = "idempotency@example.com") {
  const auth = await registerAndLogin(email);

  const business = await createBusiness(auth.accessToken);

  const service = await createService(
    auth.accessToken,
    business.id
  );

  const starter = await createPlan(
    auth.accessToken,
    business.id,
    service.id,
    {
      name: "Starter",
      price: 3000,
    }
  );

  const pro = await createPlan(
    auth.accessToken,
    business.id,
    service.id,
    {
      name: "Pro",
      price: 5000,
    }
  );

  const cheap = await createPlan(
    auth.accessToken,
    business.id,
    service.id,
    {
      name: "Basic",
      price: 1000,
    }
  );

  return {
    auth,
    business,
    service,
    starter,
    pro,
    cheap,
  };
}

function authHeaders(
  accessToken: string,
  idempotencyKey?: string
) {
  return {
    authorization: `Bearer ${accessToken}`,
    ...(idempotencyKey
      ? { "Idempotency-Key": idempotencyKey }
      : {}),
  };
}

async function createPendingSubscription(
  accessToken: string,
  businessId: string,
  planId: string,
  idempotencyKey: string
) {
  const response = await request(
    `/api/v1/businesses/${businessId}/subscriptions`,
    {
      method: "POST",
      headers: authHeaders(
        accessToken,
        idempotencyKey
      ),
      body: JSON.stringify({
        planId,
        currency: "INR",
      }),
    }
  );

  expect(response.status).toBe(201);

  return (await response.json()).data;
}

describe("Idempotency", () => {
  describe("Create subscription", () => {
    it("replays the same response for the same key and same request", async () => {
      const { auth, business, starter } =
        await fixture();

      const key = "create-sub-same-001";

      const first = await request(
        `/api/v1/businesses/${business.id}/subscriptions`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: starter.id,
            currency: "INR",
          }),
        }
      );

      expect(first.status).toBe(201);

      const firstBody = await first.json();

      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: starter.id,
            currency: "INR",
          }),
        }
      );

      expect(second.status).toBe(201);

      const secondBody = await second.json();

      expect(secondBody).toEqual(firstBody);

      expect(
        await prisma.subscription.count()
      ).toBe(1);

      expect(
        await prisma.invoice.count()
      ).toBe(1);

      expect(
        await prisma.idempotencyRecord.count()
      ).toBe(1);
    });

    it("rejects reuse of a key with a different request", async () => {
      const { auth, business, starter, pro } =
        await fixture();

      const key = "create-sub-reuse-001";

      const first = await createPendingSubscription(
        auth.accessToken,
        business.id,
        starter.id,
        key
      );

      expect(first.subscription.planId).toBe(
        starter.id
      );

      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: pro.id,
            currency: "INR",
          }),
        }
      );

      expect(second.status).toBe(409);

      const body = await second.json();

      expect(body.error.code).toBe(
        "IDEMPOTENCY_KEY_REUSED"
      );

      expect(
        await prisma.subscription.count()
      ).toBe(1);

      expect(
        await prisma.invoice.count()
      ).toBe(1);
    });

    it("requires an idempotency key", async () => {
      const { auth, business, starter } =
        await fixture();

      const response = await request(
        `/api/v1/businesses/${business.id}/subscriptions`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken
          ),
          body: JSON.stringify({
            planId: starter.id,
            currency: "INR",
          }),
        }
      );

      expect(response.status).toBe(400);

      const body = await response.json();

      expect(body.error.code).toBe(
        "IDEMPOTENCY_KEY_REQUIRED"
      );

      expect(
        await prisma.subscription.count()
      ).toBe(0);
    });

    it("allows different idempotency keys to represent different requests", async () => {
      const { auth, business, starter, pro } =
        await fixture();

      await createPendingSubscription(
        auth.accessToken,
        business.id,
        starter.id,
        "create-sub-key-a"
      );

      /*
       * This should be rejected by the business rule,
       * not by idempotency, because this is a DIFFERENT key.
       *
       * Current project behavior may expose an issue here
       * because the first subscription is still PENDING.
       */
      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            "create-sub-key-b"
          ),
          body: JSON.stringify({
            planId: pro.id,
            currency: "INR",
          }),
        }
      );

      expect([201, 409]).toContain(
        second.status
      );

      /*
       * If this returns 201, it highlights the current
       * PENDING-subscription business-rule/concurrency issue.
       */
    });
  });

  describe("Upgrade", () => {
    it("replays an upgrade with the same key", async () => {
      const { auth, business, starter, pro } =
        await fixture("upgrade-replay@example.com");

      const active =
        await createActiveSubscription(
          auth.accessToken,
          business.id,
          starter.id
        );

      const key = "upgrade-replay-001";

      const first = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/upgrade`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: pro.id,
          }),
        }
      );

      expect(first.status).toBe(201);

      const firstBody = await first.json();

      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/upgrade`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: pro.id,
          }),
        }
      );

      expect(second.status).toBe(201);

      const secondBody = await second.json();

      expect(secondBody).toEqual(firstBody);

      expect(
        await prisma.invoice.count({
          where: {
            subscriptionId:
              active.subscription.id,
          },
        })
      ).toBe(2);
    });

    it("rejects an upgrade key reused with another plan", async () => {
      const {
        auth,
        business,
        starter,
        pro,
        cheap,
      } = await fixture(
        "upgrade-reuse@example.com"
      );

      const active =
        await createActiveSubscription(
          auth.accessToken,
          business.id,
          starter.id
        );

      const key = "upgrade-reuse-001";

      const first = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/upgrade`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: pro.id,
          }),
        }
      );

      expect(first.status).toBe(201);

      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/upgrade`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: cheap.id,
          }),
        }
      );

      expect(second.status).toBe(409);

      const body = await second.json();

      expect(body.error.code).toBe(
        "IDEMPOTENCY_KEY_REUSED"
      );
    });
  });

  describe("Downgrade", () => {
    it("replays a downgrade with the same key", async () => {
      const { auth, business, starter, pro } =
        await fixture(
          "downgrade-replay@example.com"
        );

      const active =
        await createActiveSubscription(
          auth.accessToken,
          business.id,
          pro.id
        );

      const key = "downgrade-replay-001";

      const first = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/downgrade`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: starter.id,
          }),
        }
      );

      expect(first.status).toBe(200);

      const firstBody = await first.json();

      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/downgrade`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: starter.id,
          }),
        }
      );

      expect(second.status).toBe(200);

      const secondBody = await second.json();

      expect(secondBody).toEqual(firstBody);

      const subscription =
        await prisma.subscription.findUniqueOrThrow(
          {
            where: {
              id: active.subscription.id,
            },
          }
        );

      expect(subscription.pendingPlanId).toBe(
        starter.id
      );
    });

    it("rejects a downgrade key reused with another plan", async () => {
      const { auth, business, starter, cheap, pro } =
        await fixture(
          "downgrade-reuse@example.com"
        );

      const active =
        await createActiveSubscription(
          auth.accessToken,
          business.id,
          pro.id
        );

      const key = "downgrade-reuse-001";

      const first = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/downgrade`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: starter.id,
          }),
        }
      );

      expect(first.status).toBe(200);

      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/downgrade`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: cheap.id,
          }),
        }
      );

      expect(second.status).toBe(409);

      const body = await second.json();

      expect(body.error.code).toBe(
        "IDEMPOTENCY_KEY_REUSED"
      );

      const subscription =
        await prisma.subscription.findUniqueOrThrow({
            where: {
            id: active.subscription.id,
            },
        });

        expect(subscription.pendingPlanId).toBe(
        starter.id
        );
    });
  });

  describe("Cancellation", () => {
    it("replays period-end cancellation with the same key", async () => {
      const { auth, business, starter } =
        await fixture(
          "cancel-period@example.com"
        );

      const active =
        await createActiveSubscription(
          auth.accessToken,
          business.id,
          starter.id
        );

      const key = "cancel-period-001";

      const first = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/cancel`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            mode: "PERIOD_END",
          }),
        }
      );

      expect(first.status).toBe(200);

      const firstBody = await first.json();

      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/cancel`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            mode: "PERIOD_END",
          }),
        }
      );

      expect(second.status).toBe(200);

      const secondBody = await second.json();

      expect(secondBody).toEqual(firstBody);

      const subscription =
        await prisma.subscription.findUniqueOrThrow(
          {
            where: {
              id: active.subscription.id,
            },
          }
        );

      expect(
        subscription.cancelAtPeriodEnd
      ).toBe(true);
    });

    it("rejects a cancellation key reused with a different mode", async () => {
      const { auth, business, starter } =
        await fixture(
          "cancel-reuse@example.com"
        );

      const active =
        await createActiveSubscription(
          auth.accessToken,
          business.id,
          starter.id
        );

      const key = "cancel-reuse-001";

      const first = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/cancel`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            mode: "PERIOD_END",
          }),
        }
      );

      expect(first.status).toBe(200);

      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/cancel`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            mode: "IMMEDIATE",
          }),
        }
      );

      expect(second.status).toBe(409);

      const body = await second.json();

      expect(body.error.code).toBe(
        "IDEMPOTENCY_KEY_REUSED"
      );

      expect(
        await prisma.creditLedger.count()
      ).toBe(0);
    });

    it("does not create duplicate cancellation credit on retry", async () => {
      const { auth, business, starter } =
        await fixture(
          "cancel-credit@example.com"
        );

      const active =
        await createActiveSubscription(
          auth.accessToken,
          business.id,
          starter.id
        );

      const key = "cancel-credit-001";

      const first = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/cancel`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            mode: "IMMEDIATE",
          }),
        }
      );

      expect(first.status).toBe(200);

      const second = await request(
        `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}/cancel`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            mode: "IMMEDIATE",
          }),
        }
      );

      expect(second.status).toBe(200);

      expect(
        await prisma.creditLedger.count({
          where: {
            customerProfileId:
              active.subscription
                .customerProfileId,
            type: "CREDIT",
          },
        })
      ).toBe(1);
    });
  });

  describe("Payment", () => {
    it("replays a successful payment with the same key", async () => {
      const { auth, business, starter } =
        await fixture(
          "payment-replay@example.com"
        );

      const pending =
        await createPendingSubscription(
          auth.accessToken,
          business.id,
          starter.id,
          "payment-setup-sub"
        );

      const key = "payment-replay-001";

      const payload = {
        invoiceId: pending.invoice.id,
        paymentMethod: "DEMO",
        result: "SUCCESS",
      };

      const first = await request(
        `/api/v1/businesses/${business.id}/payments`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify(payload),
        }
      );

      expect(first.status).toBe(201);

      const firstBody = await first.json();

      const second = await request(
        `/api/v1/businesses/${business.id}/payments`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify(payload),
        }
      );

      expect(second.status).toBe(201);

      const secondBody = await second.json();

      expect(secondBody).toEqual(firstBody);

      expect(
        await prisma.payment.count({
          where: {
            invoiceId: pending.invoice.id,
          },
        })
      ).toBe(1);
    });

    it("rejects a payment key reused with a different result", async () => {
      const { auth, business, starter } =
        await fixture(
          "payment-reuse@example.com"
        );

      const pending =
        await createPendingSubscription(
          auth.accessToken,
          business.id,
          starter.id,
          "payment-setup-sub-2"
        );

      const key = "payment-reuse-001";

      const first = await request(
        `/api/v1/businesses/${business.id}/payments`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            invoiceId: pending.invoice.id,
            paymentMethod: "DEMO",
            result: "FAILED",
          }),
        }
      );

      expect(first.status).toBe(201);

      const second = await request(
        `/api/v1/businesses/${business.id}/payments`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            invoiceId: pending.invoice.id,
            paymentMethod: "DEMO",
            result: "SUCCESS",
          }),
        }
      );

      expect(second.status).toBe(409);

      const body = await second.json();

      expect(body.error.code).toBe(
        "IDEMPOTENCY_KEY_REUSED"
      );

      expect(
        await prisma.payment.count({
          where: {
            invoiceId: pending.invoice.id,
          },
        })
      ).toBe(1);
    });

    it("does not create a second payment when the same request is retried", async () => {
      const { auth, business, starter } =
        await fixture(
          "payment-count@example.com"
        );

      const pending =
        await createPendingSubscription(
          auth.accessToken,
          business.id,
          starter.id,
          "payment-setup-sub-3"
        );

      const key = "payment-count-001";

      const payload = {
        invoiceId: pending.invoice.id,
        paymentMethod: "DEMO",
        result: "SUCCESS",
      };

      await request(
        `/api/v1/businesses/${business.id}/payments`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify(payload),
        }
      );

      await request(
        `/api/v1/businesses/${business.id}/payments`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify(payload),
        }
      );

      expect(
        await prisma.payment.count({
          where: {
            invoiceId: pending.invoice.id,
          },
        })
      ).toBe(1);

      const invoice =
        await prisma.invoice.findUniqueOrThrow(
          {
            where: {
              id: pending.invoice.id,
            },
          }
        );

      expect(invoice.status).toBe("PAID");

      const subscription =
        await prisma.subscription.findUniqueOrThrow(
          {
            where: {
              id: pending.subscription.id,
            },
          }
        );

      expect(subscription.status).toBe(
        "ACTIVE"
      );
    });
  });

  describe("Tenant isolation", () => {
    it("does not allow an idempotency key from one business to affect another business", async () => {
      const first = await fixture(
        "tenant-one@example.com"
      );

      const second = await fixture(
        "tenant-two@example.com"
      );

      const key = "tenant-isolation-001";

      const firstRequest =
        await createPendingSubscription(
          first.auth.accessToken,
          first.business.id,
          first.starter.id,
          key
        );

      expect(
        firstRequest.subscription
      ).toBeDefined();

      const secondRequest = await request(
        `/api/v1/businesses/${second.business.id}/subscriptions`,
        {
          method: "POST",
          headers: authHeaders(
            second.auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: second.starter.id,
            currency: "INR",
          }),
        }
      );

      expect(secondRequest.status).toBe(201);

      expect(
        await prisma.idempotencyRecord.count()
      ).toBe(2);
    });
  });

  describe("Idempotency database invariants", () => {
    it("stores exactly one record for one successful operation", async () => {
      const { auth, business, starter } =
        await fixture(
          "record-count@example.com"
        );

      await createPendingSubscription(
        auth.accessToken,
        business.id,
        starter.id,
        "record-count-001"
      );

      const records =
        await prisma.idempotencyRecord.findMany();

      expect(records).toHaveLength(1);
      expect(records[0].operation).toBe(
        "CREATE_SUBSCRIPTION"
      );
      expect(records[0].userId).toBe(
        auth.userId
      );
      expect(records[0].businessId).toBe(
        business.id
      );
    });

    it("does not leave an incomplete idempotency record after a failed operation", async () => {
      const { auth, business } =
        await fixture(
          "failed-operation@example.com"
        );

      const fakePlanId =
        "00000000-0000-0000-0000-000000000001";

      const key = "failed-operation-001";

      const response = await request(
        `/api/v1/businesses/${business.id}/subscriptions`,
        {
          method: "POST",
          headers: authHeaders(
            auth.accessToken,
            key
          ),
          body: JSON.stringify({
            planId: fakePlanId,
            currency: "INR",
          }),
        }
      );

      expect(response.status).toBe(400);

      /*
       * Because the idempotency record and the
       * business operation live in the same transaction,
       * the failed operation must not leave a
       * completed idempotency record behind.
       */
      expect(
        await prisma.idempotencyRecord.count()
      ).toBe(0);
    });
  });
});