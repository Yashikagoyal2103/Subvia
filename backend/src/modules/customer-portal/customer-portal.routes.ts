import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireAccountType } from "../../middleware/account-type.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import {
  getBillingActivity,
  getCredits,
  getInvoice,
  getSubscription,
  getSubscriptionEvents,
  listInvoices,
  listSubscriptions,
} from "./customer-portal.controller.js";
import { createCustomer } from "../subscriptions/subscription.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireAccountType("CUSTOMER"));

router.post(
  "/subscriptions",
  authRoute(createCustomer),
);

router.get(
  "/subscriptions",
  authRoute(listSubscriptions),
);

router.get(
  "/subscriptions/:subscriptionId",
  authRoute(getSubscription),
);

router.get(
  "/subscriptions/:subscriptionId/events",
  authRoute(getSubscriptionEvents),
);

router.get(
  "/invoices",
  authRoute(listInvoices),
);

router.get(
  "/invoices/:invoiceId",
  authRoute(getInvoice),
);

router.get(
  "/credits",
  authRoute(getCredits),
);

router.get(
  "/billing-activity",
  authRoute(getBillingActivity),
);

export default router;