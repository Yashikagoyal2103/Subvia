import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireBusinessRole } from  "../../middleware/auhtorization.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { create, getById, list, update } from "./plan.controller.js";

const router = Router();

router.post(
    "/:businessId/services/:serviceId/plans", 
    authenticate, 
    requireBusinessRole("BUSINESS_ADMIN"), 
    authRoute(create) 
);

router.get(
    "/:businessId/services/:serviceId/plans", 
    authenticate,
    authRoute(list)
);

router.get(
    "/:businessId/services/:serviceId/plans/:planId", 
    authenticate, 
    authRoute(getById)
);

router.patch(
    "/:businessId/services/:serviceId/plans/:planId", 
    authenticate, 
    requireBusinessRole("BUSINESS_ADMIN"), 
    authRoute(update)
);

export default router;