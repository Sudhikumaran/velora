import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";
import { api } from "../lib/api.js";

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-slate-600 text-sm mt-1">Profile and connect providers.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 space-y-4"
      >
        <h2 className="font-medium">Appearance</h2>
        <label className="flex items-center justify-between gap-4 text-sm text-slate-700 dark:text-slate-200">
          <span>Dark mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={themeMode === "dark"}
            onClick={() => toggleTheme()}
            className={[
              "relative w-11 h-6 rounded-full transition-colors",
              themeMode === "dark" ? "bg-sky-600" : "bg-slate-300 dark:bg-slate-600",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                themeMode === "dark" ? "translate-x-5" : "",
              ].join(" ")}
            />
          </button>
        </label>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="glass-panel p-6 space-y-4"
      >
        <h2 className="font-medium">Profile</h2>
        <p className="text-sm text-slate-600">
          <span className="text-slate-500">Name:</span> {user?.name}
        </p>
        <p className="text-sm text-slate-600">
          <span className="text-slate-500">Email:</span> {user?.email}
        </p>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Display currency</label>
          <select
            className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm"
            value={user?.currency || "INR"}
            onChange={async (e) => {
              const currency = e.target.value;
              updateUser({ currency });
              try {
                const u = await api.user.patchMe({ currency });
                updateUser(u);
                toast.success("Currency saved");
              } catch (err) {
                toast.error(err.message);
              }
            }}
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="glass-panel p-6 space-y-3"
      >
        <h2 className="font-medium">Data export</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Download a JSON snapshot of your accounts, transactions, budgets, and more.
        </p>
        <button
          type="button"
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm shadow-sm"
          onClick={async () => {
            try {
              const data = await api.user.exportData();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `velaro-export-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
              toast.success("Export downloaded");
            } catch (e) {
              toast.error(e.message);
            }
          }}
        >
          Download JSON export
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09 }}
        className="glass-panel p-6 space-y-3"
      >
        <h2 className="font-medium">Google sign-in</h2>
        <p className="text-sm text-slate-600">
          OAuth structure is ready on the API at{" "}
          <code className="text-xs bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-800">POST /api/auth/google-placeholder</code>
          . Replace with Passport or Google Identity Services and store googleId on User.
        </p>
        <button
          type="button"
          onClick={() => toast("Google OAuth not configured")}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 opacity-70 cursor-not-allowed"
          disabled
        >
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}
