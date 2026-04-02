import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatMoney, formatDateDMY } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";

export default function Subscriptions() {
  const currency = useAuthStore((s) => s.user?.currency) || "INR";
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    billingCycle: "monthly",
    nextRenewalDate: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    try {
      setList(await api.subscriptions.list());
    } catch (e) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      if (modal?.mode === "edit") {
        await api.subscriptions.update(modal.row._id, {
          name: form.name,
          amount: Number(form.amount),
          billingCycle: form.billingCycle,
          nextRenewalDate: form.nextRenewalDate,
        });
        toast.success("Updated");
      } else {
        await api.subscriptions.create({
          name: form.name,
          amount: Number(form.amount),
          billingCycle: form.billingCycle,
          nextRenewalDate: form.nextRenewalDate,
        });
        toast.success("Added");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(id) {
    try {
      await api.subscriptions.remove(id);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const monthlyNormalized = useMemo(() => {
    return list.reduce((s, x) => {
      let m = x.amount;
      if (x.billingCycle === "yearly") m = x.amount / 12;
      if (x.billingCycle === "weekly") m = x.amount * 4;
      return s + m;
    }, 0);
  }, [list]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return [...list]
      .filter((x) => new Date(x.nextRenewalDate) >= now)
      .sort((a, b) => new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate))
      .slice(0, 6);
  }, [list]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Subscriptions</h1>
          <p className="text-slate-600 text-sm mt-1">
            Recurring services, normalized monthly burn, renewal radar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({
              name: "",
              amount: "",
              billingCycle: "monthly",
              nextRenewalDate: new Date().toISOString().slice(0, 10),
            });
            setModal({ mode: "create" });
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-violet/90 to-accent-sky/90 text-white text-sm font-medium"
        >
          Add subscription
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5"
        >
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Est. monthly total
          </p>
          <p className="font-display text-2xl font-semibold mt-2 text-accent-sky">
            {formatMoney(monthlyNormalized, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-2">Normalized from billing cycles</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-5"
        >
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Upcoming renewals
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {upcoming.length === 0 ? (
              <li className="text-slate-500">None scheduled ahead</li>
            ) : (
              upcoming.map((s) => (
                <li key={s._id} className="flex justify-between gap-2">
                  <span>{s.name}</span>
                  <span className="text-slate-500">
                    {new Date(s.nextRenewalDate).toLocaleDateString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </motion.div>
      </div>

      <div className="space-y-3">
        {list.map((s, i) => (
          <motion.div
            key={s._id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-panel p-4 flex flex-wrap justify-between gap-3"
          >
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-slate-500 capitalize">
                {s.billingCycle} · Next {formatDateDMY(s.nextRenewalDate)}
              </p>
            </div>
            <p className="font-display font-semibold">{formatMoney(s.amount, currency)}</p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                className="text-xs text-accent-sky"
                onClick={() => {
                  setForm({
                    name: s.name,
                    amount: String(s.amount),
                    billingCycle: s.billingCycle,
                    nextRenewalDate: new Date(s.nextRenewalDate).toISOString().slice(0, 10),
                  });
                  setModal({ mode: "edit", row: s });
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-xs text-accent-rose"
                onClick={() => remove(s._id)}
              >
                Remove
              </button>
            </div>
          </motion.div>
        ))}
        {list.length === 0 && <p className="text-slate-500 text-sm">No subscriptions</p>}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setModal(null)}
            />
            <motion.form
              onSubmit={submit}
              className="relative w-full max-w-md glass-panel p-6 space-y-3"
            >
              <h3 className="font-display font-semibold">
                {modal.mode === "edit" ? "Edit subscription" : "New subscription"}
              </h3>
              <input
                required
                placeholder="Netflix, Gym…"
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                type="number"
                required
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <select
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.billingCycle}
                onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value }))}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                type="date"
                required
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.nextRenewalDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nextRenewalDate: e.target.value }))
                }
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-accent-violet/90 text-white text-sm font-medium"
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
    </div>
  );
}
