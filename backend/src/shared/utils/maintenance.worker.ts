import { prisma } from "../../config/prisma.js";
import { cleanupExpiredIdempotencyRecords } from "./idempotency-cleanup.js";

const MAINTENANCE_INTERVAL = 60 * 60 * 1000;
const REFRESH_TOKEN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

let maintenanceTimer: NodeJS.Timeout | undefined;
let maintenanceRun: Promise<void> | undefined;
let running = false;

export async function cleanupExpiredRefreshTokens(now: Date = new Date()) {
  const expiresBefore = new Date(now.getTime() - REFRESH_TOKEN_RETENTION_MS);

  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: expiresBefore,
      },
    },
  });

  return result.count;
}

async function runMaintenance() {
  if (running) return;
  running = true;

  try {
    const [idempotencyDeleted, refreshTokensDeleted] = await Promise.all([
      cleanupExpiredIdempotencyRecords(),
      cleanupExpiredRefreshTokens(),
    ]);

    if (idempotencyDeleted > 0 || refreshTokensDeleted > 0) {
      console.log(
        `Maintenance cleanup removed ${idempotencyDeleted} idempotency record(s) and ${refreshTokensDeleted} refresh token(s).`,
      );
    }
  } catch (error) {
    console.error("Maintenance worker error:", error);
  } finally {
    running = false;
  }
}

export function startMaintenanceWorker() {
  if (maintenanceTimer) return;

  maintenanceTimer = setInterval(() => {
    if (!maintenanceRun) {
      maintenanceRun = runMaintenance().finally(() => {
        maintenanceRun = undefined;
      });
    }
  }, MAINTENANCE_INTERVAL);

  maintenanceRun = runMaintenance().finally(() => {
    maintenanceRun = undefined;
  });

  console.log("Maintenance worker started.");
}

export async function stopMaintenanceWorker() {
  if (maintenanceTimer) {
    clearInterval(maintenanceTimer);
    maintenanceTimer = undefined;
  }

  await maintenanceRun;
}
