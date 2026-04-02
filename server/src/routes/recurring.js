import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import RecurringTransaction from "../models/RecurringTransaction.js";
import Transaction from "../models/Transaction.js";
import { assertAccountOwnership, applyTransactionEffect } from "../utils/transactionBalance.js";

function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function addWeeks(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n * 7);
  return x;
}

function addYears(d, n) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + n);
  return x;
}

function nextDueFrom(freq, fromDate, dayOfMonth) {
  const base = new Date(fromDate);
  if (freq === "weekly") return addWeeks(base, 1);
  if (freq === "yearly") return addYears(base, 1);
  const dom = dayOfMonth || base.getDate();
  const next = new Date(base.getFullYear(), base.getMonth() + 1, Math.min(dom, 28));
  return next;
}

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const list = await RecurringTransaction.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      transactionType,
      amount,
      category,
      accountId,
      frequency,
      dayOfMonth,
      note,
      active,
    } = req.body;
    if (!transactionType || amount == null || !accountId) {
      return res.status(400).json({ message: "transactionType, amount, accountId required" });
    }
    await assertAccountOwnership(req.userId, accountId);
    const start = new Date();
    const nextDue = nextDueFrom(frequency || "monthly", start, dayOfMonth);
    const r = await RecurringTransaction.create({
      userId: req.userId,
      transactionType,
      amount: Number(amount),
      category: category || "uncategorized",
      accountId,
      frequency: frequency || "monthly",
      dayOfMonth: dayOfMonth || start.getDate(),
      note: note || "",
      active: active !== false,
      nextDueAt: nextDue,
    });
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const r = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!r) return res.status(404).json({ message: "Not found" });
    const fields = [
      "transactionType",
      "amount",
      "category",
      "accountId",
      "frequency",
      "dayOfMonth",
      "note",
      "active",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === "amount") r.amount = Number(req.body.amount);
        else if (f === "accountId") r.accountId = req.body.accountId;
        else r[f] = req.body[f];
      }
    }
    if (req.body.accountId) {
      await assertAccountOwnership(req.userId, r.accountId);
    }
    await r.save();
    res.json(r);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await RecurringTransaction.deleteOne({
      _id: req.params.id,
      userId: req.userId,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/apply-due", async (req, res, next) => {
  try {
    const now = new Date();
    const due = await RecurringTransaction.find({
      userId: req.userId,
      active: true,
      nextDueAt: { $lte: now },
    });

    const created = [];
    for (const rec of due) {
      await assertAccountOwnership(req.userId, rec.accountId);
      const txType = rec.transactionType === "income" ? "income" : "expense";
      const tx = await Transaction.create({
        userId: req.userId,
        type: txType,
        amount: rec.amount,
        category: rec.category,
        accountId: rec.accountId,
        date: now,
        note: rec.note || `Recurring: ${rec.frequency}`,
        isRecurringInstance: true,
        recurringId: rec._id,
      });
      try {
        await applyTransactionEffect(tx);
      } catch (err) {
        await Transaction.findByIdAndDelete(tx._id);
        throw err;
      }
      rec.lastRunAt = now;
      rec.nextDueAt = nextDueFrom(
        rec.frequency,
        rec.nextDueAt,
        rec.dayOfMonth
      );
      await rec.save();
      created.push(tx);
    }
    res.json({ applied: created.length, transactions: created });
  } catch (e) {
    next(e);
  }
});

export default router;
