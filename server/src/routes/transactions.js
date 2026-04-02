import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { transactionCreateSchema, transactionUpdateSchema } from "../validation/schemas.js";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import {
  assertAccountOwnership,
  applyTransactionEffect,
  reverseTransactionEffect,
} from "../utils/transactionBalance.js";
import { suggestCategoryFromNote } from "../utils/suggestCategory.js";
import { parseTransactionDate } from "../utils/parseTransactionDate.js";

const router = Router();
router.use(requireAuth);

function activeMatch(extra = {}) {
  return { deletedAt: null, ...extra };
}

router.post("/bulk-archive", async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const idList = ids.filter((id) => mongoose.Types.ObjectId.isValid(String(id)));
    let archived = 0;
    const errors = [];
    for (const id of idList) {
      try {
        const existing = await Transaction.findOne({
          _id: id,
          userId: req.userId,
          deletedAt: null,
        });
        if (!existing) {
          errors.push({ id, reason: "not found or already archived" });
          continue;
        }
        await reverseTransactionEffect(existing);
        existing.deletedAt = new Date();
        await existing.save();
        archived++;
      } catch (err) {
        errors.push({ id, reason: err.message });
      }
    }
    res.json({ archived, errors: errors.slice(0, 50) });
  } catch (e) {
    next(e);
  }
});

router.post("/restore/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const existing = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
      deletedAt: { $ne: null },
    });
    if (!existing) {
      return res.status(404).json({ message: "Not found or not archived" });
    }
    try {
      await applyTransactionEffect(existing);
      existing.deletedAt = null;
      await existing.save();
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
    const populated = await Transaction.findById(existing._id)
      .populate("accountId")
      .populate("toAccountId");
    res.json(populated);
  } catch (e) {
    next(e);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const userOid = new mongoose.Types.ObjectId(req.userId);

    const [monthAgg, todayExpense, accounts] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: userOid,
            deletedAt: null,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: userOid,
            deletedAt: null,
            type: "expense",
            date: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Account.find({ userId: req.userId }),
    ]);

    const byType = Object.fromEntries(
      (monthAgg || []).map((x) => [x._id, x.total])
    );
    const monthlyIncome = byType.income || 0;
    const monthlyExpense = byType.expense || 0;
    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    const savingsRate =
      monthlyIncome > 0
        ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 1000) / 10
        : 0;
    const todaySpending = todayExpense[0]?.total || 0;

    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      savingsRate,
      todaySpending,
      monthSpending: monthlyExpense,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const {
      type,
      category,
      accountId,
      from,
      to,
      q,
      sort = "date_desc",
      page: pageRaw,
      pageSize: pageSizeRaw,
      includeArchived,
      limit: limitLegacy,
    } = req.query;
    const filter = { userId: req.userId };
    if (includeArchived !== "true") {
      filter.deletedAt = null;
    }
    const and = [];
    if (type) filter.type = type;
    if (category) and.push({ category: new RegExp(category, "i") });
    if (from || to) {
      const dr = {};
      if (from) dr.$gte = new Date(from);
      if (to) dr.$lte = new Date(to);
      and.push({ date: dr });
    }
    if (accountId) {
      and.push({
        $or: [{ accountId }, { toAccountId: accountId }],
      });
    }
    if (q) {
      and.push({
        $or: [
          { note: new RegExp(q, "i") },
          { category: new RegExp(q, "i") },
        ],
      });
    }
    if (and.length) filter.$and = and;
    let sortObj = { date: -1 };
    if (sort === "date_asc") sortObj = { date: 1 };
    if (sort === "amount_desc") sortObj = { amount: -1 };
    if (sort === "amount_asc") sortObj = { amount: 1 };

    const usePagination = pageRaw != null || pageSizeRaw != null;
    if (usePagination) {
      const page = Math.max(1, parseInt(pageRaw, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeRaw, 10) || 50));
      const skip = (page - 1) * pageSize;
      const [items, total] = await Promise.all([
        Transaction.find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(pageSize)
          .populate("accountId")
          .populate("toAccountId"),
        Transaction.countDocuments(filter),
      ]);
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      return res.json({ items, total, page, pageSize, totalPages });
    }

    const lim = Math.min(500, Math.max(1, parseInt(limitLegacy, 10) || 100));
    const [list, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sortObj)
        .limit(lim)
        .populate("accountId")
        .populate("toAccountId"),
      Transaction.countDocuments(filter),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / lim));
    res.json({ items: list, total, page: 1, pageSize: lim, totalPages });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const q = {
      _id: req.params.id,
      userId: req.userId,
    };
    if (!includeArchived) q.deletedAt = null;
    const tx = await Transaction.findOne(q).populate("accountId").populate("toAccountId");
    if (!tx) return res.status(404).json({ message: "Not found" });
    res.json(tx);
  } catch (e) {
    next(e);
  }
});

router.post("/", validateBody(transactionCreateSchema), async (req, res, next) => {
  try {
    const {
      type,
      amount,
      category,
      accountId,
      toAccountId,
      date,
      note,
      autoSuggestCategory,
      tags,
      taxYear,
      attachments,
    } = req.validBody;
    if (!["expense", "income", "transfer"].includes(type)) {
      return res.status(400).json({ message: "invalid type" });
    }
    const amt = Number(amount);
    if (amt <= 0 || Number.isNaN(amt)) {
      return res.status(400).json({ message: "invalid amount" });
    }
    await assertAccountOwnership(req.userId, accountId);
    if (type === "transfer") {
      if (!toAccountId) {
        return res.status(400).json({ message: "toAccountId required for transfer" });
      }
      await assertAccountOwnership(req.userId, toAccountId);
      if (String(accountId) === String(toAccountId)) {
        return res.status(400).json({ message: "accounts must differ" });
      }
    }
    let cat = category || "uncategorized";
    if (autoSuggestCategory && type !== "transfer") {
      const sug = suggestCategoryFromNote(note || "");
      if (sug) cat = sug;
    }
    const doc = await Transaction.create({
      userId: req.userId,
      type,
      amount: amt,
      category: cat,
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      date: parseTransactionDate(date),
      note: note || "",
      tags: Array.isArray(tags) ? tags.slice(0, 30) : [],
      taxYear: taxYear != null ? taxYear : undefined,
      attachments: Array.isArray(attachments) ? attachments.slice(0, 10) : [],
    });
    try {
      await applyTransactionEffect(doc);
    } catch (err) {
      await Transaction.findByIdAndDelete(doc._id);
      throw err;
    }
    const populated = await Transaction.findById(doc._id)
      .populate("accountId")
      .populate("toAccountId");
    res.status(201).json(populated);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", validateBody(transactionUpdateSchema), async (req, res, next) => {
  try {
    const existing = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
      ...activeMatch(),
    });
    if (!existing) {
      return res.status(404).json({ message: "Not found" });
    }
    const snapshot = {
      type: existing.type,
      amount: existing.amount,
      accountId: existing.accountId,
      toAccountId: existing.toAccountId,
    };
    const b = req.validBody;
    const {
      type,
      amount,
      category,
      accountId,
      toAccountId,
      date,
      note,
      autoSuggestCategory,
      tags,
      taxYear,
      attachments,
    } = b;

    await reverseTransactionEffect(existing);
    let newType = type ?? existing.type;
    let newAmount = amount != null ? Number(amount) : existing.amount;
    let newAccountId = accountId ?? existing.accountId;
    let newTo = toAccountId ?? existing.toAccountId;
    if (!["expense", "income", "transfer"].includes(newType)) {
      await applyTransactionEffect(snapshot);
      return res.status(400).json({ message: "invalid type" });
    }
    if (newAmount <= 0 || Number.isNaN(newAmount)) {
      await applyTransactionEffect(snapshot);
      return res.status(400).json({ message: "invalid amount" });
    }
    try {
      await assertAccountOwnership(req.userId, newAccountId);
      if (newType === "transfer") {
        if (!newTo) {
          await applyTransactionEffect(snapshot);
          return res.status(400).json({ message: "toAccountId required" });
        }
        await assertAccountOwnership(req.userId, newTo);
        if (String(newAccountId) === String(newTo)) {
          await applyTransactionEffect(snapshot);
          return res.status(400).json({ message: "accounts must differ" });
        }
      }
    } catch (e) {
      await applyTransactionEffect(snapshot);
      throw e;
    }
    let cat = category !== undefined ? category : existing.category;
    if (autoSuggestCategory && newType !== "transfer") {
      const n = note !== undefined ? note : existing.note;
      const sug = suggestCategoryFromNote(n ?? "");
      if (sug) cat = sug;
    }
    existing.type = newType;
    existing.amount = newAmount;
    existing.category = cat;
    existing.accountId = newAccountId;
    existing.toAccountId = newType === "transfer" ? newTo : undefined;
    if (date !== undefined) existing.date = parseTransactionDate(date);
    if (note !== undefined) existing.note = note;
    if (tags !== undefined) existing.tags = Array.isArray(tags) ? tags.slice(0, 30) : [];
    if (taxYear !== undefined) existing.taxYear = taxYear;
    if (attachments !== undefined) {
      existing.attachments = Array.isArray(attachments) ? attachments.slice(0, 10) : [];
    }
    try {
      await existing.save();
      await applyTransactionEffect(existing);
    } catch (e) {
      await applyTransactionEffect(snapshot);
      throw e;
    }
    const populated = await Transaction.findById(existing._id)
      .populate("accountId")
      .populate("toAccountId");
    res.json(populated);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
      ...activeMatch(),
    });
    if (!existing) {
      return res.status(404).json({ message: "Not found" });
    }
    await reverseTransactionEffect(existing);
    existing.deletedAt = new Date();
    await existing.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
