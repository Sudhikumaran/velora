import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatMoney } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";

export default function Goals() {
  const currency = useAuthStore((s) => s.user?.currency) || "INR";
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    savedAmount: "0",
    deadline: "",
  });

  const load = useCallback(async () => {
    try {
      const g = await api.goals.list();
      setGoals(g);
    } catch (e) {
      toast.error(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addGoal(e) {
    e.preventDefault();
    try {
      await api.goals.create({
        name: form.name.trim(),
        targetAmount: Number(form.targetAmount),
        savedAmount: Number(form.savedAmount || 0),
        deadline: form.deadline || undefined,
      });
      toast.success("Goal created");
      setForm({ name: "", targetAmount: "", savedAmount: "0", deadline: "" });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function updateSaved(id, saved) {
    try {
      await api.goals.update(id, { savedAmount: saved });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(id) {
    if (!confirm("Remove this goal?")) return;
    try {
      await api.goals.remove(id);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Goals</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Savings targets and progress.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={addGoal}
        className="glass-panel p-6 grid sm:grid-cols-2 gap-3"
      >
        <input
          required
          placeholder="Goal name"
          className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 sm:col-span-2"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="Target amount"
          className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          value={form.targetAmount}
          onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Already saved"
          className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          value={form.savedAmount}
          onChange={(e) => setForm((f) => ({ ...f, savedAmount: e.target.value }))}
        />
        <input
          type="date"
          className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 sm:col-span-2"
          value={form.deadline}
          onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
        />
        <button
          type="submit"
          className="sm:col-span-2 py-2.5 rounded-xl bg-accent-sky/90 text-white text-sm font-medium"
        >
          Add goal
        </button>
      </motion.form>

      <ul className="space-y-3">
        {goals.length === 0 ? (
          <li className="text-slate-500 text-sm py-8 text-center">No goals yet</li>
        ) : (
          goals.map((g) => {
            const pct =
              g.targetAmount > 0
                ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
                : 0;
            return (
              <motion.li
                key={g._id}
                layout
                className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{g.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatMoney(g.savedAmount, currency)} / {formatMoney(g.targetAmount, currency)} ·{" "}
                    {pct}%
                  </p>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                    <div
                      className="h-full bg-accent-mint/90 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {g.deadline && (
                    <p className="text-xs text-slate-500 mt-2">
                      Deadline: {new Date(g.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={g.savedAmount}
                    key={g._id + String(g.savedAmount)}
                    className="w-28 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v) && v !== g.savedAmount) updateSaved(g._id, v);
                    }}
                  />
                  <button
                    type="button"
                    className="text-xs text-accent-rose"
                    onClick={() => remove(g._id)}
                  >
                    Remove
                  </button>
                </div>
              </motion.li>
            );
          })
        )}
      </ul>
    </div>
  );
}
