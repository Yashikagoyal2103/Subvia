import { Router } from "express";
import { authRoute } from "../../../shared/utils/route-wrapper.js";
import { run } from "./recurring-billing.controller.js";

const router = Router();

router.post(
  "/run",
  authRoute(run)
);

export default router;