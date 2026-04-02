import { logger } from "../middleware/logger.js";
import { isMailConfigured } from "./mail.js";

const WEAK = new Set(["change-me", "change-me-to-a-long-random-string", "dev-only-change-in-production"]);

export function assertProductionConfig() {
  if (process.env.NODE_ENV !== "production") return;

  if (!process.env.MONGODB_URI) {
    logger.fatal("MONGODB_URI is required in production");
    process.exit(1);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || WEAK.has(secret.trim().toLowerCase())) {
    logger.fatal("JWT_SECRET must be set to a random string of at least 32 characters in production");
    process.exit(1);
  }

  if (!process.env.CLIENT_URL?.trim()) {
    logger.fatal("CLIENT_URL is required in production (use comma-separated origins if needed)");
    process.exit(1);
  }

  if (!isMailConfigured()) {
    logger.warn(
      "SMTP_* / MAIL_FROM not fully configured — password reset emails will not be sent until you set them"
    );
  }
}
