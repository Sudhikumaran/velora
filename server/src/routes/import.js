import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Transaction from "../models/Transaction.js";
import { assertAccountOwnership, applyTransactionEffect } from "../utils/transactionBalance.js";
import { parseFlexibleDate } from "../utils/parseFlexibleDate.js";

const router = Router();
router.use(requireAuth);

function parseCsvLine(line, delimiter) {
  const result = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === delimiter && !inQ) {
      result.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
}

router.post("/transactions", async (req, res, next) => {
  try {
    const {
      accountId,
      csvText,
      delimiter = ",",
      columns,
      skipRows = 0,
      defaultType = "expense",
      defaultTags,
    } = req.body;
    if (!accountId || !csvText || typeof csvText !== "string") {
      return res.status(400).json({ message: "accountId and csvText required" });
    }
    await assertAccountOwnership(req.userId, accountId);
    const col = columns || {
      amount: 0,
      date: 1,
      category: 2,
      note: 3,
    };
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length);
    const start = Math.max(0, Number(skipRows) || 0);
    let created = 0;
    const errors = [];
    const tags = Array.isArray(defaultTags) ? defaultTags.slice(0, 30) : [];
    for (let i = start; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i], delimiter);
      if (cells.length < 1) continue;
      try {
        const amount = Number(String(cells[col.amount] || "").replace(/[₹$,\s]/g, ""));
        if (!amount || Number.isNaN(amount)) {
          errors.push({ line: i + 1, reason: "bad amount" });
          continue;
        }
        const dateRaw = cells[col.date] || "";
        const category = (cells[col.category] || "uncategorized").trim() || "uncategorized";
        const note = col.note != null ? (cells[col.note] || "").trim() : "";
        const type =
          ["income", "expense"].includes(defaultType) ? defaultType : "expense";
        const doc = await Transaction.create({
          userId: req.userId,
          type,
          amount,
          category,
          accountId,
          date: parseFlexibleDate(dateRaw),
          note: note || `Import row ${i + 1}`,
          tags,
        });
        try {
          await applyTransactionEffect(doc);
          created++;
        } catch (err) {
          await Transaction.findByIdAndDelete(doc._id);
          errors.push({ line: i + 1, reason: err.message });
        }
      } catch (err) {
        errors.push({ line: i + 1, reason: err.message });
      }
    }
    res.status(201).json({ created, errors: errors.slice(0, 50) });
  } catch (e) {
    next(e);
  }
});

export default router;
