import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { httpLogger, logger } from "./middleware/logger.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimit.js";
import { assertProductionConfig } from "./lib/assertConfig.js";
import authRoutes from "./routes/auth.js";
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
const PORT = process.env.PORT || 5000;

if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(httpLogger);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authLimiter, authRoutes);
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
    app.listen(PORT, () => {
      logger.info(`Velaro API on ${PORT}`);
    });
  })
  .catch((e) => {
    logger.error(e, "MongoDB connection failed");
    process.exit(1);
  });
