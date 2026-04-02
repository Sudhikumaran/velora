import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

export default function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const loc = useLocation();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 dark:text-slate-300">
        Loading…
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
