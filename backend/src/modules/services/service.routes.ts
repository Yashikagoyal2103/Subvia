import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireBusinessRole } from  "../../middleware/authorization.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { create, getById, list, update } from "./service.controller.js";

const router = Router();

router.post("/:businessId/services", authenticate, requireBusinessRole("BUSINESS_ADMIN"), authRoute(create) );
router.get("/:businessId/services", authenticate, authRoute(list) );
router.get("/:businessId/services/:serviceId", authenticate, authRoute(getById) );
router.patch("/:businessId/services/:serviceId", authenticate, requireBusinessRole("BUSINESS_ADMIN"), authRoute(update));

export default router;