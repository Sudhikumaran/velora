import { logger } from "../middleware/logger.js";
import { isMailConfigured } from "./mail.js";

export function assertProductionConfig() {
  if (process.env.NODE_ENV !== "production") return;

  if (!process.env.MONGODB_URI) {
    logger.fatal("MONGODB_URI is required in production");
    process.exit(1);
  }

  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    logger.fatal("CLERK_SECRET_KEY is required in production (Clerk authentication)");
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
