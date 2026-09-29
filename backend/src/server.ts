import type { Server } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import {
  startWebhookWorker,
  stopWebhookWorker,
} from "./modules/webhooks/webhook.worker.js";
import {
  startRecurringBillingWorker,
  stopRecurringBillingWorker,
} from "./modules/billing/recurring/recurring-billing.worker.js";
import {
  startMaintenanceWorker,
  stopMaintenanceWorker,
} from "./shared/utils/maintenance.worker.js";

let server: Server | undefined;
let shuttingDown = false;

export function startServer() {
  if (server) return server;

  server = app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);

    startWebhookWorker();
    startRecurringBillingWorker();
    startMaintenanceWorker();
  });

  return server;
}

export async function shutdownServer(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully...`);

  await Promise.all([
    stopWebhookWorker(),
    stopRecurringBillingWorker(),
    stopMaintenanceWorker(),
  ]);

  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => resolve());
    });
    server = undefined;
  }

  await prisma.$disconnect();
}

if (process.env.NODE_ENV !== "test") {
  startServer();

  process.once("SIGTERM", () => {
    void shutdownServer("SIGTERM").finally(() => process.exit(0));
  });

  process.once("SIGINT", () => {
    void shutdownServer("SIGINT").finally(() => process.exit(0));
  });
}
