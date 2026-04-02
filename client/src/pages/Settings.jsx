import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const nav = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

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
          Your account, appearance, password, and data export.
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
        <h2 className="font-medium">Password & sign-in</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Change your password here while signed in. If you forgot it, use email reset (needs SMTP on
          the server for production).
        </p>
        <form onSubmit={changePassword} className="space-y-3 max-w-md">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Current password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Confirm new password</label>
            <input
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {pwSaving ? "Updating…" : "Update password"}
          </button>
        </form>
        <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Prefer a reset link by email?
          </p>
          <button
            type="button"
            className="text-sm text-accent-sky hover:underline"
            onClick={() =>
              nav("/forgot-password", { state: { email: user?.email || "" } })
            }
          >
            Open forgot-password (uses your account email)
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          After resetting via email, use the link on the reset page. Your current session stays valid
          until you sign out.
        </p>
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
        transition={{ delay: 0.08 }}
        className="glass-panel p-6 space-y-3"
      >
        <h2 className="font-medium">Google sign-in</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          OAuth structure is ready on the API at{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200">
            POST /api/auth/google-placeholder
          </code>
          . Replace with Passport or Google Identity Services and store googleId on User.
        </p>
        <button
          type="button"
          onClick={() => toast("Google OAuth not configured")}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-500 opacity-70 cursor-not-allowed"
          disabled
        >
          Continue with Google
        </button>
      </motion.div>

      <p className="text-center text-sm text-slate-500">
        <Link to="/login" className="text-accent-sky hover:underline">
          Sign-in page
        </Link>{" "}
        ·{" "}
        <Link to="/forgot-password" className="text-accent-sky hover:underline" state={{ email: user?.email }}>
          Forgot password
        </Link>
      </p>
    </div>
  );
}
