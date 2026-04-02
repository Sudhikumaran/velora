import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../lib/api.js";
import { formatMoney, formatDateDMY } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";
import toast from "react-hot-toast";

const PIE_COLORS = ["#34d399", "#38bdf8", "#a78bfa", "#fb7185", "#fbbf24", "#94a3b8"];

const STAT_DARK_ACCENT = [
  "border-l-4 border-l-emerald-400",
  "border-l-4 border-l-sky-400",
  "border-l-4 border-l-violet-400",
  "border-l-4 border-l-amber-400",
];

export default function Dashboard() {
  const currency = useAuthStore((s) => s.user?.currency) || "INR";
  const dark = useThemeStore((s) => s.mode === "dark");

  const panel =
    "rounded-2xl border backdrop-blur-xl " +
    (dark
      ? "border-slate-600/90 bg-slate-900/95 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.35)] [color-scheme:dark]"
      : "border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_4px_24px_rgba(15,23,42,0.06)] [color-scheme:light]");
  const strong = dark ? "text-white" : "text-slate-950";
  const sub = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const rowBorder = dark ? "border-slate-700" : "border-slate-200";

  const axisStroke = dark ? "#94a3b8" : "#64748b";
  const tooltipStyle = dark
    ? {
        background: "#1e293b",
        border: "1px solid #475569",
        borderRadius: 12,
        color: "#f1f5f9",
      }
    : {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        color: "#0f172a",
      };

  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState(null);
  const [recent, setRecent] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboard, setShowOnboard] = useState(
    () => !window.localStorage.getItem("velaro-onboarding-done")
  );

  function dismissOnboard() {
    window.localStorage.setItem("velaro-onboarding-done", "1");
    setShowOnboard(false);
  }

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        await api.recurring.applyDue();
      } catch {
      }
      try {
        const [sum, ov, tx, acc] = await Promise.all([
          api.transactions.summary(),
          api.analytics.overview("month"),
          api.transactions.list({ limit: "8", sort: "date_desc" }),
          api.accounts.list(),
        ]);
        if (!c) {
          setSummary(sum);
          setOverview(ov);
          setRecent(tx.items || []);
          setAccounts(acc);
        }
      } catch (e) {
        toast.error(e.message || "Failed to load dashboard");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const pieData = useMemo(() => {
    const rows = overview?.byCategory || [];
    return rows.map((r) => ({ name: r._id, value: r.total }));
  }, [overview]);

  const spendingLine = useMemo(() => {
    const d = overview?.dailyTrend || [];
    return d.map((x) => ({
      ...x,
      day: new Date(x.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));
  }, [overview]);

  const netTrend = overview?.netFlowTrend || [];

  const draining = useMemo(() => {
    const list = [...accounts].sort(
      (a, b) => (a.balance || 0) - (b.balance || 0)
    );
    return list.slice(0, 3);
  }, [accounts]);

  const statCards = [
    {
      label: "Total balance",
      value: formatMoney(summary?.totalBalance ?? 0, currency),
      sub: "Across all accounts",
      grad: "from-emerald-50/90 via-white to-teal-50/40",
    },
    {
      label: "Income vs expense",
      value: `${formatMoney(summary?.monthlyIncome ?? 0, currency)} / ${formatMoney(summary?.monthlyExpense ?? 0, currency)}`,
      sub: "This month",
      grad: "from-sky-50/90 via-white to-cyan-50/40",
    },
    {
      label: "Savings rate",
      value: `${summary?.savingsRate ?? 0}%`,
      sub: "Of monthly income",
      grad: "from-violet-50/80 via-white to-fuchsia-50/30",
    },
    {
      label: "Spending",
      value: formatMoney(summary?.todaySpending ?? 0, currency),
      sub: `Month: ${formatMoney(summary?.monthSpending ?? 0, currency)}`,
      grad: "from-amber-50/80 via-white to-orange-50/30",
    },
  ];

  if (loading && !summary) {
    return (
      <div className={`flex items-center justify-center min-h-[40vh] ${muted} font-medium`}>
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className={`font-display text-3xl font-semibold tracking-tight ${strong}`}>
            Dashboard
          </h1>
          <p className={`mt-1 ${sub}`}>
            Your financial control center — balances, flow, and signals.
          </p>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={
              dark
                ? `rounded-2xl border border-slate-600/90 bg-slate-800/95 p-5 shadow-lg [color-scheme:dark] pl-4 ${STAT_DARK_ACCENT[i % STAT_DARK_ACCENT.length]}`
                : `rounded-2xl border border-slate-200/90 bg-gradient-to-br ${c.grad} p-5 text-slate-900 shadow-[0_4px_24px_rgba(15,23,42,0.06)] [color-scheme:light]`
            }
          >
            <p
              className={`text-xs uppercase tracking-wider font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}
            >
              {c.label}
            </p>
            <p className={`mt-2 font-display text-xl font-semibold ${dark ? "text-white" : "text-slate-950"}`}>
              {c.value}
            </p>
            <p className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>{c.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`${panel} p-6`}>
          <h2 className={`font-display font-semibold mb-4 ${strong}`}>Expenses by category</h2>
          <div className="h-72">
            {pieData.length === 0 ? (
              <p className={`text-sm py-16 text-center font-medium ${muted}`}>No expense data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`${panel} p-6`}
        >
          <h2 className={`font-display font-semibold mb-4 ${strong}`}>Spending over time</h2>
          <div className="h-72">
            {spendingLine.length === 0 ? (
              <p className={`text-sm py-16 text-center font-medium ${muted}`}>No daily spend yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendingLine}>
                  <XAxis dataKey="day" stroke={axisStroke} fontSize={11} />
                  <YAxis stroke={axisStroke} fontSize={11} />
                  <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      <div className={`${panel} p-6`}>
        <h2 className={`font-display font-semibold mb-4 ${strong}`}>Net worth trend</h2>
        <p className={`text-xs mb-4 ${muted}`}>
          Cumulative monthly net flow (income minus expenses), last six months.
        </p>
        <div className="h-56">
          {netTrend.length === 0 ? (
            <p className={`text-sm py-12 text-center font-medium ${muted}`}>Not enough history</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netTrend}>
                <XAxis dataKey="label" stroke={axisStroke} fontSize={11} />
                <YAxis stroke={axisStroke} fontSize={11} />
                <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${panel} p-6`}>
          <h2 className={`font-display font-semibold mb-4 ${strong}`}>Quick insights</h2>
          <ul className="space-y-3">
            {(overview?.insights || []).length === 0 ? (
              <li className={`text-sm font-medium ${muted}`}>Add transactions to unlock insights.</li>
            ) : (
              overview.insights.map((ins, idx) => (
                <li
                  key={idx}
                  className={`text-sm border-l-2 border-sky-500 pl-3 py-0.5 ${dark ? "text-slate-200" : "text-slate-700"}`}
                >
                  {ins.text}
                </li>
              ))
            )}
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${panel} p-6`}>
          <h2 className={`font-display font-semibold mb-4 ${strong}`}>Accounts to watch</h2>
          <p className={`text-xs mb-3 font-medium ${muted}`}>Lowest balances first</p>
          <ul className="space-y-2">
            {draining.length === 0 ? (
              <li className={`text-sm font-medium ${muted}`}>No accounts yet</li>
            ) : (
              draining.map((a) => (
                <li
                  key={a._id}
                  className={`flex justify-between text-sm py-2 border-b last:border-0 ${rowBorder}`}
                >
                  <span className={dark ? "text-slate-100" : "text-slate-800"}>
                    {a.name} <span className={muted}>({a.type})</span>
                  </span>
                  <span
                    className={
                      (a.balance || 0) < 0 ? "text-accent-rose" : "text-accent-mint"
                    }
                  >
                    {formatMoney(a.balance, currency)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${panel} p-6`}>
        <h2 className={`font-display font-semibold mb-4 ${strong}`}>Recent transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left font-semibold border-b ${rowBorder} ${muted}`}>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`py-8 text-center font-medium ${muted}`}>
                    No transactions
                  </td>
                </tr>
              ) : (
                recent.map((t) => (
                  <tr key={t._id} className={`border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
                    <td className={`py-3 pr-4 ${muted}`}>{formatDateDMY(t.date)}</td>
                    <td className={`py-3 pr-4 capitalize ${strong}`}>{t.type}</td>
                    <td className={`py-3 pr-4 ${strong}`}>{t.category}</td>
                    <td className={`py-3 text-right font-semibold ${strong}`}>
                      {formatMoney(t.amount, currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {showOnboard && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60"
              aria-label="Dismiss"
              onClick={dismissOnboard}
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className={`relative max-w-lg w-full p-8 space-y-4 ${panel}`}
            >
              <h2 className={`font-display text-xl font-semibold ${strong}`}>Welcome to Velaro</h2>
              <p className={`text-sm ${sub}`}>
                Connect accounts under Accounts, log transactions, set budgets, and track goals. Use
                the sidebar to explore — everything stays in your workspace.
              </p>
              <ul className={`text-sm space-y-2 list-disc pl-5 ${dark ? "text-slate-200" : "text-slate-700"}`}>
                <li>
                  <Link
                    className={`font-medium hover:underline ${dark ? "text-sky-400" : "text-sky-700"}`}
                    to="/transactions"
                  >
                    Transactions
                  </Link>{" "}
                  for daily flow (CSV import supported)
                </li>
                <li>
                  <Link
                    className={`font-medium hover:underline ${dark ? "text-sky-400" : "text-sky-700"}`}
                    to="/goals"
                  >
                    Goals
                  </Link>{" "}
                  for savings targets
                </li>
                <li>
                  <Link
                    className={`font-medium hover:underline ${dark ? "text-sky-400" : "text-sky-700"}`}
                    to="/calendar"
                  >
                    Calendar
                  </Link>{" "}
                  for bills and renewals
                </li>
              </ul>
              <button
                type="button"
                onClick={dismissOnboard}
                className="w-full py-2.5 rounded-xl bg-accent-sky/90 text-white text-sm font-medium"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
