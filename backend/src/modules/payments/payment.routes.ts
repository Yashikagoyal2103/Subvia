import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { create, getById, list } from "./payment.controller.js";

const router = Router();

router.post(
  "/:businessId/payments",
  authenticate,
  authRoute(create)
);

router.get(
  "/:businessId/payments",
  authenticate,
  authRoute(list)
);

router.get(
  "/:businessId/payments/:paymentId",
  authenticate,
  authRoute(getById)
);

export default router;