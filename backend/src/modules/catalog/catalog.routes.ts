import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireAccountType } from "../../middleware/account-type.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { list } from "./catalog.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireAccountType("CUSTOMER"),
  authRoute(list),
);

export default router;