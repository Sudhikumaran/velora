import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) {
      toast.error("Missing token in URL");
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword({ token, password });
      toast.success("Password updated");
      nav("/login", { replace: true });
    } catch (err) {
      toast.error(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8"
      >
        <h1 className="font-display text-2xl font-semibold mb-1 text-slate-900 dark:text-slate-50">
          New password
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
          Choose a new password for your account.
        </p>
        {!token && (
          <p className="text-sm text-accent-rose mb-4">
            Invalid link. Request a new reset from the forgot-password page.
          </p>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">New password (min 6)</label>
            <input
              className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-accent-sky/90 to-accent-violet/90 text-white shadow-lg disabled:opacity-50"
          >
            {loading ? "Saving…" : "Update password"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          <Link className="text-accent-sky hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
