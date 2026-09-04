import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import businessRoutes from "./modules/businesses/business.routes.js";
import customerRoutes from "./modules/customers/customer.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";

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
app.use("/api/v1/businesses", subscriptionRoutes);

app.use(errorHandler);

export default app;