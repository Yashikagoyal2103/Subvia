import express from "express";
import { prisma } from "./config/prisma.js";

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


export default app;