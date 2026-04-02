import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import { useThemeStore } from "../store/themeStore.js";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = useThemeStore((s) => s.mode === "dark");

  const shellLight =
    "border border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_4px_24px_rgba(15,23,42,0.06)] [color-scheme:light]";
  const shellDark =
    "border border-slate-600/90 bg-slate-900 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.35)] [color-scheme:dark]";

  return (
    <div className="min-h-screen flex">
      <motion.aside
        initial={false}
        className={`hidden lg:flex w-64 shrink-0 m-3 mr-0 rounded-2xl border backdrop-blur-xl lg:rounded-2xl lg:m-3 ${dark ? shellDark : shellLight}`}
      >
        <Sidebar />
      </motion.aside>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/30"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className={`absolute left-0 top-0 bottom-0 w-72 rounded-none border-r shadow-xl backdrop-blur-xl ${dark ? shellDark : shellLight}`}
            >
              <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 pt-2 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
