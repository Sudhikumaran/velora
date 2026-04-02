import { useLayoutEffect } from "react";
import { useThemeStore } from "../store/themeStore.js";

export default function ThemeSync() {
  const mode = useThemeStore((s) => s.mode);
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.style.colorScheme = mode === "dark" ? "dark" : "light";
  }, [mode]);
  return null;
}
