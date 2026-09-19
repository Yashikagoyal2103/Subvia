import { Router } from "express";
import { authenticateApiKeyMiddleware } from "../../middleware/api-key.middleware.js";
import { catalog } from "./public-api.controller.js";

const router = Router();

router.get(
  "/catalog",
  authenticateApiKeyMiddleware,
  catalog
);

export default router;