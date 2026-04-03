import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function clerkPkFrom(src) {
  if (!src || typeof src !== "object") return "";
  const a = String(src.VITE_CLERK_PUBLISHABLE_KEY ?? "").trim();
  const b = String(src.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").trim();
  return a || b;
}

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, __dirname, ["VITE_", "NEXT_PUBLIC_"]);
  const pk =
    clerkPkFrom(loaded) ||
    clerkPkFrom(process.env);

  if (mode === "production" && !pk) {
    console.warn(
      "\n[velaro] Clerk: no VITE_CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY — " +
        "set it on your host (e.g. Vercel env) and redeploy.\n"
    );
  }

  return {
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    define: {
      __VELARO_CLERK_PUBLISHABLE_KEY__: JSON.stringify(pk),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "inline",
        includeAssets: ["favicon.svg"],
        manifest: {
          name: "Velaro",
          short_name: "Velaro",
          start_url: "/",
          display: "standalone",
          background_color: "#f1f5f9",
          theme_color: "#0ea5e9",
          description: "Personal finance dashboard",
          icons: [
            {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          skipWaiting: true,
          clientsClaim: true,
        },
      }),
    ],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
  };
});
