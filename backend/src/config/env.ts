import "dotenv/config";

const requiredSecret = (name: string, minLength = 32): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters long`);
  }

  return value;
};

const refreshTokenExpiresDays = Number(
  process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7,
);

if (!Number.isFinite(refreshTokenExpiresDays) || refreshTokenExpiresDays <= 0) {
  throw new Error("REFRESH_TOKEN_EXPIRES_DAYS must be a positive number");
}

const frontendUrl = process.env.FRONTEND_URL ?? (process.env.NODE_ENV === "test" ? "http://127.0.0.1" : undefined);

if (!frontendUrl) {
  throw new Error("FRONTEND_URL is not configured");
}

const webhookSecretEncryptionKey = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY ?? (process.env.NODE_ENV === "test" ? "0".repeat(64) : undefined);
if (!webhookSecretEncryptionKey || !/^[0-9a-fA-F]{64}$/.test(webhookSecretEncryptionKey)) {
  throw new Error("WEBHOOK_SECRET_ENCRYPTION_KEY must be a 32-byte hex key");
}

const apiKeyMaxLifetimeDays = Number(process.env.API_KEY_MAX_LIFETIME_DAYS ?? 365);
if (!Number.isInteger(apiKeyMaxLifetimeDays) || apiKeyMaxLifetimeDays < 1 || apiKeyMaxLifetimeDays > 3650) {
  throw new Error("API_KEY_MAX_LIFETIME_DAYS must be an integer between 1 and 3650");
}

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port");
}

export const env = {
  JWT_SECRET: requiredSecret("JWT_SECRET"),

  INTERNAL_BILLING_SECRET: requiredSecret(
    "INTERNAL_BILLING_SECRET",
  ),

  ACCESS_TOKEN_EXPIRES_IN:
    process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",

  REFRESH_TOKEN_EXPIRES_DAYS: refreshTokenExpiresDays,

  PORT: port,

  FRONTEND_URL: frontendUrl,
  API_KEY_MAX_LIFETIME_DAYS: apiKeyMaxLifetimeDays,
  WEBHOOK_SECRET_ENCRYPTION_KEY: webhookSecretEncryptionKey,
};


