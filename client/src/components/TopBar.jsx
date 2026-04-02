import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";
import { api } from "../lib/api.js";
import { formatMoney } from "../lib/format.js";
import toast from "react-hot-toast";

export default function TopBar({ onMenu }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const dark = useThemeStore((s) => s.mode === "dark");
  const [notifs, setNotifs] = useState([]);

  const bar =
    "border-b backdrop-blur-xl " +
    (dark
      ? "border-slate-600/90 bg-slate-900/95 text-slate-100 [color-scheme:dark]"
      : "border-slate-200/90 bg-white/95 text-slate-900 [color-scheme:light]");
  const sub = dark ? "text-slate-300" : "text-slate-600";
  const title = dark ? "text-white" : "text-slate-950";
  const iconBtn =
    dark
      ? "border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50";
  const dropPanel =
    dark
      ? "border border-slate-600 bg-slate-900 text-slate-100 shadow-xl"
      : "border border-slate-200 bg-white text-slate-900 shadow-xl";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [summary, budgetRows, debts] = await Promise.all([
          api.transactions.summary(),
          api.analytics.budgetStatus(),
          api.debts.list({ status: "pending" }),
        ]);
        const list = [];
        if (summary.todaySpending > 0) {
          list.push({
            id: "t1",
            text: `You spent ${formatMoney(summary.todaySpending, user?.currency)} today.`,
          });
        }
        for (const b of budgetRows) {
          if (b.exceeded) {
            list.push({
              id: `b-${b.category}`,
              text: `Budget limit reached for ${b.category}.`,
            });
          } else if (b.nearing) {
            list.push({
              id: `bn-${b.category}`,
              text: `Nearing budget limit: ${b.category} (${b.percent}%).`,
            });
          }
        }
        const owe = debts.filter((d) => d.type === "you_owe" && d.amount > 0);
        for (const d of owe.slice(0, 2)) {
          list.push({
            id: `d-${d._id}`,
            text: `Reminder: pay ${d.personName} ${formatMoney(d.amount, user?.currency)}.`,
          });
        }
        if (!cancelled) setNotifs(list.slice(0, 6));
      } catch {
        if (!cancelled) setNotifs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.currency]);

  const [open, setOpen] = useState(false);
  const badge = useMemo(() => notifs.length, [notifs]);

  return (
    <header className={`sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-4 ${bar}`}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenu}
          className={`lg:hidden p-2 rounded-xl border shadow-sm ${iconBtn}`}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="min-w-0">
          <p className={`text-xs uppercase tracking-widest font-semibold ${sub}`}>
            Welcome back
          </p>
          <p className={`font-display font-semibold text-lg truncate ${title}`}>
            {user?.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`relative p-2.5 rounded-xl border shadow-sm transition ${iconBtn}`}
            aria-label="Notifications"
          >
            🔔
            {badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-accent-rose text-white text-[10px] font-bold flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
          {open && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close"
                onClick={() => setOpen(false)}
              />
              <div className={`absolute right-0 mt-2 w-80 max-h-72 overflow-auto z-50 p-2 rounded-xl ${dropPanel}`}>
                {notifs.length === 0 ? (
                  <p className={`text-sm px-2 py-4 text-center ${sub}`}>No alerts</p>
                ) : (
                  notifs.map((n) => (
                    <p
                      key={n.id}
                      className={
                        dark
                          ? "text-sm px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-100"
                          : "text-sm px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-800"
                      }
                    >
                      {n.text}
                    </p>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        <Link
          to="/settings"
          className={`hidden sm:inline-flex text-sm px-4 py-2 rounded-xl border shadow-sm font-medium no-underline ${iconBtn}`}
        >
          Profile
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            toast.success("Signed out");
          }}
          className={`text-sm px-4 py-2 rounded-xl border shadow-sm font-medium ${iconBtn}`}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
