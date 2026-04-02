import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatMoney, formatDateDMY } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";

export default function Debts() {
  const currency = useAuthStore((s) => s.user?.currency) || "INR";
  const [list, setList] = useState([]);
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

  async function load() {
    try {
      const d = await api.debts.list(q ? { q } : {});
      setList(d);
    } catch (e) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q]);

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
          <p className="text-slate-600 text-sm mt-1">
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

      <input
        placeholder="Search person…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full max-w-md rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm"
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
