import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Account from "../models/Account.js";

const router = Router();
router.use(requireAuth);

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

router.get("/overview", async (req, res, next) => {
  try {
    const { range = "month" } = req.query;
    const userOid = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    let from;
    if (range === "week") from = daysAgo(7);
    else if (range === "year")
      from = new Date(now.getFullYear(), 0, 1);
    else from = new Date(now.getFullYear(), now.getMonth(), 1);

    const [byCategory, daily, topExpenses, prevPeriodExpense, investmentsNet] =
      await Promise.all([
        Transaction.aggregate([
          {
            $match: {
              userId: userOid,
              deletedAt: null,
              type: "expense",
              date: { $gte: from, $lte: now },
            },
          },
          { $group: { _id: "$category", total: { $sum: "$amount" } } },
          { $sort: { total: -1 } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              userId: userOid,
              deletedAt: null,
              type: "expense",
              date: { $gte: from, $lte: now },
            },
          },
          {
            $group: {
              _id: {
                y: { $year: "$date" },
                m: { $month: "$date" },
                d: { $dayOfMonth: "$date" },
              },
              total: { $sum: "$amount" },
            },
          },
          { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              userId: userOid,
              deletedAt: null,
              type: "expense",
              date: { $gte: from, $lte: now },
            },
          },
          { $sort: { amount: -1 } },
          { $limit: 10 },
        ]),
        (async () => {
          let prevStart;
          let prevEnd = new Date(from.getTime() - 1);
          if (range === "week") {
            prevStart = daysAgo(14);
            prevEnd = daysAgo(7);
          } else if (range === "year") {
            prevStart = new Date(now.getFullYear() - 1, 0, 1);
            prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          } else {
            prevStart = new Date(from.getFullYear(), from.getMonth() - 1, 1);
            prevEnd = new Date(from.getFullYear(), from.getMonth(), 0, 23, 59, 59);
          }
          const agg = await Transaction.aggregate([
            {
              $match: {
                userId: userOid,
                deletedAt: null,
                type: "expense",
                date: { $gte: prevStart, $lte: prevEnd },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]);
          return agg[0]?.total || 0;
        })(),
        Account.find({ userId: req.userId }).then((accs) =>
          accs.reduce((s, a) => s + (a.balance || 0), 0)
        ),
      ]);

    const monthStart6 = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyFlowAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userOid,
          deletedAt: null,
          date: { $gte: monthStart6, $lte: now },
        },
      },
      {
        $group: {
          _id: { y: { $year: "$date" }, m: { $month: "$date" } },
          income: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          expense: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]);
    let cumulative = 0;
    const netFlowTrend = monthlyFlowAgg.map((a) => {
      cumulative += a.income - a.expense;
      const label = new Date(a._id.y, a._id.m - 1, 1).toLocaleString("default", {
        month: "short",
      });
      return { label, value: Math.round(cumulative * 100) / 100 };
    });

    const totalExpense = byCategory.reduce((s, c) => s + c.total, 0);
    const incomeMatch = await Transaction.aggregate([
      {
        $match: {
          userId: userOid,
          deletedAt: null,
          type: "income",
          date: { $gte: from, $lte: now },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalIncome = incomeMatch[0]?.total || 0;
    const savingsPct =
      totalIncome > 0
        ? Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10
        : 0;

    const insights = [];
    if (byCategory.length) {
      const top = byCategory[0];
      const pct = totalExpense
        ? Math.round((top.total / totalExpense) * 100)
        : 0;
      insights.push({
        type: "top_category",
        text: `Your biggest expense is ${top._id} (${pct}%).`,
      });
    }
    if (totalIncome > 0) {
      insights.push({
        type: "savings",
        text: `You saved ${savingsPct}% this period.`,
      });
    }
    const prev = prevPeriodExpense;
    if (prev > 0 && totalExpense > 0) {
      const delta = Math.round(((totalExpense - prev) / prev) * 100);
      if (Math.abs(delta) >= 5) {
        insights.push({
          type: "trend",
          text:
            delta > 0
              ? `You spent ${delta}% more than the previous period.`
              : `You spent ${Math.abs(delta)}% less than the previous period.`,
        });
      }
    }

    const weekStart = daysAgo(7);
    const weekPrevStart = daysAgo(14);
    const [foodWeek, foodPrevWeek] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: userOid,
            deletedAt: null,
            type: "expense",
            category: /food/i,
            date: { $gte: weekStart, $lte: now },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: userOid,
            deletedAt: null,
            type: "expense",
            category: /food/i,
            date: { $gte: weekPrevStart, $lt: weekStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);
    const fw = foodWeek[0]?.total || 0;
    const fpw = foodPrevWeek[0]?.total || 0;
    if (fpw > 0 && fw > 0) {
      const fd = Math.round(((fw - fpw) / fpw) * 100);
      if (fd >= 20) {
        insights.push({
          type: "food_spike",
          text: `You spent ${fd}% more on food this week.`,
        });
      }
    }

    res.json({
      byCategory,
      dailyTrend: daily.map((d) => ({
        date: new Date(d._id.y, d._id.m - 1, d._id.d).toISOString(),
        total: d.total,
      })),
      netFlowTrend,
      topExpenses,
      totals: {
        income: totalIncome,
        expense: totalExpense,
        savingsPercent: savingsPct,
        netWorthEstimate: investmentsNet,
      },
      insights,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/budget-status", async (req, res, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const userOid = new mongoose.Types.ObjectId(req.userId);
    const budgets = await Budget.find({ userId: req.userId, month, year });
    const spent = await Transaction.aggregate([
      {
        $match: {
          userId: userOid,
          deletedAt: null,
          type: "expense",
          date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59),
          },
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);
    const map = Object.fromEntries(spent.map((s) => [s._id, s.total]));
    const rows = budgets.map((b) => {
      const used = map[b.category] || 0;
      const pct = b.limit > 0 ? Math.min(100, (used / b.limit) * 100) : 0;
      return {
        category: b.category,
        limit: b.limit,
        spent: used,
        percent: Math.round(pct * 10) / 10,
        nearing: pct >= 80 && pct < 100,
        exceeded: pct >= 100,
        budgetId: b._id,
      };
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
