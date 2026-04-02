import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validateBody } from "../middleware/validate.js";
import { logger } from "../middleware/logger.js";
import { isMailConfigured, sendPasswordResetEmail } from "../lib/mail.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validation/schemas.js";

const router = Router();

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });
}

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, currency } = req.validBody;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hash,
      currency: currency || "INR",
    });
    const token = signToken(user._id.toString());
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validBody;
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user?.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signToken(user._id.toString());
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/forgot-password", validateBody(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.validBody;
    const user = await User.findOne({ email: email.toLowerCase() });
    const dev = process.env.NODE_ENV !== "production";

    if (user) {
      const raw = crypto.randomBytes(32).toString("hex");
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      user.passwordResetToken = hash;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const clientBase = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
      const link = `${clientBase}/reset-password?token=${encodeURIComponent(raw)}`;

      if (dev) {
        console.log(`[Velaro] Password reset link for ${email}: ${link}`);
      } else if (isMailConfigured()) {
        try {
          await sendPasswordResetEmail(user.email, link);
        } catch {
          logger.error("Password reset email could not be sent; user should use forgot-password again or contact support");
        }
      } else {
        logger.error("SMTP not configured — password reset link was not emailed");
      }
    }

    res.json({
      message: dev
        ? "If an account exists for that email, use the reset link from the server console log."
        : "If an account exists for that email, you will receive password reset instructions shortly.",
    });
  } catch (e) {
    next(e);
  }
});

router.post("/reset-password", validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.validBody;
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hash,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ message: "Password updated. You can sign in." });
  } catch (e) {
    next(e);
  }
});

router.post("/google-placeholder", (_req, res) => {
  res.status(501).json({
    message: "Google OAuth not configured. Wire GOOGLE_CLIENT_ID and callback.",
  });
});

export default router;
