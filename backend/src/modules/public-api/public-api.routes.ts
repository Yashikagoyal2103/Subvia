
import { Router } from "express";
import { authenticateApiKeyMiddleware } from "../../middleware/api-key.middleware.js";
import { publicApiRateLimiter } from "../../middleware/rate-limit.middleware.js";
import { catalog } from "./public-api.controller.js";

const router = Router();

router.get(
  "/catalog",
  publicApiRateLimiter,
  authenticateApiKeyMiddleware,
  catalog
);

export default router;
