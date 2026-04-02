import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore.js";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Accounts from "./pages/Accounts.jsx";
import Debts from "./pages/Debts.jsx";
import Budgets from "./pages/Budgets.jsx";
import Analytics from "./pages/Analytics.jsx";
import Investments from "./pages/Investments.jsx";
import Subscriptions from "./pages/Subscriptions.jsx";
import Income from "./pages/Income.jsx";
import Settings from "./pages/Settings.jsx";
import Goals from "./pages/Goals.jsx";
import Calendar from "./pages/Calendar.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

export default function App() {
  const token = useAuthStore((s) => s.token);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/forgot-password"
        element={token ? <Navigate to="/" replace /> : <ForgotPassword />}
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/register"
        element={token ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="debts" element={<Debts />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="income" element={<Income />} />
        <Route path="investments" element={<Investments />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="goals" element={<Goals />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
