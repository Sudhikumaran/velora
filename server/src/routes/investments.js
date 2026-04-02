import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Investment from "../models/Investment.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { type, q } = req.query;
    const filter = { userId: req.userId };
    if (type) filter.type = type;
    if (q) filter.name = new RegExp(q, "i");
    const list = await Investment.find(filter).sort({ updatedAt: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, type, investedAmount, currentValue } = req.body;
    if (!name || investedAmount == null || currentValue == null) {
      return res.status(400).json({ message: "name, investedAmount, currentValue required" });
    }
    const inv = await Investment.create({
      userId: req.userId,
      name,
      type: type || "other",
      investedAmount: Number(investedAmount),
      currentValue: Number(currentValue),
    });
    res.status(201).json(inv);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const inv = await Investment.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!inv) return res.status(404).json({ message: "Not found" });
    const { name, type, investedAmount, currentValue } = req.body;
    if (name !== undefined) inv.name = name;
    if (type !== undefined) inv.type = type;
    if (investedAmount !== undefined) inv.investedAmount = Number(investedAmount);
    if (currentValue !== undefined) inv.currentValue = Number(currentValue);
    await inv.save();
    res.json(inv);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const inv = await Investment.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!inv) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
