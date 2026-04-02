import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Debt from "../models/Debt.js";
import { parseTransactionDate } from "../utils/parseTransactionDate.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { status, type, q } = req.query;
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (q) filter.personName = new RegExp(q, "i");
    const list = await Debt.find(filter).sort({ date: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { personName, amount, type, status, date, reminderAt } = req.body;
    if (!personName || amount == null || !type) {
      return res.status(400).json({ message: "personName, amount, type required" });
    }
    if (!["you_gave", "you_owe"].includes(type)) {
      return res.status(400).json({ message: "invalid type" });
    }
    const amt = Number(amount);
    const d = await Debt.create({
      userId: req.userId,
      personName,
      amount: amt,
      originalAmount: amt,
      type,
      status: status || "pending",
      date: date ? parseTransactionDate(date) : new Date(),
      reminderAt: reminderAt ? parseTransactionDate(reminderAt) : undefined,
      paymentHistory: [],
    });
    res.status(201).json(d);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const body = req.body;
    const d = await Debt.findOne({ _id: id, userId: req.userId });
    if (!d) return res.status(404).json({ message: "Not found" });
    if (body.personName !== undefined) d.personName = body.personName;
    if (body.amount !== undefined) d.amount = Number(body.amount);
    if (body.type !== undefined) d.type = body.type;
    if (body.status !== undefined) d.status = body.status;
    if (body.date !== undefined) d.date = parseTransactionDate(body.date);
    if (body.reminderAt !== undefined) {
      d.reminderAt = body.reminderAt ? parseTransactionDate(body.reminderAt) : undefined;
    }
    await d.save();
    res.json(d);
  } catch (e) {
    next(e);
  }
});

router.post("/:id/pay", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const { amount, note } = req.body;
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ message: "valid amount required" });
    }
    const d = await Debt.findOne({ _id: id, userId: req.userId });
    if (!d) return res.status(404).json({ message: "Not found" });
    if (d.status === "paid") {
      return res.status(400).json({ message: "already paid" });
    }
    const remaining = Math.max(0, d.amount - payAmt);
    d.paymentHistory.push({ amount: payAmt, date: new Date(), note: note || "" });
    d.amount = remaining;
    if (remaining <= 0) {
      d.amount = 0;
      d.status = "paid";
    }
    await d.save();
    res.json(d);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const d = await Debt.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!d) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
