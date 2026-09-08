import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requireBusinessRole } from "../../../middleware/auhtorization.middleware.js";
import { authRoute } from "../../../shared/utils/route-wrapper.js";
import { run } from "./recurring-billing.controller.js";

const router = Router();

router.post(
  "/run",
  authenticate,
  requireBusinessRole("BUSINESS_ADMIN"),
  authRoute(run)
);

export default router;