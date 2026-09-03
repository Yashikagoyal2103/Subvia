import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {create, getById } from "./business.controller.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";

const router = Router();

router.post("/", authenticate, authRoute(create));
router.get("/:id", authenticate, authRoute(getById));

export default router;