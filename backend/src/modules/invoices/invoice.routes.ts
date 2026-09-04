import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { getById, list } from "./invoice.controller.js";

const router = Router();

router.get(
  "/:businessId/invoices",
  authenticate,
  authRoute(list)
);

router.get(
  "/:businessId/invoices/:invoiceId",
  authenticate,
  authRoute(getById)
);

export default router;