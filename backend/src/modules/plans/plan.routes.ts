import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireAccountType } from "../../middleware/account-type.middleware.js";
import { requireBusinessRole } from "../../middleware/authorization.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";

import {
  create,
  getById,
  list,
  update,
} from "./plan.controller.js";

const router = Router();

const admin = [
  authenticate,
  requireAccountType("ADMIN"),
  requireBusinessRole("BUSINESS_ADMIN"),
];

router.post(
  "/:businessId/services/:serviceId/plans",
  ...admin,
  authRoute(create),
);

router.get(
  "/:businessId/services/:serviceId/plans",
  ...admin,
  authRoute(list),
);

router.get(
  "/:businessId/services/:serviceId/plans/:planId",
  ...admin,
  authRoute(getById),
);

router.patch(
  "/:businessId/services/:serviceId/plans/:planId",
  ...admin,
  authRoute(update),
);

export default router;