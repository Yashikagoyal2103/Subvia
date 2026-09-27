import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  getMe,
  login,
  logoutUser,
  refresh,
  register,
  updateMe,
} from "./auth.controller.js";

import {
  authenticate,
} from "../../middleware/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 1000 : 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.post(
  "/register",
  authLimiter,
  register,
);

router.post(
  "/login",
  authLimiter,
  login,
);

router.post(
  "/refresh",
  authLimiter,
  refresh,
);

router.post(
  "/logout",
  logoutUser,
);

router.get(
  "/me",
  authenticate,
  getMe,
);

router.patch(
  "/me",
  authenticate,
  updateMe,
);

export default router;