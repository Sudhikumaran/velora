import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { clerkMiddleware } from "@clerk/express";
import { httpLogger, logger } from "./middleware/logger.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { assertProductionConfig } from "./lib/assertConfig.js";
import accountRoutes from "./routes/accounts.js";
import transactionRoutes from "./routes/transactions.js";
import debtRoutes from "./routes/debts.js";
import budgetRoutes from "./routes/budgets.js";
import investmentRoutes from "./routes/investments.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import recurringRoutes from "./routes/recurring.js";
import analyticsRoutes from "./routes/analytics.js";
import userRoutes from "./routes/user.js";
import categoryRoutes from "./routes/categories.js";
import goalsRoutes from "./routes/goals.js";
import importRoutes from "./routes/import.js";
import integrationsRoutes from "./routes/integrations.js";

dotenv.config();
assertProductionConfig();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

// express-rate-limit v8+ throws (→ 500 on /api) if X-Forwarded-For is set but trust proxy is off.
// Railway, Render, Fly, and Heroku sit behind a proxy that sends that header.
const trustProxyExplicitOff =
  process.env.TRUST_PROXY === "0" || process.env.TRUST_PROXY === "false";
const trustProxyExplicitOn =
  process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true";
const trustProxyLikelyPaaS = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RENDER ||
    process.env.FLY_APP_NAME ||
    process.env.DYNO
);
if (!trustProxyExplicitOff && (trustProxyExplicitOn || trustProxyLikelyPaaS)) {
  app.set("trust proxy", 1);
}

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const vercelPreviewCors =
  process.env.CORS_ALLOW_VERCEL_PREVIEWS === "1" ||
  process.env.CORS_ALLOW_VERCEL_PREVIEWS === "true";

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (vercelPreviewCors) {
    try {
      const u = new URL(origin);
      if (u.protocol === "https:" && u.hostname.endsWith(".vercel.app")) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

app.use(helmet());
app.use(httpLogger);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      callback(null, isAllowedCorsOrigin(origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(clerkMiddleware());

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    name: "Velaro API",
    health: "/api/health",
  });
});

app.use("/api", apiLimiter);

app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/import", importRoutes);
app.use("/api/integrations", integrationsRoutes);

app.get("/api/health", (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    ok: dbUp,
    db: dbUp ? "up" : "down",
  });
});

app.use((err, _req, res, _next) => {
  logger.error({ err }, err.message);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/velaro")
  .then(() => {
    app.listen(PORT, HOST, () => {
      logger.info(`Velaro API on http://${HOST}:${PORT}`);
    });
  })
  .catch((e) => {
    logger.error(e, "MongoDB connection failed");
    process.exit(1);
  });
