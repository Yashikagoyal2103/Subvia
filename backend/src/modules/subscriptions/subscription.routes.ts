import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { create, getById, list } from "./subscription.controller.js";

const router = Router();

router.post("/:businessId/subscriptions", authenticate, authRoute(create));
router.get("/:businessId/subscriptions", authenticate, authRoute(list));
router.get("/:businessId/subscriptions/:subscriptionId", authenticate, authRoute(getById));

export default router;