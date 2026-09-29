import express from "express";
import cors from "cors";
import helmet from "helmet";
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
import adminRoutes from "./modules/admin/admin.routes.js";
import webhookRoutes from "./modules/webhooks/webhook.routes.js";
import apiKeyRoutes from "./modules/api-keys/api-key.routes.js";
import publicApiRoutes from "./modules/public-api/public-api.routes.js";
import catalogRoutes from "./modules/catalog/catalog.routes.js";
import customerPortalRoutes from "./modules/customer-portal/customer-portal.routes.js";
import { prisma } from "./config/prisma.js";
import { env } from "./config/env.js";
import { apiRateLimiter } from "./middleware/rate-limit.middleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "100kb",
  })
);

app.get("/api/v1/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      data: {
        message: "API is running",
        database: "connected",
      },
    });
  } catch {
    return res.status(503).json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database is unavailable.",
      },
    });
  }
});

app.use(apiRateLimiter);

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
app.use("/api/v1/businesses", adminRoutes);
app.use("/api/v1/businesses", webhookRoutes);
app.use("/api/v1/businesses", apiKeyRoutes);
app.use("/api/v1/public", publicApiRoutes);
app.use("/api/v1/catalog", catalogRoutes);
app.use("/api/v1",customerPortalRoutes);

app.use(errorHandler);

export default app;
