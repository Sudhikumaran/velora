import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { useAuthStore } from "../store/authStore.js";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.register({ name, email, password, currency });
      setAuth(data.token, data.user);
      toast.success("Account created");
      nav("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Registration failed");
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
        <h1 className="font-display text-2xl font-semibold mb-1 text-slate-900">Create account</h1>
        <p className="text-slate-600 text-sm mb-8">Start mapping your money</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name</label>
            <input
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Password</label>
            <input
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Currency</label>
            <select
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-accent-mint/90 to-accent-sky/90 text-surface-950 shadow-lg disabled:opacity-50"
          >
            {loading ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="text-center text-sm mt-3">
          <Link className="text-accent-sky hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-slate-600 mt-4">
          Already have an account?{" "}
          <Link className="text-accent-mint hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
