import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireBusinessRole } from "../../middleware/authorization.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { create, list, revoke } from "./api-key.controller.js";

const router = Router();

const admin = [
  authenticate,
  requireBusinessRole("BUSINESS_ADMIN"),
];

router.post(
  "/:businessId/api-keys",
  ...admin,
  authRoute(create)
);

router.get(
  "/:businessId/api-keys",
  ...admin,
  authRoute(list)
);

router.delete(
  "/:businessId/api-keys/:apiKeyId",
  ...admin,
  authRoute(revoke)
);

export default router;