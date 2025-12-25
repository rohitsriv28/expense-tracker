import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

declare global {
  interface Window {
    __CASHFLOW_DEBUG__: {
      version: string;
      buildTime: string;
      environment: string;
    };
  }
}

// Performance monitoring
const startTime = performance.now();

// Global error handler for unhandled promises
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // You could send this to your error reporting service
});

// Global error handler for uncaught errors
window.addEventListener("error", (event) => {
  console.error("Uncaught error:", event.error);
  // You could send this to your error reporting service
});

// Check for browser support
const checkBrowserSupport = () => {
  const requiredFeatures = [
    "fetch",
    "Promise",
    "localStorage",
    "sessionStorage",
    "addEventListener",
  ];

  const unsupportedFeatures = requiredFeatures.filter(
    (feature) => !(feature in window)
  );

  if (unsupportedFeatures.length > 0) {
    console.warn("Unsupported browser features:", unsupportedFeatures);
    // You could show a browser upgrade notice here
  }
};

// Initialize performance observer if available
const initPerformanceObserver = () => {
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log performance metrics only in development if needed
          if (entry.entryType === "navigation" && import.meta.env.DEV) {
            // console.log(`Page load time: ${entry.loadEventEnd - entry.loadEventStart}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ["navigation", "paint"] });
    } catch {
      // Silently fail
    }
  }
};

// Initialize app
const initializeApp = () => {
  checkBrowserSupport();
  initPerformanceObserver();

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error(
      'Root element not found. Make sure you have a div with id="root" in your HTML.'
    );
  }

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Log initialization time
  const endTime = performance.now();
  console.log(`App initialized in ${(endTime - startTime).toFixed(2)}ms`);
};

// Handle DOM content loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// Development helpers
if (import.meta.env.DEV) {
  // Add helpful development logs
  console.log("🚀 CashFlow running in development mode");
  console.log("📊 Performance metrics enabled");

  // Add global app info for debugging

  window.__CASHFLOW_DEBUG__ = {
    version: "1.0.0",
    buildTime: new Date().toISOString(),
    environment: import.meta.env.MODE,
  };
}
