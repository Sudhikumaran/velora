import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import ThemeSync from "./components/ThemeSync.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
