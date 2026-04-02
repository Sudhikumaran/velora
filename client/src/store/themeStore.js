import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: "light",
      toggle: () => set({ mode: get().mode === "dark" ? "light" : "dark" }),
      setMode: (mode) => set({ mode: mode === "dark" ? "dark" : "light" }),
    }),
    { name: "velaro-theme" }
  )
);
