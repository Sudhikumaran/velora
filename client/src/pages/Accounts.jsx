import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatMoney } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";

export default function Accounts() {
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
  const field =
    "rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35 w-full " +
    (dark
      ? "border-slate-500 bg-slate-950 text-slate-100 placeholder:text-slate-400"
      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500");

  const cardTile = dark
    ? "rounded-2xl border border-slate-600/90 bg-slate-800/95 p-5 shadow-md [color-scheme:dark]"
    : "rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/90 shadow-sm p-5 [color-scheme:light]";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "bank",
    balance: "",
  });

  async function load() {
    setLoading(true);
    try {
      const acc = await api.accounts.list();
      setList(acc);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      if (modal?.mode === "edit") {
        await api.accounts.update(modal.acc._id, {
          name: form.name,
          type: form.type,
          balance: form.balance === "" ? undefined : Number(form.balance),
        });
        toast.success("Updated");
      } else {
        await api.accounts.create({
          name: form.name,
          type: form.type,
          balance: Number(form.balance) || 0,
        });
        toast.success("Created");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this account?")) return;
    try {
      await api.accounts.remove(id);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const draining = [...list].sort((a, b) => (a.balance || 0) - (b.balance || 0));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className={`font-display text-3xl font-semibold ${strong}`}>Accounts</h1>
          <p className={`text-sm mt-1 ${sub}`}>
            Cash, bank, and credit — where money lives and moves.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({ name: "", type: "bank", balance: "" });
            setModal({ mode: "create" });
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-mint/90 to-accent-sky/90 text-surface-950 text-sm font-medium"
        >
          New account
        </button>
      </div>

      <div className={`${panel} p-4`}>
        <h2 className={`text-sm font-semibold mb-3 ${muted}`}>Draining first</h2>
        {loading ? (
          <p className={`font-medium ${muted}`}>Loading…</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {draining.map((a, i) => (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cardTile}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{a.name}</p>
                    <p className={`text-xs capitalize mt-1 ${muted}`}>{a.type}</p>
                  </div>
                  <p
                    className={`font-display font-semibold shrink-0 ${
                      (a.balance || 0) < 0 ? "text-accent-rose" : "text-accent-mint"
                    }`}
                  >
                    {formatMoney(a.balance, currency)}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-accent-sky font-medium"
                    onClick={() => {
                      setForm({
                        name: a.name,
                        type: a.type,
                        balance: String(a.balance ?? 0),
                      });
                      setModal({ mode: "edit", acc: a });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-accent-rose font-medium"
                    onClick={() => remove(a._id)}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
            {draining.length === 0 && (
              <p className={`text-sm font-medium ${muted}`}>No accounts yet</p>
            )}
          </div>
        )}
      </div>

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
              className="absolute inset-0 bg-slate-900/50"
              aria-label="Close"
              onClick={() => setModal(null)}
            />
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={submit}
              className={`relative w-full max-w-md p-6 space-y-4 ${panel}`}
            >
              <h3 className={`font-display font-semibold text-lg ${strong}`}>
                {modal.mode === "edit" ? "Edit account" : "New account"}
              </h3>
              <div>
                <label className={`text-xs font-medium block mb-1 ${sub}`}>Name</label>
                <input
                  required
                  className={field}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${sub}`}>Type</label>
                <select
                  className={field}
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="cash">Cash wallet</option>
                  <option value="bank">Bank account</option>
                  <option value="credit">Credit card</option>
                </select>
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${sub}`}>
                  Balance {modal.mode === "edit" && "(adjust manually)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={field}
                  value={form.balance}
                  onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-accent-sky/90 text-surface-950 font-medium text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  className={
                    dark
                      ? "px-4 py-2.5 rounded-xl border border-slate-500 bg-slate-800 text-slate-100 text-sm shadow-sm"
                      : "px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm shadow-sm"
                  }
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
