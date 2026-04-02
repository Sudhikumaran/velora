import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Goal from "../models/Goal.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const list = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, targetAmount, savedAmount, deadline, active, color } = req.body;
    if (!name || targetAmount == null) {
      return res.status(400).json({ message: "name, targetAmount required" });
    }
    const g = await Goal.create({
      userId: req.userId,
      name,
      targetAmount: Number(targetAmount),
      savedAmount: savedAmount != null ? Number(savedAmount) : 0,
      deadline: deadline ? new Date(deadline) : undefined,
      active: active !== false,
      color,
    });
    res.status(201).json(g);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const g = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!g) return res.status(404).json({ message: "Not found" });
    const f = req.body;
    if (f.name !== undefined) g.name = f.name;
    if (f.targetAmount !== undefined) g.targetAmount = Number(f.targetAmount);
    if (f.savedAmount !== undefined) g.savedAmount = Number(f.savedAmount);
    if (f.deadline !== undefined) g.deadline = f.deadline ? new Date(f.deadline) : undefined;
    if (f.active !== undefined) g.active = f.active;
    if (f.color !== undefined) g.color = f.color;
    await g.save();
    res.json(g);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const r = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
