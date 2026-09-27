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
} from "./service.controller.js";

const router = Router();

const admin = [
  authenticate,
  requireAccountType("ADMIN"),
  requireBusinessRole("BUSINESS_ADMIN"),
];

router.post(
  "/:businessId/services",
  ...admin,
  authRoute(create),
);

router.get(
  "/:businessId/services",
  ...admin,
  authRoute(list),
);

router.get(
  "/:businessId/services/:serviceId",
  ...admin,
  authRoute(getById),
);

router.patch(
  "/:businessId/services/:serviceId",
  ...admin,
  authRoute(update),
);

export default router;