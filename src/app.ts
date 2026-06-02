import { env } from "@/config/env.js";
import reportRoutes from "@/modules/report/report.route.js";
import compression from "compression";
import cors from "cors";
import express, { Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import { successResponse } from "./shared/utils/response.js";

const app: Express = express();

app.set("trust proxy", 1);

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── General rate limit ───────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      message: "Too many requests, please try again later.",
    },
  }),
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(compression());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json(
    successResponse(
      { status: "ok", timestamp: new Date().toISOString(), env: env.NODE_ENV },
      "Endpoint de health is working",
    ),
  );
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/reports", reportRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ statusCode: 404, message: "Endpoint not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
