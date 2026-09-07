import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { getBalance } from "./credit.controller.js";

const router = Router();

router.get(
  "/:businessId/credits",
  authenticate,
  authRoute(getBalance)
);

export default router;