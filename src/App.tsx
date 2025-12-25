import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { useState, useEffect } from "react";
import InstallPrompt from "./components/InstallPrompt";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import useOfflineStatus from "./hooks/useOfflineStatus";
import ErrorFallback from "./components/ErrorFallback";
import NetworkStatusManager from "./components/NetworkStatusManager";
import NotFoundPage from "./components/NotFoundPage";

import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const isOffline = useOfflineStatus();
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  // Track previous offline status to detect changes
  // Initialize with current status to prevent toast on load
  const [wasOffline, setWasOffline] = useState(isOffline);

  // Handle network status changes
  useEffect(() => {
    // Only show toast when status actually changes from previous state
    if (isOffline !== wasOffline) {
      setShowNetworkToast(true);
      setWasOffline(isOffline);

      // Auto-dismiss toast after 3 seconds
      const timer = setTimeout(() => {
        setShowNetworkToast(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  // Service Worker registration with enhanced error handling
  useEffect(() => {
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

          if (import.meta.env.DEV) {
            console.log("SW registered successfully:", registration);
          }

          // Handle service worker updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New update available - silent update for now
                  if (import.meta.env.DEV) {
                    console.log("New app version available");
                  }
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
      <ThemeProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900 relative transition-colors duration-300">
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
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
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
