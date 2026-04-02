import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Account from "../models/Account.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const list = await Account.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, type, balance } = req.body;
    if (!name || !type) {
      return res.status(400).json({ message: "name and type required" });
    }
    if (!["cash", "bank", "credit"].includes(type)) {
      return res.status(400).json({ message: "invalid type" });
    }
    const acc = await Account.create({
      userId: req.userId,
      name,
      type,
      balance: Number(balance) || 0,
    });
    res.status(201).json(acc);
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
    const { name, type, balance } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (type !== undefined) {
      if (!["cash", "bank", "credit"].includes(type)) {
        return res.status(400).json({ message: "invalid type" });
      }
      update.type = type;
    }
    if (balance !== undefined) update.balance = Number(balance);
    const acc = await Account.findOneAndUpdate(
      { _id: id, userId: req.userId },
      update,
      { new: true }
    );
    if (!acc) return res.status(404).json({ message: "Not found" });
    res.json(acc);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const acc = await Account.findOneAndDelete({ _id: id, userId: req.userId });
    if (!acc) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
