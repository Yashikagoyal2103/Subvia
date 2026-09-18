import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireBusinessRole } from "../../middleware/auhtorization.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import {
  create,
  getById,
  update,
  getMine,
} from "./business.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authRoute(create)
);

router.get(
  "/my",
  authenticate,
  authRoute(getMine)
);

router.get(
  "/:id",
  authenticate,
  authRoute(getById)
);

router.patch(
  "/:id",
  authenticate,
  requireBusinessRole("BUSINESS_ADMIN"),
  authRoute(update)
);

export default router;