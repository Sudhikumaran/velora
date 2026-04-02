import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import ThemeSync from "./components/ThemeSync.jsx";
import ClerkTokenBridge from "./components/ClerkTokenBridge.jsx";
import VelaroAuthSync from "./components/VelaroAuthSync.jsx";
import "./index.css";

const clerkPk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

const appTree = (
  <BrowserRouter>
    {clerkPk ? (
      <>
        <ClerkTokenBridge />
        <VelaroAuthSync />
      </>
    ) : null}
    <ThemeSync />
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        className:
          "!bg-white dark:!bg-slate-800 !text-slate-800 dark:!text-slate-100 !border !border-slate-200 dark:!border-slate-600 !shadow-lg",
      }}
    />
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {clerkPk ? <ClerkProvider publishableKey={clerkPk}>{appTree}</ClerkProvider> : appTree}
  </React.StrictMode>
);
