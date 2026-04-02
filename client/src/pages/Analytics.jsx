import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatMoney, formatDateDMY, downloadCsv } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";

const STAT_DARK = [
  "border-l-sky-400",
  "border-l-rose-400",
  "border-l-emerald-400",
];

export default function Analytics() {
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
  const thead = dark ? "bg-slate-800 text-slate-50" : "bg-slate-200 text-slate-900";
  const rowBd = dark ? "border-slate-700" : "border-slate-200";
  const fieldSelect =
    "rounded-xl border px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35 " +
    (dark
      ? "border-slate-500 bg-slate-950 text-slate-100"
      : "border-slate-300 bg-white text-slate-900");
  const btnSecondary =
    dark
      ? "px-4 py-2 rounded-xl border border-slate-500 bg-slate-800 text-slate-100 text-sm shadow-sm hover:bg-slate-700"
      : "px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm shadow-sm hover:bg-slate-50";

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

  const statShell = (i, lightGrad) =>
    dark
      ? `rounded-2xl border border-slate-600/90 bg-slate-800/95 p-5 shadow-lg [color-scheme:dark] border-l-4 ${STAT_DARK[i % STAT_DARK.length]}`
      : `rounded-2xl border border-slate-200/90 bg-gradient-to-br ${lightGrad} p-5 text-slate-900 shadow-[0_4px_24px_rgba(15,23,42,0.06)] [color-scheme:light]`;

  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      const ov = await api.analytics.overview(range);
      setData(ov);
    } catch (e) {
      toast.error(e.message);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  function exportTop() {
    const rows = (data?.topExpenses || []).map((t) => ({
      date: formatDateDMY(t.date),
      amount: t.amount,
      category: t.category,
      note: t.note,
    }));
    downloadCsv("velaro-top-expenses.csv", rows);
    toast.success("Exported");
  }

  const barData = (data?.byCategory || []).map((c) => ({
    name: c._id,
    total: c.total,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`font-display text-3xl font-semibold ${strong}`}>Analytics</h1>
          <p className={`text-sm mt-1 ${sub}`}>
            Category mix, cadence, top spends, and narrative insights.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className={fieldSelect} value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <button type="button" onClick={exportTop} className={btnSecondary}>
            Export top expenses
          </button>
        </div>
      </div>

      {!data ? (
        <p className={`font-medium ${muted}`}>Loading…</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={statShell(0, "from-sky-50/90 via-white to-white")}
            >
              <p className={`text-xs uppercase tracking-wide font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
                Income
              </p>
              <p className={`font-display text-2xl font-semibold mt-1 ${dark ? "text-white" : "text-slate-950"}`}>
                {formatMoney(data.totals.income, currency)}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={statShell(1, "from-rose-50/80 via-white to-white")}
            >
              <p className={`text-xs uppercase tracking-wide font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
                Expense
              </p>
              <p className={`font-display text-2xl font-semibold mt-1 ${dark ? "text-white" : "text-slate-950"}`}>
                {formatMoney(data.totals.expense, currency)}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={statShell(2, "from-emerald-50/80 via-white to-white")}
            >
              <p className={`text-xs uppercase tracking-wide font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
                Savings rate
              </p>
              <p className={`font-display text-2xl font-semibold mt-1 ${dark ? "text-white" : "text-slate-950"}`}>
                {data.totals.savingsPercent}%
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className={`${panel} p-6`}>
              <h2 className={`font-display font-semibold mb-4 ${strong}`}>Category spending</h2>
              <div className="h-72">
                {barData.length === 0 ? (
                  <p className={`text-sm text-center py-16 font-medium ${muted}`}>No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <XAxis dataKey="name" stroke={axisStroke} fontSize={11} />
                      <YAxis stroke={axisStroke} fontSize={11} />
                      <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={tooltipStyle} />
                      <Bar dataKey="total" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className={`${panel} p-6`}>
              <h2 className={`font-display font-semibold mb-4 ${strong}`}>Daily trend</h2>
              <div className="h-72">
                {(data.dailyTrend || []).length === 0 ? (
                  <p className={`text-sm text-center py-16 font-medium ${muted}`}>No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.dailyTrend.map((x) => ({
                        ...x,
                        day: new Date(x.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        }),
                      }))}
                    >
                      <XAxis dataKey="day" stroke={axisStroke} fontSize={11} />
                      <YAxis stroke={axisStroke} fontSize={11} />
                      <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className={`${panel} p-6`}>
            <h2 className={`font-display font-semibold mb-4 ${strong}`}>Insights engine</h2>
            <ul className="grid md:grid-cols-2 gap-3">
              {(data.insights || []).length === 0 ? (
                <li className={`text-sm col-span-full font-medium ${muted}`}>
                  Add more labeled transactions to unlock comparisons.
                </li>
              ) : (
                data.insights.map((ins, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={
                      dark
                        ? "text-sm p-4 rounded-xl bg-slate-800/80 border border-slate-600 text-slate-100"
                        : "text-sm p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                    }
                  >
                    {ins.text}
                  </motion.li>
                ))
              )}
            </ul>
          </div>

          <div className={`${panel} p-6`}>
            <h2 className={`font-display font-semibold mb-4 ${strong}`}>Top expenses</h2>
            <div className="overflow-x-auto text-sm">
              <table className="w-full">
                <thead>
                  <tr className={`text-left font-semibold ${thead}`}>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.topExpenses || []).map((t) => (
                    <tr key={t._id} className={`border-b ${rowBd}`}>
                      <td className={`py-2 ${muted}`}>{formatDateDMY(t.date)}</td>
                      <td className={`py-2 ${strong}`}>{t.category}</td>
                      <td className={`py-2 text-right font-semibold ${strong}`}>
                        {formatMoney(t.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
