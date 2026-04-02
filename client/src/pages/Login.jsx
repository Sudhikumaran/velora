import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { useAuthStore } from "../store/authStore.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/";

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.login({ email, password });
      setAuth(data.token, data.user);
      toast.success("Signed in");
      nav(from, { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed");
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
        <h1 className="font-display text-2xl font-semibold mb-1 text-slate-900">Welcome back</h1>
        <p className="text-slate-600 text-sm mb-8">Sign in to Velaro</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
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
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-accent-sky/90 to-accent-violet/90 text-white shadow-lg disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm mt-3">
          <Link className="text-accent-sky hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-slate-600 mt-6">
          No account?{" "}
          <Link className="text-accent-sky hover:underline" to="/register">
            Register
          </Link>
        </p>
        <p className="text-center text-xs text-slate-500 mt-4">
          Google sign-in can be wired via OAuth callback placeholder on the API.
        </p>
      </motion.div>
    </div>
  );
}
