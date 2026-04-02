import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Budget from "../models/Budget.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const filter = { userId: req.userId };
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    const list = await Budget.find(filter).sort({ category: 1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { category, limit, month, year } = req.body;
    if (!category || limit == null || !month || !year) {
      return res.status(400).json({ message: "category, limit, month, year required" });
    }
    const cat = category.trim();
    const m = Number(month);
    const y = Number(year);
    const lim = Number(limit);
    const b = await Budget.findOneAndUpdate(
      { userId: req.userId, category: cat, month: m, year: y },
      { $set: { limit: lim }, $setOnInsert: { userId: req.userId, category: cat, month: m, year: y } },
      { upsert: true, new: true }
    );
    res.status(201).json(b);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: "budget exists for category/month" });
    }
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const { category, limit, month, year } = req.body;
    const b = await Budget.findOne({ _id: id, userId: req.userId });
    if (!b) return res.status(404).json({ message: "Not found" });
    if (category !== undefined) b.category = category;
    if (limit !== undefined) b.limit = Number(limit);
    if (month !== undefined) b.month = Number(month);
    if (year !== undefined) b.year = Number(year);
    await b.save();
    res.json(b);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const b = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!b) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
