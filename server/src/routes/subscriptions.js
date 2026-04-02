import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Subscription from "../models/Subscription.js";
import { parseTransactionDate } from "../utils/parseTransactionDate.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = { userId: req.userId };
    if (q) filter.name = new RegExp(q, "i");
    const list = await Subscription.find(filter).sort({ nextRenewalDate: 1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, amount, billingCycle, nextRenewalDate } = req.body;
    if (!name || amount == null || !nextRenewalDate) {
      return res.status(400).json({ message: "name, amount, nextRenewalDate required" });
    }
    const s = await Subscription.create({
      userId: req.userId,
      name,
      amount: Number(amount),
      billingCycle: billingCycle || "monthly",
      nextRenewalDate: parseTransactionDate(nextRenewalDate),
    });
    res.status(201).json(s);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const s = await Subscription.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!s) return res.status(404).json({ message: "Not found" });
    const { name, amount, billingCycle, nextRenewalDate } = req.body;
    if (name !== undefined) s.name = name;
    if (amount !== undefined) s.amount = Number(amount);
    if (billingCycle !== undefined) s.billingCycle = billingCycle;
    if (nextRenewalDate !== undefined) {
      s.nextRenewalDate = parseTransactionDate(nextRenewalDate);
    }
    await s.save();
    res.json(s);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const s = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!s) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
