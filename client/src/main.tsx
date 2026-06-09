import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    console.log("New content available, please refresh.");
  },
  onOfflineReady() {
    console.log("App is ready to work offline.");
  },
});

declare global {
  interface Window {
    __CASHFLOW_DEBUG__: {
      version: string;
      buildTime: string;
      environment: string;
    };
  }
}

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

window.addEventListener("error", (event) => {
  console.error("Uncaught error:", event.error);
});

const checkBrowserSupport = () => {
  const requiredFeatures = [
    "fetch",
    "Promise",
    "localStorage",
    "sessionStorage",
    "addEventListener",
  ];

  const unsupportedFeatures = requiredFeatures.filter(
    (feature) => !(feature in window),
  );

  if (unsupportedFeatures.length > 0) {
    console.warn("Unsupported browser features:", unsupportedFeatures);
  }
};

const initPerformanceObserver = () => {
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation" && import.meta.env.DEV) {
            void entry;
          }
        }
      });

      observer.observe({ entryTypes: ["navigation", "paint"] });
    } catch {
      // Silently fail.
    }
  }
};

const initializeApp = () => {
  checkBrowserSupport();
  initPerformanceObserver();

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error(
      'Root element not found. Make sure you have a div with id="root" in your HTML.',
    );
  }

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </StrictMode>,
  );
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

if (import.meta.env.DEV) {
  window.__CASHFLOW_DEBUG__ = {
    version: "1.0.0",
    buildTime: new Date().toISOString(),
    environment: import.meta.env.MODE,
  };
}
