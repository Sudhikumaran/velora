import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Category from "../models/Category.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { kind } = req.query;
    const filter = { userId: req.userId };
    if (kind === "income" || kind === "expense") filter.kind = kind;
    const list = await Category.find(filter).sort({ nameLower: 1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, kind } = req.body;
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed || !["income", "expense"].includes(kind)) {
      return res.status(400).json({ message: "name and kind (income|expense) required" });
    }
    const nameLower = trimmed.toLowerCase();
    const row = await Category.create({
      userId: req.userId,
      kind,
      name: trimmed,
      nameLower,
    });
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: "Category already exists for this type" });
    }
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const r = await Category.findOneAndDelete({ _id: id, userId: req.userId });
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
