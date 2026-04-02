import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { api } from "../lib/api.js";
import { useAuthStore } from "../store/authStore.js";

export default function VelaroAuthSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const logoutStore = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      logoutStore();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const u = await api.user.me();
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) logoutStore();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, setUser, logoutStore]);

  return null;
}
