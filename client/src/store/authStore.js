import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Cached Mongo user (currency, name) — session is Clerk; API uses Clerk JWT via clerkToken.js */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
    }),
    { name: "velaro-auth-user", partialize: (s) => ({ user: s.user }) }
  )
);
