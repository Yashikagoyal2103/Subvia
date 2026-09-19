import crypto from "node:crypto";
import http from "node:http";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import {
  cleanupWebhookDeliveries,
  processWebhookDeliveries,
  signWebhookPayload,
} from "../src/modules/webhooks/webhook.service.js";
import {
  createActiveSubscription,
  createBusiness,
  createPlan,
  createService,
  registerAndLogin,
  request,
} from "./helpers.js";

async function fixture() {
  const auth = await registerAndLogin(
    `webhook-${crypto.randomUUID()}@example.com`
  );

  const business = await createBusiness(
    auth.accessToken
  );

  const service = await createService(
    auth.accessToken,
    business.id
  );

  const plan = await createPlan(
    auth.accessToken,
    business.id,
    service.id
  );

  return {
    auth,
    business,
    service,
    plan,
  };
}

async function createEndpoint(
  accessToken: string,
  businessId: string,
  url: string
) {
  const response = await request(
    `/api/v1/businesses/${businessId}/webhooks`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url }),
    }
  );

  expect(response.status).toBe(201);

  return (await response.json()).data;
}

async function startReceiver() {
  let received:
    | {
        body: string;
        headers: http.IncomingHttpHeaders;
      }
    | undefined;

  const server = http.createServer(
    (req, res) => {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        received = {
          body,
          headers: req.headers,
        };

        res.writeHead(200);
        res.end("ok");
      });
    }
  );

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Receiver failed to start.");
  }

  return {
    url: `http://127.0.0.1:${address.port}/webhook`,
    getReceived: () => received,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error ? reject(error) : resolve()
        );
      }),
  };
}

describe("Webhooks", () => {
  it("creates a webhook endpoint and returns the secret only once", async () => {
    const { auth, business } = await fixture();

    const endpoint = await createEndpoint(
      auth.accessToken,
      business.id,
      "https://example.com/webhooks"
    );

    expect(endpoint.id).toBeDefined();
    expect(endpoint.url).toBe(
      "https://example.com/webhooks"
    );
    expect(endpoint.status).toBe("ACTIVE");
    expect(endpoint.secret).toBeDefined();

    const list = await request(
      `/api/v1/businesses/${business.id}/webhooks`,
      {
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
        },
      }
    );

    expect(list.status).toBe(200);

    const body = await list.json();

    expect(body.data[0].secret).toBeUndefined();
  });

  it("creates a delivery in the same transaction as the event", async () => {
    const { auth, business, plan } =
      await fixture();

    await createEndpoint(
      auth.accessToken,
      business.id,
      "https://example.com/webhooks"
    );

    const active =
      await createActiveSubscription(
        auth.accessToken,
        business.id,
        plan.id
      );

    const events =
      await prisma.subscriptionEvent.findMany({
        where: {
          subscriptionId:
            active.subscription.id,
        },
      });

    const deliveries =
      await prisma.webhookDelivery.findMany();

    expect(events.length).toBeGreaterThan(0);
    expect(deliveries.length).toBe(events.length);

    expect(
      deliveries.every(
        (delivery) =>
          delivery.eventId === events[0].id ||
          events.some(
            (event) =>
              event.id === delivery.eventId
          )
      )
    ).toBe(true);
  });

  it("rolls back the event and delivery together", async () => {
    const { auth, business, plan } =
      await fixture();

    await createEndpoint(
      auth.accessToken,
      business.id,
      "https://example.com/webhooks"
    );

    const active =
      await createActiveSubscription(
        auth.accessToken,
        business.id,
        plan.id
      );

    await expect(
      prisma.$transaction(async (tx) => {
        const event =
          await tx.subscriptionEvent.create({
            data: {
              subscriptionId:
                active.subscription.id,
              type: "CANCELLED",
              metadata: {
                test: true,
              },
            },
          });

        const {
          createWebhookDeliveries,
        } =
          await import(
            "../src/modules/webhooks/webhook.service.js"
          );

        await createWebhookDeliveries(tx, {
          eventId: event.id,
          subscriptionId:
            active.subscription.id,
          type: "CANCELLED",
          metadata: {
            test: true,
          },
          createdAt: event.createdAt,
        });

        throw new Error("ROLLBACK_TEST");
      })
    ).rejects.toThrow("ROLLBACK_TEST");

    const events =
      await prisma.subscriptionEvent.count({
        where: {
          subscriptionId:
            active.subscription.id,
          type: "CANCELLED",
        },
      });

    expect(events).toBe(0);

    expect(
      await prisma.webhookDelivery.count()
    ).toBeGreaterThan(0);
  });

  it("delivers a webhook with an HMAC signature", async () => {
    const receiver = await startReceiver();

    try {
      const { auth, business, plan } =
        await fixture();

      const endpoint = await createEndpoint(
        auth.accessToken,
        business.id,
        receiver.url
      );

      const active =
        await createActiveSubscription(
          auth.accessToken,
          business.id,
          plan.id
        );

      const result =
        await processWebhookDeliveries();

      expect(result.delivered).toBeGreaterThan(0);

      const received =
        receiver.getReceived();

      expect(received).toBeDefined();

      const delivery =
        await prisma.webhookDelivery.findFirstOrThrow({
          where: {
            endpointId: endpoint.id,
            eventType: "payment.succeeded",
          },
        });

      const timestamp =
        received!.headers[
          "x-webhook-timestamp"
        ];

      const signature =
        received!.headers[
          "x-webhook-signature"
        ];

      expect(timestamp).toBeDefined();
      expect(signature).toBeDefined();

      const expected =
        signWebhookPayload(
          JSON.parse(received!.body),
          endpoint.secret,
          String(timestamp)
        );

      expect(signature).toBe(
        `t=${timestamp},v1=${expected}`
      );

      expect(
        received!.headers[
          "x-webhook-delivery-id"
        ]
      ).toBe(delivery.id);

      expect(
        received!.headers["x-webhook-event"]
      ).toBe("payment.succeeded");

      expect(
        active.subscription.id
      ).toBeDefined();
    } finally {
      await receiver.close();
    }
  });

  it("retries failed deliveries and eventually marks them failed", async () => {
    const { auth, business, plan } =
      await fixture();

    const endpoint = await createEndpoint(
      auth.accessToken,
      business.id,
      "http://127.0.0.1:9/webhook"
    );

    const active =
      await createActiveSubscription(
        auth.accessToken,
        business.id,
        plan.id
      );

    const delivery =
      await prisma.webhookDelivery.findFirstOrThrow({
        where: {
          endpointId: endpoint.id,
        },
      });

    await prisma.webhookDelivery.update({
      where: {
        id: delivery.id,
      },
      data: {
        attempts: 4,
        nextAttemptAt: new Date(
          Date.now() - 1000
        ),
      },
    });

    const result =
      await processWebhookDeliveries();

    expect(result.failed).toBe(1);

    const updated =
      await prisma.webhookDelivery.findUniqueOrThrow({
        where: {
          id: delivery.id,
        },
      });

    expect(updated.status).toBe("FAILED");
    expect(updated.attempts).toBe(5);
    expect(updated.lastError).toBeDefined();

    expect(
      active.subscription.id
    ).toBeDefined();
  });

  it("cleans terminal deliveries older than 30 days", async () => {
    const { auth, business, plan } =
      await fixture();

    const endpoint = await createEndpoint(
      auth.accessToken,
      business.id,
      "https://example.com/webhooks"
    );

    const active =
      await createActiveSubscription(
        auth.accessToken,
        business.id,
        plan.id
      );

    const delivery =
      await prisma.webhookDelivery.findFirstOrThrow({
        where: {
          endpointId: endpoint.id,
        },
      });

    const oldDate = new Date(
      Date.now() -
        31 * 24 * 60 * 60 * 1000
    );

    await prisma.webhookDelivery.update({
      where: {
        id: delivery.id,
      },
      data: {
        status: "DELIVERED",
        deliveredAt: oldDate,
        createdAt: oldDate,
      },
    });

    const deleted =
      await cleanupWebhookDeliveries();

    expect(deleted).toBe(1);

    await expect(
      prisma.webhookDelivery.findUnique({
        where: {
          id: delivery.id,
        },
      })
    ).resolves.toBeNull();

    expect(
      active.subscription.id
    ).toBeDefined();
  });

  it("prevents another business from managing the endpoint", async () => {
    const owner = await registerAndLogin(
      `owner-${crypto.randomUUID()}@example.com`
    );

    const outsider = await registerAndLogin(
      `outsider-${crypto.randomUUID()}@example.com`
    );

    const business = await createBusiness(
      owner.accessToken
    );

    const endpoint = await createEndpoint(
      owner.accessToken,
      business.id,
      "https://example.com/webhooks"
    );

    const response = await request(
      `/api/v1/businesses/${business.id}/webhooks/${endpoint.id}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${outsider.accessToken}`,
        },
      }
    );

    expect(response.status).toBe(403);
  });
});