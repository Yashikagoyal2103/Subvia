import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireAccountType } from "../../middleware/account-type.middleware.js";
import { requireBusinessRole } from "../../middleware/authorization.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";

import {
  create,
  list,
  update,
  remove,
} from "./webhook.controller.js";

const router = Router();

const admin = [
  authenticate,
  requireAccountType("ADMIN"),
  requireBusinessRole("BUSINESS_ADMIN"),
];

router.post(
  "/:businessId/webhooks",
  ...admin,
  authRoute(create),
);

router.get(
  "/:businessId/webhooks",
  ...admin,
  authRoute(list),
);

router.patch(
  "/:businessId/webhooks/:endpointId",
  ...admin,
  authRoute(update),
);

router.delete(
  "/:businessId/webhooks/:endpointId",
  ...admin,
  authRoute(remove),
);

export default router;