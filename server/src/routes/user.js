import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Debt from "../models/Debt.js";
import Subscription from "../models/Subscription.js";
import Investment from "../models/Investment.js";
import RecurringTransaction from "../models/RecurringTransaction.js";
import Category from "../models/Category.js";
import Goal from "../models/Goal.js";

const router = Router();
router.use(requireAuth);

router.patch("/me", async (req, res, next) => {
  try {
    const { currency, name } = req.body;
    const u = await User.findById(req.userId);
    if (!u) return res.status(404).json({ message: "Not found" });
    if (currency) u.currency = currency;
    if (name) u.name = name;
    await u.save();
    res.json({
      id: u._id,
      name: u.name,
      email: u.email,
      currency: u.currency,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/export", async (req, res, next) => {
  try {
    const uid = req.userId;
    const [
      user,
      accounts,
      transactions,
      budgets,
      debts,
      subscriptions,
      investments,
      recurring,
      categories,
      goals,
    ] = await Promise.all([
      User.findById(uid).select("-password -passwordResetToken"),
      Account.find({ userId: uid }),
      Transaction.find({ userId: uid }).sort({ date: -1 }),
      Budget.find({ userId: uid }),
      Debt.find({ userId: uid }),
      Subscription.find({ userId: uid }),
      Investment.find({ userId: uid }),
      RecurringTransaction.find({ userId: uid }),
      Category.find({ userId: uid }),
      Goal.find({ userId: uid }),
    ]);
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json({
      exportedAt: new Date().toISOString(),
      user,
      accounts,
      transactions,
      budgets,
      debts,
      subscriptions,
      investments,
      recurring,
      categories,
      goals,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
