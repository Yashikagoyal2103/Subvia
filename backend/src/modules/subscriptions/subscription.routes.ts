import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { create, getById, list, events,upgrade, downgrade, cancel , createCustomer} from "./subscription.controller.js";
import { requireAccountType } from "../../middleware/account-type.middleware.js";

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

router.get(
  "/:businessId/subscriptions/:subscriptionId/events",
  authenticate,
  authRoute(events)
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
router.post(
  "/:businessId/subscriptions/:subscriptionId/cancel",
  authenticate,
  authRoute(cancel)
);

router.post(
  "/subscriptions",
  authenticate,
  requireAccountType("CUSTOMER"),
  authRoute(createCustomer),
);

export default router;