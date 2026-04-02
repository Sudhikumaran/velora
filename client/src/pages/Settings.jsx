import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserProfile } from "@clerk/clerk-react";
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
  const [name, setName] = useState(user?.name || "");
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  async function saveName(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === user?.name) return;
    setNameSaving(true);
    try {
      const u = await api.user.patchMe({ name: trimmed });
      updateUser(u);
      toast.success("Name updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setNameSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      await api.user.changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast.success("Password updated");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Profile & settings</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Display name, currency, appearance, Clerk account security, and data export.
        </p>
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
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="text-slate-500 dark:text-slate-500">Email:</span> {user?.email}
        </p>
        <form onSubmit={saveName} className="space-y-2">
          <label className="text-xs text-slate-500 block">Display name</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <button
              type="submit"
              disabled={nameSaving || !name.trim() || name.trim() === user?.name}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {nameSaving ? "Saving…" : "Save name"}
            </button>
          </div>
        </form>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Display currency</label>
          <select
            className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
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
        transition={{ delay: 0.05 }}
        className="glass-panel p-6 space-y-4"
      >
        <h2 className="font-medium">Account & security</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Email, password, sessions, and social logins are managed by Clerk. You can also use the
          avatar menu in the top bar.
        </p>
        <div className="flex justify-center overflow-x-auto">
          <UserProfile routing="hash" appearance={{ elements: { rootBox: "w-full max-w-full" } }} />
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

      <p className="text-center text-sm text-slate-500">
        <Link to="/login" className="text-accent-sky hover:underline">
          Sign-in page
        </Link>
      </p>
    </div>
  );
}
