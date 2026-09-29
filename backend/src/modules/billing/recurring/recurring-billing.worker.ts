import { processDueSubscriptions } from "./recurring-billing.service.js";

const BILLING_INTERVAL = 60 * 1000;

let billingTimer: NodeJS.Timeout | undefined;
let billingRun: Promise<void> | undefined;
let running = false;

async function runBillingWorker() {
  if (running) return;

  running = true;
  try {
    const result = await processDueSubscriptions();

    if (result.processed > 0) {
      console.log(
        `Recurring billing processed ${result.processed} subscription(s): ${result.succeeded} succeeded, ${result.failed} failed, ${result.cancelled} cancelled.`,
      );
    }
  } catch (error) {
    console.error("Recurring billing worker error:", error);
  } finally {
    running = false;
  }
}

function triggerBillingWorker() {
  if (billingRun) return;

  billingRun = runBillingWorker().finally(() => {
    billingRun = undefined;
  });
}

export function startRecurringBillingWorker() {
  if (billingTimer) return;

  billingTimer = setInterval(triggerBillingWorker, BILLING_INTERVAL);
  triggerBillingWorker();

  console.log("Recurring billing worker started.");
}

export async function stopRecurringBillingWorker() {
  if (billingTimer) {
    clearInterval(billingTimer);
    billingTimer = undefined;
  }

  await billingRun;
}
