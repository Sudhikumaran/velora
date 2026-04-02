import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useThemeStore } from "../store/themeStore.js";

const links = [
  { to: "/", label: "Dashboard", icon: "◆" },
  { to: "/transactions", label: "Transactions", icon: "≡" },
  { to: "/accounts", label: "Accounts", icon: "◇" },
  { to: "/income", label: "Income", icon: "↑" },
  { to: "/debts", label: "Debts", icon: "↔" },
  { to: "/budgets", label: "Budgets", icon: "▤" },
  { to: "/analytics", label: "Analytics", icon: "◈" },
  { to: "/investments", label: "Investments", icon: "📈" },
  { to: "/subscriptions", label: "Subscriptions", icon: "↻" },
  { to: "/goals", label: "Goals", icon: "◎" },
  { to: "/calendar", label: "Calendar", icon: "▦" },
  { to: "/settings", label: "Profile & settings", icon: "👤" },
];

export default function Sidebar({ mobile, onNavigate }) {
  const dark = useThemeStore((s) => s.mode === "dark");

  return (
    <aside className="flex flex-col h-full">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3">
          <div
            className={
              dark
                ? "h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-900/50 to-sky-900/50 border border-slate-600 flex items-center justify-center text-lg font-display font-bold text-emerald-300"
                : "h-10 w-10 rounded-xl bg-gradient-to-br from-accent-mint/25 to-accent-sky/25 border border-slate-300 flex items-center justify-center text-lg font-display font-bold text-emerald-800"
            }
          >
            V
          </div>
          <div>
            <p
              className={
                dark
                  ? "font-display font-semibold text-lg tracking-tight text-white"
                  : "font-display font-semibold text-lg tracking-tight text-slate-950"
              }
            >
              Velaro
            </p>
            <p
              className={
                dark
                  ? "text-xs font-medium text-slate-300"
                  : "text-xs font-medium text-slate-700"
              }
            >
              Personal finance
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {links.map((l, i) => (
          <motion.div
            key={l.to}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <NavLink
              to={l.to}
              end={l.to === "/"}
              onClick={() => mobile && onNavigate?.()}
              className={({ isActive }) => {
                const base =
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors no-underline visited:no-underline";
                if (isActive) {
                  return dark
                    ? `${base} bg-sky-600 text-white shadow-sm border border-sky-500`
                    : `${base} bg-sky-600 text-white shadow-sm border border-sky-500`;
                }
                return dark
                  ? `${base} text-white/95 visited:text-white/95 hover:text-white hover:bg-slate-700/90 border border-transparent`
                  : `${base} text-slate-900 visited:text-slate-900 hover:text-slate-950 hover:bg-slate-200/90 border border-transparent`;
              }}
            >
              <span className="w-6 text-center text-base">{l.icon}</span>
              {l.label}
            </NavLink>
          </motion.div>
        ))}
      </nav>
    </aside>
  );
}
