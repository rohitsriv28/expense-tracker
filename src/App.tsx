import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { useState, useEffect } from "react";
import InstallPrompt from "./components/InstallPrompt";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import useOfflineStatus from "./hooks/useOfflineStatus";
import ErrorFallback from "./components/ErrorFallback";
import NetworkStatusManager from "./components/NetworkStatusManager";
import NotFoundPage from "./components/NotFoundPage";

function App() {
  const isOffline = useOfflineStatus();
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  const [lastOnlineStatus, setLastOnlineStatus] = useState(navigator.onLine);

  // Handle network status changes
  useEffect(() => {
    if (isOffline !== lastOnlineStatus) {
      setShowNetworkToast(true);
      setLastOnlineStatus(isOffline);

      // Auto-dismiss toast after 5 seconds
      const timer = setTimeout(() => {
        setShowNetworkToast(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, lastOnlineStatus]);

  // Service Worker registration with enhanced error handling
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

          console.log("SW registered successfully:", registration);

          // Handle service worker updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New update available
                  console.log("New app version available");
                }
              });
            }
          });
        } catch (error) {
          console.warn("SW registration failed:", error);
        }
      });
    }
  }, []);

  // Performance monitoring
  useEffect(() => {
    // Report Web Vitals if available
    if (typeof window !== "undefined" && "performance" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`${entry.name}`);
        }
      });

      try {
        observer.observe({ entryTypes: ["measure", "navigation"] });
      } catch (error) {
        console.warn("Performance observer not supported:", error);
      }
    }
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Clear any cached data if needed
        window.location.reload();
      }}
      onError={(error, errorInfo) => {
        console.error("Application Error:", error, errorInfo);
        // Here you could send error to logging service like Sentry
        // logErrorToService(error, errorInfo);
      }}
    >
      <div className="min-h-screen bg-gray-100 relative">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>

        {/* Network Status Manager */}
        <NetworkStatusManager
          isOffline={isOffline}
          showToast={showNetworkToast}
          onDismissToast={() => setShowNetworkToast(false)}
        />

        {/* PWA Install Prompt */}
        <InstallPrompt />
      </div>
    </ErrorBoundary>
  );
}

export default App;
