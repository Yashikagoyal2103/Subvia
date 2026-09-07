import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import businessRoutes from "./modules/businesses/business.routes.js";
import customerRoutes from "./modules/customers/customer.routes.js";
import serviceRoutes from "./modules/services/service.routes.js";
import planRoutes from "./modules/plans/plan.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";
import invoiceRoutes from "./modules/invoices/invoice.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import recurringBillingRoutes from "./modules/billing/recurring/recurring-billing.routes.js";
import creditRoutes from "./modules/credits/credit.routes.js";

const app = express();

app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      message: "API is running",
    },
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/businesses", businessRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/businesses", serviceRoutes);
app.use("/api/v1/businesses", planRoutes);
app.use("/api/v1/businesses", subscriptionRoutes);
app.use("/api/v1/businesses", invoiceRoutes);
app.use("/api/v1/businesses", paymentRoutes);
app.use("/api/v1/internal/billing", recurringBillingRoutes);
app.use("/api/v1/businesses", creditRoutes);

app.use(errorHandler);

export default app;