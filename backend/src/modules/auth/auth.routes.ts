import { Router } from "express";
import rateLimit from "express-rate-limit";
import {login, logoutUser, refresh, register} from "./auth.controller.js";
import { authenticate, AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { prisma } from "../../config/prisma.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 1000 : 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", authLimiter, refresh);
router.post("/logout", logoutUser);
router.get(
  "/me",
  authenticate,
  async (req, res) => {
    const userId =
      (req as AuthenticatedRequest).userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        accountType: true,
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return res.json({
      success: true,
      data: user,
    });
  },
);

export default router;
