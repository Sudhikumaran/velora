import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatDateDMY, formatMoney } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";

export default function Calendar() {
  const currency = useAuthStore((s) => s.user?.currency) || "INR";
  const [debts, setDebts] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const [d, s] = await Promise.all([api.debts.list(), api.subscriptions.list()]);
        if (!c) {
          setDebts(d);
          setSubs(s);
        }
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

  const events = useMemo(() => {
    const out = [];
    for (const d of debts) {
      if (d.reminderAt)
        out.push({
          at: new Date(d.reminderAt),
          kind: "debt",
          title: `${d.type === "you_owe" ? "Owe" : "Lent"}: ${d.personName}`,
          meta: formatMoney(d.amount, currency),
        });
      if (d.date)
        out.push({
          at: new Date(d.date),
          kind: "debt",
          title: `Debt opened · ${d.personName}`,
          meta: formatMoney(d.amount, currency),
        });
    }
    for (const s of subs) {
      if (s.nextRenewalDate)
        out.push({
          at: new Date(s.nextRenewalDate),
          kind: "subscription",
          title: s.name || "Subscription",
          meta: formatMoney(s.amount || 0, currency),
        });
    }
    out.sort((a, b) => a.at - b.at);
    return out;
  }, [debts, subs, currency]);

  const grouped = useMemo(() => {
    const m = new Map();
    for (const e of events) {
      const key = formatDateDMY(e.at);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(e);
    }
    return Array.from(m.entries());
  }, [events]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Bill calendar</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Debt reminders and subscription renewals in one timeline.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : grouped.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-500 text-sm">
          No dated reminders yet. Add{" "}
          <span className="text-slate-700 dark:text-slate-300">reminder dates</span> on debts or
          subscriptions.
        </div>
      ) : (
        <ul className="space-y-6">
          {grouped.map(([dayLabel, items]) => (
            <motion.li
              key={dayLabel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5"
            >
              <p className="text-sm font-medium text-sky-700 dark:text-sky-400 mb-3">{dayLabel}</p>
              <ul className="space-y-3">
                {items.map((e, i) => (
                  <li
                    key={`${dayLabel}-${i}-${e.title}`}
                    className="flex justify-between gap-4 text-sm border-b border-slate-200/80 dark:border-slate-700/80 last:border-0 pb-3 last:pb-0"
                  >
                    <span>
                      <span
                        className={
                          e.kind === "subscription"
                            ? "text-violet-600 dark:text-violet-400"
                            : "text-slate-800 dark:text-slate-200"
                        }
                      >
                        {e.title}
                      </span>
                      <span className="text-slate-500 text-xs ml-2 capitalize">({e.kind})</span>
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 shrink-0">{e.meta}</span>
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
