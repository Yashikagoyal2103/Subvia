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
};
