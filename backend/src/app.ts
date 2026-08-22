import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

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

app.use(errorHandler);

export default app;