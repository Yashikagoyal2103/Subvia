import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { create, getById, list, upgrade, downgrade } from "./subscription.controller.js";

const router = Router();

router.post(
    "/:businessId/subscriptions", 
    authenticate, 
    authRoute(create)
);

router.get(
    "/:businessId/subscriptions", 
    authenticate, 
    authRoute(list)
);

router.get(
    "/:businessId/subscriptions/:subscriptionId", 
    authenticate, 
    authRoute(getById)
);

router.post(
  "/:businessId/subscriptions/:subscriptionId/upgrade",
  authenticate,
  authRoute(upgrade)
);
router.post(
  "/:businessId/subscriptions/:subscriptionId/downgrade",
  authenticate,
  authRoute(downgrade)
);

export default router;