import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatMoney } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";

const TYPES = ["stock", "crypto", "mutual_fund", "other"];

export default function Investments() {
  const currency = useAuthStore((s) => s.user?.currency) || "INR";
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "stock",
    investedAmount: "",
    currentValue: "",
  });

  async function load() {
    try {
      const inv = await api.investments.list(q ? { q } : {});
      setList(inv);
    } catch (e) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function submit(e) {
    e.preventDefault();
    try {
      if (modal?.mode === "edit") {
        await api.investments.update(modal.row._id, {
          name: form.name,
          type: form.type,
          investedAmount: Number(form.investedAmount),
          currentValue: Number(form.currentValue),
        });
        toast.success("Updated");
      } else {
        await api.investments.create({
          name: form.name,
          type: form.type,
          investedAmount: Number(form.investedAmount),
          currentValue: Number(form.currentValue),
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
    if (!confirm("Remove investment?")) return;
    try {
      await api.investments.remove(id);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const totalPL = list.reduce(
    (s, i) => s + (i.currentValue - i.investedAmount),
    0
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Investments</h1>
          <p className="text-slate-600 text-sm mt-1">
            Stocks, crypto, mutual funds — profit and loss at a glance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({
              name: "",
              type: "stock",
              investedAmount: "",
              currentValue: "",
            });
            setModal({ mode: "create" });
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-mint/90 to-accent-violet/90 text-surface-950 text-sm font-medium"
        >
          Add holding
        </button>
      </div>

      <div className="glass-panel p-5 flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Portfolio P/L</p>
          <p
            className={`font-display text-2xl font-semibold ${
              totalPL >= 0 ? "text-accent-mint" : "text-accent-rose"
            }`}
          >
            {totalPL >= 0 ? "+" : ""}
            {formatMoney(totalPL, currency)}
          </p>
        </div>
        <input
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-4 py-2 text-sm min-w-[200px]"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((i, idx) => {
          const pl = i.currentValue - i.investedAmount;
          return (
            <motion.div
              key={i._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="glass-panel p-5"
            >
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-slate-500 capitalize mt-1">{i.type.replace("_", " ")}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Invested</p>
                  <p>{formatMoney(i.investedAmount, currency)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Current</p>
                  <p>{formatMoney(i.currentValue, currency)}</p>
                </div>
              </div>
              <p
                className={`mt-3 font-display font-semibold ${
                  pl >= 0 ? "text-accent-mint" : "text-accent-rose"
                }`}
              >
                {pl >= 0 ? "+" : ""}
                {formatMoney(pl, currency)}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="text-xs text-accent-sky"
                  onClick={() => {
                    setForm({
                      name: i.name,
                      type: i.type,
                      investedAmount: String(i.investedAmount),
                      currentValue: String(i.currentValue),
                    });
                    setModal({ mode: "edit", row: i });
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs text-accent-rose"
                  onClick={() => remove(i._id)}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
      {list.length === 0 && <p className="text-slate-500 text-sm">No holdings</p>}

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
                {modal.mode === "edit" ? "Edit holding" : "New holding"}
              </h3>
              <input
                required
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <select
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="number"
                required
                placeholder="Invested amount"
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.investedAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, investedAmount: e.target.value }))
                }
              />
              <input
                type="number"
                required
                placeholder="Current value"
                className="w-full rounded-xl bg-white border border-slate-200 shadow-sm text-slate-900 px-3 py-2 text-sm"
                value={form.currentValue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentValue: e.target.value }))
                }
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-accent-mint/90 text-surface-950 text-sm font-medium"
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
