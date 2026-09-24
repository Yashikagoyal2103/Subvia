import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireBusinessRole } from "../../middleware/authorization.middleware.js";
import { authRoute } from "../../shared/utils/route-wrapper.js";
import { listCustomers, getCustomer, listSubscriptions, getSubscription, listInvoices, getInvoice, listPayments, getPayment, listBillingActivity } from "./admin.controller.js";

const router = Router();

const admin = [authenticate, requireBusinessRole("BUSINESS_ADMIN")];

router.get("/:businessId/admin/customers", ...admin, authRoute(listCustomers));
router.get("/:businessId/admin/customers/:customerId", ...admin, authRoute(getCustomer));

router.get("/:businessId/admin/subscriptions", ...admin, authRoute(listSubscriptions));
router.get("/:businessId/admin/subscriptions/:subscriptionId", ...admin, authRoute(getSubscription));

router.get("/:businessId/admin/invoices", ...admin, authRoute(listInvoices));
router.get("/:businessId/admin/invoices/:invoiceId", ...admin, authRoute(getInvoice));

router.get("/:businessId/admin/payments", ...admin, authRoute(listPayments));
router.get("/:businessId/admin/payments/:paymentId", ...admin, authRoute(getPayment));

router.get("/:businessId/admin/billing-activity", ...admin, authRoute(listBillingActivity));

export default router;