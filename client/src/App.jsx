import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
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

function ClerkMissing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <p className="text-slate-600 dark:text-slate-300 max-w-md">
        Set <code className="text-sm bg-slate-100 dark:bg-slate-800 px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> in{" "}
        <code className="text-sm">client/.env</code> (from Clerk Dashboard → API Keys).
      </p>
    </div>
  );
}

function AppRoutes() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 dark:text-slate-300">
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isSignedIn ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isSignedIn ? <Navigate to="/" replace /> : <Register />} />
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

export default function App() {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return <ClerkMissing />;
  }
  return <AppRoutes />;
}
