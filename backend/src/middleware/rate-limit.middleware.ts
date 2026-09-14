import rateLimit from "express-rate-limit";

export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test"
    ? 1000
    : 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});