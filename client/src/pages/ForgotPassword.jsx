import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword({ email: email.trim() });
      toast.success(res.message || "Check your email (or server logs in development).");
    } catch (err) {
      toast.error(err.message || "Request failed");
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
          Reset password
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
          We will email instructions if the account exists. In development, the API prints a reset
          link to the server console.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input
              className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-accent-sky/90 to-accent-violet/90 text-white shadow-lg disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          <Link className="text-accent-sky hover:underline" to="/login">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
