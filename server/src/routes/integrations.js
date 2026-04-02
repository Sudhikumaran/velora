import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/bank/plaid-link", (_req, res) => {
  res.status(501).json({
    message: "Plaid/Salt Edge not wired. Add API keys and link flow.",
  });
});

router.post("/receipt/ocr", requireAuth, (_req, res) => {
  res.status(501).json({
    message: "Receipt OCR requires Tesseract or cloud vision integration.",
  });
});

router.post("/workspace/invite", requireAuth, (_req, res) => {
  res.status(501).json({
    message: "Shared workspaces require org model and roles.",
  });
});

router.post("/billing/checkout", requireAuth, (_req, res) => {
  res.status(501).json({
    message: "Stripe checkout not configured. Set STRIPE_SECRET_KEY.",
  });
});

router.post("/auth/2fa/enable", requireAuth, (_req, res) => {
  res.status(501).json({
    message: "TOTP 2FA not enabled yet. Add speakeasy + backup codes.",
  });
});

export default router;
