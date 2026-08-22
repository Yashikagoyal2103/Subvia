import { Router } from "express";
import rateLimit from "express-rate-limit";
import {login, logoutUser, refresh, register} from "./auth.controller.js";
import { authenticate, AuthenticatedRequest } from "../../middleware/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", authLimiter, refresh);
router.post("/logout", logoutUser);
router.get("/me", authenticate, (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  res.json({
    success: true,
    data: { userId }
  });
});

export default router;