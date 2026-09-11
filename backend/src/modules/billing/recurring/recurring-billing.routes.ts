import { Router } from "express";
import { internalOnly } from "../../../middleware/internal.middleware.js";
import { authRoute } from "../../../shared/utils/route-wrapper.js";
import { run } from "./recurring-billing.controller.js";

const router = Router();

router.post(
  "/run",
  internalOnly,
  authRoute(run)
);

export default router;