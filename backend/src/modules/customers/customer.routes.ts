import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { getByBusiness } from "./customer.controller.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";

const router = Router();

router.get("/:businessId", authenticate, authRoute(getByBusiness));

export default router;