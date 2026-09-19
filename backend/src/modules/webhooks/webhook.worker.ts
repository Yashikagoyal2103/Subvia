import {
  cleanupWebhookDeliveries,
  processWebhookDeliveries,
} from "./webhook.service.js";

const DELIVERY_INTERVAL = 5000;
const CLEANUP_INTERVAL = 60 * 60 * 1000;

let deliveryTimer: NodeJS.Timeout | undefined;
let cleanupTimer: NodeJS.Timeout | undefined;
let running = false;

async function runDeliveryWorker() {
  if (running) {
    return;
  }

  running = true;

  try {
    await processWebhookDeliveries();
  } catch (error) {
    console.error("Webhook worker error:", error);
  } finally {
    running = false;
  }
}

async function runCleanupWorker() {
  try {
    const deleted =
      await cleanupWebhookDeliveries();

    if (deleted > 0) {
      console.log(
        `Webhook cleanup removed ${deleted} deliveries.`
      );
    }
  } catch (error) {
    console.error(
      "Webhook cleanup error:",
      error
    );
  }
}

export function startWebhookWorker() {
  if (deliveryTimer || cleanupTimer) {
    return;
  }

  deliveryTimer = setInterval(
    runDeliveryWorker,
    DELIVERY_INTERVAL
  );

  cleanupTimer = setInterval(
    runCleanupWorker,
    CLEANUP_INTERVAL
  );

  void runDeliveryWorker();
  void runCleanupWorker();

  console.log("Webhook worker started.");
}

export function stopWebhookWorker() {
  if (deliveryTimer) {
    clearInterval(deliveryTimer);
    deliveryTimer = undefined;
  }

  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = undefined;
  }
}