import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatMoney } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  mergeCategories,
  displayCategoryLabel,
} from "../lib/categoryLists.js";

export default function Budgets() {
  const currency = useAuthStore((s) => s.user?.currency) || "INR";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [status, setStatus] = useState([]);
  const [form, setForm] = useState({ category: "food", limit: "" });
  const [categoryRows, setCategoryRows] = useState([]);
  const [newCatName, setNewCatName] = useState("");

  const expenseCategoryOptions = useMemo(
    () => mergeCategories(DEFAULT_EXPENSE_CATEGORIES, categoryRows, "expense"),
    [categoryRows]
  );

  useEffect(() => {
    (async () => {
      try {
        const rows = await api.categories.list();
        setCategoryRows(rows);
      } catch {
        setCategoryRows([]);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([
        api.budgets.list({ month: String(month), year: String(year) }),
        api.analytics.budgetStatus({ month: String(month), year: String(year) }),
      ]);
      setBudgets(b);
      setStatus(s);
    } catch (e) {
      toast.error(e.message);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  async function addBudget(e) {
    e.preventDefault();
    try {
      await api.budgets.create({
        category: form.category,
        limit: Number(form.limit),
        month,
        year,
      });
      toast.success("Budget saved");
      setForm((f) => ({ ...f, limit: "" }));
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(id) {
    try {
      await api.budgets.remove(id);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const statusMap = Object.fromEntries(status.map((s) => [s.category, s]));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Budgets</h1>
        <p className="text-slate-600 text-sm mt-1">
          Limits per category with live spend and alerts.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="w-28 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      </div>

      <form
        onSubmit={addBudget}
        className="glass-panel p-4 flex flex-wrap gap-3 items-end"
      >
        <div>
          <label className="text-xs text-slate-500 block mb-1">Category</label>
          <select
            className="rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {expenseCategoryOptions.map((c) => (
              <option key={c} value={c}>
                {displayCategoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-slate-500 block mb-1">New expense category</label>
            <input
              type="text"
              placeholder="Name…"
              className="rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm w-40"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm shadow-sm"
            onClick={async () => {
              const trimmed = newCatName.trim();
              if (!trimmed) {
                toast.error("Enter a name");
                return;
              }
              try {
                await api.categories.create({ name: trimmed, kind: "expense" });
                const rows = await api.categories.list();
                setCategoryRows(rows);
                setForm((f) => ({ ...f, category: trimmed }));
                setNewCatName("");
                toast.success("Category added");
              } catch (err) {
                toast.error(err.message);
              }
            }}
          >
            Add
          </button>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Limit</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            className="w-40 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
            value={form.limit}
            onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-accent-sky/90 text-surface-950 text-sm font-medium"
        >
          Set budget
        </button>
      </form>

      <div className="space-y-4">
        {budgets.map((b, i) => {
          const st = statusMap[b.category];
          const pct = st?.percent ?? 0;
          const barColor =
            st?.exceeded ? "bg-accent-rose" : st?.nearing ? "bg-accent-amber" : "bg-accent-mint";
          return (
            <motion.div
              key={b._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-panel p-5"
            >
              <div className="flex justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium capitalize">{b.category}</p>
                  <p className="text-xs text-slate-500">
                    Spent {formatMoney(st?.spent ?? 0, currency)} of{" "}
                    {formatMoney(b.limit, currency)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-accent-rose"
                  onClick={() => remove(b._id)}
                >
                  Remove
                </button>
              </div>
              <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
                <motion.div
                  className={`h-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              {st?.exceeded && (
                <p className="text-xs text-accent-rose mt-2">Over limit</p>
              )}
              {st?.nearing && !st?.exceeded && (
                <p className="text-xs text-accent-amber mt-2">Nearing limit</p>
              )}
            </motion.div>
          );
        })}
        {budgets.length === 0 && (
          <p className="text-slate-500 text-sm">No budgets for this month</p>
        )}
      </div>
    </div>
  );
}
