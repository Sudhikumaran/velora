import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "../lib/api.js";
import { buildDebtSummary } from "../lib/debtSummary.js";
import { formatMoney, formatDateDMY } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";

const PIE_COLORS = ["#fb7185", "#34d399"];

export default function Debts() {
  const currency = useAuthStore((s) => s.user?.currency) || "INR";
  const dark = useThemeStore((s) => s.mode === "dark");
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    personName: "",
    amount: "",
    type: "you_owe",
    date: new Date().toISOString().slice(0, 10),
  });
  const [payModal, setPayModal] = useState(null);
  const [payAmt, setPayAmt] = useState("");

  const panel =
    "rounded-2xl border backdrop-blur-xl " +
    (dark
      ? "border-slate-600/90 bg-slate-900/95 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.35)] [color-scheme:dark]"
      : "border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_4px_24px_rgba(15,23,42,0.06)] [color-scheme:light]");
  const strong = dark ? "text-white" : "text-slate-950";
  const sub = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-slate-400" : "text-slate-500";
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

  async function loadList() {
    try {
      const d = await api.debts.list(q ? { q } : {});
      setList(d);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function loadAnalyzer() {
    try {
      const s = await api.debts.summary();
      setSummary(s);
    } catch {
      try {
        const all = await api.debts.list({});
        setSummary(buildDebtSummary(all));
      } catch {
        setSummary(null);
      }
    }
  }

  function load() {
    loadList();
    loadAnalyzer();
  }

  useEffect(() => {
    const t = setTimeout(loadList, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    loadAnalyzer();
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      if (modal?.mode === "edit") {
        await api.debts.update(modal.row._id, {
          personName: form.personName,
          amount: Number(form.amount),
          type: form.type,
          date: form.date,
        });
        toast.success("Updated");
      } else {
        await api.debts.create({
          personName: form.personName,
          amount: Number(form.amount),
          type: form.type,
          date: form.date,
        });
        toast.success("Added");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function markPaid(id) {
    try {
      await api.debts.update(id, { status: "paid", amount: 0 });
      load();
      toast.success("Marked paid");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function payPartial() {
    if (!payModal) return;
    try {
      await api.debts.pay(payModal._id, { amount: Number(payAmt) });
      toast.success("Payment recorded");
      setPayModal(null);
      setPayAmt("");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete debt record?")) return;
    try {
      await api.debts.remove(id);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Debts</h1>
          <p className={`text-sm mt-1 ${sub}`}>
            Money to receive and money you owe — with partial payments and history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({
              personName: "",
              amount: "",
              type: "you_owe",
              date: new Date().toISOString().slice(0, 10),
            });
            setModal({ mode: "create" });
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-violet/90 to-accent-rose/80 text-white text-sm font-medium"
        >
          Add debt
        </button>
      </div>

      {summary && (
        <div className="space-y-4">
          <div>
            <h2 className={`font-display text-lg font-semibold ${strong}`}>Debt analyzer</h2>
            <p className={`text-sm mt-0.5 ${sub}`}>
              Totals across all records — search below only filters the list, not these figures.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`${panel} p-4 border-l-4 border-l-rose-400`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${muted}`}>You owe (pending)</p>
              <p className={`font-display text-2xl font-semibold mt-1 ${strong}`}>
                {formatMoney(summary.pendingYouOwe, currency)}
              </p>
            </div>
            <div className={`${panel} p-4 border-l-4 border-l-emerald-400`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${muted}`}>Owed to you (pending)</p>
              <p className={`font-display text-2xl font-semibold mt-1 ${strong}`}>
                {formatMoney(summary.pendingToReceive, currency)}
              </p>
            </div>
            <div
              className={`${panel} p-4 border-l-4 ${
                summary.netPosition >= 0 ? "border-l-sky-400" : "border-l-amber-400"
              }`}
            >
              <p className={`text-xs font-medium uppercase tracking-wide ${muted}`}>Net position</p>
              <p className={`font-display text-2xl font-semibold mt-1 ${strong}`}>
                {summary.netPosition >= 0 ? "+" : ""}
                {formatMoney(summary.netPosition, currency)}
              </p>
              <p className={`text-xs mt-1 ${muted}`}>
                Owed to you minus you owe — positive means others owe you more overall.
              </p>
            </div>
            <div className={`${panel} p-4 border-l-4 border-l-violet-400`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${muted}`}>Activity</p>
              <p className={`text-sm mt-2 space-y-1 ${sub}`}>
                <span className="block">
                  <span className={strong}>{summary.pendingCount}</span> pending ·{" "}
                  <span className={strong}>{summary.paidCount}</span> settled
                </span>
                <span className={`block text-xs ${muted}`}>
                  {summary.totalRecords} total lines ·{" "}
                  {formatMoney(summary.totalPartialPaymentsRecorded, currency)} in partial payments recorded
                </span>
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className={`${panel} p-5`}>
              <h3 className={`text-sm font-semibold mb-3 ${strong}`}>Pending split</h3>
              {summary.piePending.some((x) => x.value > 0) ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.piePending.filter((x) => x.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {summary.piePending
                          .filter((x) => x.value > 0)
                          .map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => formatMoney(Number(v), currency)}
                        contentStyle={tooltipStyle}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: 8, fontSize: 12, color: dark ? "#cbd5e1" : "#475569" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className={`text-sm ${muted}`}>No pending balances — add debts or all are paid.</p>
              )}
            </div>
            <div className={`${panel} p-5`}>
              <h3 className={`text-sm font-semibold mb-3 ${strong}`}>Largest pending balances by person</h3>
              {summary.topParties?.length ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summary.topParties.map((p) => ({
                        name:
                          p.personName.length > 14
                            ? `${p.personName.slice(0, 14)}…`
                            : p.personName,
                        owe: p.youOwe,
                        receive: p.toReceive,
                      }))}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="name" tick={{ fill: axisStroke, fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: axisStroke, fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v, name) => [formatMoney(Number(v), currency), name === "owe" ? "You owe" : "Owed to you"]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, color: dark ? "#cbd5e1" : "#475569" }}
                        formatter={(v) => (v === "owe" ? "You owe" : "Owed to you")}
                      />
                      <Bar dataKey="owe" stackId="a" fill="#fb7185" name="owe" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="receive" stackId="a" fill="#34d399" name="receive" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className={`text-sm ${muted}`}>No pending per-person totals yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        placeholder="Search person…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={
          "w-full max-w-md rounded-xl border px-4 py-2 text-sm shadow-sm " +
          (dark
            ? "bg-slate-800/90 border-slate-600 text-slate-100 placeholder:text-slate-500"
            : "bg-white border-slate-200 text-slate-900")
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((d, i) => (
          <motion.div
            key={d._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-panel p-5"
          >
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-medium">{d.personName}</p>
                <p className="text-xs text-slate-500 mt-1 capitalize">
                  {d.type.replace("_", " ")} · {d.status}
                </p>
              </div>
              <p className="font-display font-semibold">
                {formatMoney(d.amount, currency)}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {formatDateDMY(d.date)}
            </p>
            {d.paymentHistory?.length > 0 && (
              <ul className="mt-3 text-xs text-slate-500 space-y-1 border-t border-slate-200 pt-2">
                {d.paymentHistory.slice(-3).map((p) => (
                  <li key={p._id}>
                    {formatMoney(p.amount, currency)} on {formatDateDMY(p.date)}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {d.status === "pending" && d.amount > 0 && (
                <>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
                    onClick={() => {
                      setPayModal(d);
                      setPayAmt(String(d.amount));
                    }}
                  >
                    Partial pay
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-lg bg-accent-mint/20 text-accent-mint"
                    onClick={() => markPaid(d._id)}
                  >
                    Mark paid
                  </button>
                </>
              )}
              <button
                type="button"
                className="text-xs text-accent-sky"
                onClick={() => {
                  setForm({
                    personName: d.personName,
                    amount: String(d.amount),
                    type: d.type,
                    date: new Date(d.date).toISOString().slice(0, 10),
                  });
                  setModal({ mode: "edit", row: d });
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-xs text-accent-rose"
                onClick={() => remove(d._id)}
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {list.length === 0 && (
        <p className="text-slate-500 text-sm">No debt records</p>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setModal(null)}
            />
            <motion.form
              onSubmit={submit}
              className="absolute w-full max-w-md glass-panel p-6 space-y-3"
            >
              <h3 className="font-display font-semibold">
                {modal.mode === "edit" ? "Edit debt" : "New debt"}
              </h3>
              <input
                required
                placeholder="Person"
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.personName}
                onChange={(e) => setForm((f) => ({ ...f, personName: e.target.value }))}
              />
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="Amount"
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <select
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="you_gave">You gave (to receive)</option>
                <option value="you_owe">You owe (to pay)</option>
              </select>
              <input
                type="date"
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-accent-violet/90 text-white text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm shadow-sm"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {payModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setPayModal(null)}
            />
            <div className="relative glass-panel p-6 w-full max-w-sm space-y-3">
              <p className="font-medium">Partial payment — {payModal.personName}</p>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={payAmt}
                onChange={(e) => setPayAmt(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={payPartial}
                  className="flex-1 py-2 rounded-xl bg-accent-mint/80 text-surface-950 text-sm font-medium"
                >
                  Record
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm shadow-sm"
                  onClick={() => setPayModal(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
