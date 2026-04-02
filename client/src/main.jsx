import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import ThemeSync from "./components/ThemeSync.jsx";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const appTree = (
  <BrowserRouter>
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
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
    ) : (
      appTree
    )}
  </React.StrictMode>
);
