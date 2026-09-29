import rateLimit from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 1000 : 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test"
    ? 1000
    : 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});


export const publicApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 1000 : 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

