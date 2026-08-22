import "dotenv/config";

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
};

export const env = {
  JWT_SECRET: requiredEnv("JWT_SECRET"),
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  REFRESH_TOKEN_EXPIRES_DAYS: Number( process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7
  ),
};