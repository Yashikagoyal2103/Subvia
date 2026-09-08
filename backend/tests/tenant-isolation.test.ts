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

describe("Tenant isolation", () => {
  it("prevents access to another user's business", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const outsider = await registerAndLogin("outsider@example.com");

    const business = await createBusiness(owner.accessToken);

    const response = await request(
      `/api/v1/businesses/${business.id}`,
      {
        headers: {
          authorization: `Bearer ${outsider.accessToken}`,
        },
      }
    );

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body.error.code).toBe("BUSINESS_NOT_FOUND");
  });

  it("prevents a non-member from managing another business's services", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const outsider = await registerAndLogin("outsider@example.com");

    const business = await createBusiness(owner.accessToken);

    const response = await request(
      `/api/v1/businesses/${business.id}/services`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${outsider.accessToken}`,
        },
        body: JSON.stringify({
          name: "Unauthorized Service",
        }),
      }
    );

    expect(response.status).toBe(403);

    const body = await response.json();

    expect(body.error.code).toBe(
      "BUSINESS_ACCESS_DENIED"
    );
  });

  it("prevents cross-tenant subscription access", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const outsider = await registerAndLogin("outsider@example.com");

    const business = await createBusiness(owner.accessToken);

    const service = await createService(
      owner.accessToken,
      business.id
    );

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
      `/api/v1/businesses/${business.id}/subscriptions/${active.subscription.id}`,
      {
        headers: {
          authorization: `Bearer ${outsider.accessToken}`,
        },
      }
    );

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body.error.code).toBe(
      "SUBSCRIPTION_NOT_FOUND"
    );
  });

  it("prevents cross-tenant invoice access", async () => {
    const owner = await registerAndLogin("invoice-owner@example.com");
    const outsider = await registerAndLogin("invoice-outsider@example.com");

    const business = await createBusiness(owner.accessToken);

    const service = await createService(
      owner.accessToken,
      business.id
    );

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
      `/api/v1/businesses/${business.id}/invoices/${active.invoice.id}`,
      {
        headers: {
          authorization: `Bearer ${outsider.accessToken}`,
        },
      }
    );

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body.error.code).toBe(
      "INVOICE_NOT_FOUND"
    );
  });

  it("prevents cross-tenant payment access", async () => {
    const owner = await registerAndLogin("payment-owner@example.com");
    const outsider = await registerAndLogin("payment-outsider@example.com");

    const business = await createBusiness(owner.accessToken);

    const service = await createService(
      owner.accessToken,
      business.id
    );

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

    const payment = await prisma.payment.findFirstOrThrow({
      where: {
        invoiceId: active.invoice.id,
      },
    });

    const response = await request(
      `/api/v1/businesses/${business.id}/payments/${payment.id}`,
      {
        headers: {
          authorization: `Bearer ${outsider.accessToken}`,
        },
      }
    );

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body.error.code).toBe(
      "PAYMENT_NOT_FOUND"
    );
  });

  it("prevents cross-tenant credit access", async () => {
    const owner = await registerAndLogin("credit-owner@example.com");
    const outsider = await registerAndLogin("credit-outsider@example.com");

    const business = await createBusiness(owner.accessToken);

    const service = await createService(
      owner.accessToken,
      business.id
    );

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

    await prisma.creditLedger.create({
      data: {
        customerProfileId:
          active.subscription.customerProfileId,
        amount: 500,
        currency: "INR",
        type: "CREDIT",
        description: "Private test credit",
      },
    });

    const response = await request(
      `/api/v1/businesses/${business.id}/credits`,
      {
        headers: {
          authorization: `Bearer ${outsider.accessToken}`,
        },
      }
    );

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body.error.code).toBe(
      "CUSTOMER_NOT_FOUND"
    );
  });
});