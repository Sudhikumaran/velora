import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatMoney, formatDateDMY } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";

const COLORS = ["#34d399", "#38bdf8", "#a78bfa", "#fbbf24", "#fb7185"];

export default function Income() {
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

  const totalCard = dark
    ? "rounded-2xl border border-slate-600/90 bg-slate-800/95 p-6 shadow-lg [color-scheme:dark] border-l-4 border-l-emerald-400"
    : "rounded-2xl border border-slate-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] [color-scheme:light]";

  const [tx, setTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.transactions.list({ type: "income", limit: "500" });
        if (!c) setTx(res.items || []);
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const byCategory = useMemo(() => {
    const m = {};
    for (const t of tx) {
      m[t.category] = (m[t.category] || 0) + t.amount;
    }
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tx]);

  const monthlyGrowth = useMemo(() => {
    const buckets = {};
    for (const t of tx) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = (buckets[key] || 0) + t.amount;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => ({
        label: key,
        total,
      }));
  }, [tx]);

  const total = tx.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className={`font-display text-3xl font-semibold ${strong}`}>Income</h1>
        <p className={`text-sm mt-1 ${sub}`}>
          Salary, freelance, gifts, refunds — sources and momentum.
        </p>
      </div>

      {loading ? (
        <p className={`font-medium ${muted}`}>Loading…</p>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={totalCard}
          >
            <p
              className={`text-xs uppercase tracking-wide font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}
            >
              Recorded income
            </p>
            <p className={`font-display text-3xl font-semibold mt-2 ${dark ? "text-white" : "text-slate-950"}`}>
              {formatMoney(total, currency)}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className={`${panel} p-6`}>
              <h2 className={`font-display font-semibold mb-4 ${strong}`}>Source breakdown</h2>
              <div className="h-72">
                {byCategory.length === 0 ? (
                  <p className={`text-sm text-center py-16 font-medium ${muted}`}>No income yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {byCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className={`${panel} p-6`}>
              <h2 className={`font-display font-semibold mb-4 ${strong}`}>Monthly income</h2>
              <div className="h-72">
                {monthlyGrowth.length === 0 ? (
                  <p className={`text-sm text-center py-16 font-medium ${muted}`}>No history</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyGrowth}>
                      <defs>
                        <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" stroke={axisStroke} fontSize={10} />
                      <YAxis stroke={axisStroke} fontSize={10} />
                      <Tooltip formatter={(v) => formatMoney(v, currency)} contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#34d399"
                        fillOpacity={1}
                        fill="url(#inc)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className={`${panel} overflow-hidden`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left font-semibold ${thead}`}>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Note</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {tx.slice(0, 40).map((t) => (
                  <tr key={t._id} className={`border-t ${rowBd}`}>
                    <td className={`p-3 ${muted}`}>{formatDateDMY(t.date)}</td>
                    <td className={`p-3 ${strong}`}>{t.category}</td>
                    <td className={`p-3 truncate max-w-[200px] ${muted}`}>{t.note}</td>
                    <td className={`p-3 text-right font-semibold ${strong}`}>
                      {formatMoney(t.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
