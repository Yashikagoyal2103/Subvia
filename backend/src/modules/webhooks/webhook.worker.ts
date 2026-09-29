import {
  cleanupWebhookDeliveries,
  processWebhookDeliveries,
} from "./webhook.service.js";

const DELIVERY_INTERVAL = 5000;
const CLEANUP_INTERVAL = 60 * 60 * 1000;

let deliveryTimer: NodeJS.Timeout | undefined;
let cleanupTimer: NodeJS.Timeout | undefined;
let deliveryRun: Promise<void> | undefined;
let cleanupRun: Promise<void> | undefined;
let running = false;

async function runDeliveryWorker() {
  if (running) return;

  running = true;
  try {
    await processWebhookDeliveries();
  } catch (error) {
    console.error("Webhook worker error:", error);
  } finally {
    running = false;
  }
}

function triggerDeliveryWorker() {
  if (deliveryRun) return;

  deliveryRun = runDeliveryWorker().finally(() => {
    deliveryRun = undefined;
  });
}

async function runCleanupWorker() {
  try {
    const deleted = await cleanupWebhookDeliveries();

    if (deleted > 0) {
      console.log(`Webhook cleanup removed ${deleted} deliveries.`);
    }
  } catch (error) {
    console.error("Webhook cleanup error:", error);
  }
}

function triggerCleanupWorker() {
  if (cleanupRun) return;

  cleanupRun = runCleanupWorker().finally(() => {
    cleanupRun = undefined;
  });
}

export function startWebhookWorker() {
  if (deliveryTimer || cleanupTimer) return;

  deliveryTimer = setInterval(triggerDeliveryWorker, DELIVERY_INTERVAL);
  cleanupTimer = setInterval(triggerCleanupWorker, CLEANUP_INTERVAL);

  triggerDeliveryWorker();
  triggerCleanupWorker();

  console.log("Webhook worker started.");
}

export async function stopWebhookWorker() {
  if (deliveryTimer) {
    clearInterval(deliveryTimer);
    deliveryTimer = undefined;
  }

  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = undefined;
  }

  await Promise.all([deliveryRun, cleanupRun]);
}
