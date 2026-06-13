import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { useState, useEffect } from "react";
import InstallPrompt from "./components/layout/InstallPrompt";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import useOfflineStatus from "./hooks/useOfflineStatus";
import ErrorFallback from "./components/shared/ErrorFallback";
import NetworkStatusManager from "./components/shared/NetworkStatusManager";
import NotFoundPage from "./components/layout/NotFoundPage";

import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AlertProvider } from "./contexts/AlertContext";
import {
  processSyncQueue,
  evictStaleCacheEntries,
  resetStuckQueueItems,
  getFailedQueueItems,
  retryFailedItems,
  clearFailedItems,
  processRefreshQueue,
} from "./services/offlineSync";
import type { QueuedRequest } from "./services/offlineSync";
import apiClient from "./services/apiClient";
import FailedSyncModal from "./components/shared/FailedSyncModal";
import { Analytics } from "@vercel/analytics/react";

function App() {
  const isOffline = useOfflineStatus();
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  // Track previous offline status to detect changes
  // Initialize with current status to prevent toast on load
  const [wasOffline, setWasOffline] = useState(isOffline);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedItems, setFailedItems] = useState<QueuedRequest[]>([]);

  useEffect(() => {
    // Only show toast when status actually changes from previous state
    if (isOffline !== wasOffline) {
      setShowNetworkToast(true);
      setWasOffline(isOffline);

      if (!isOffline && wasOffline) {
        setTimeout(() => {
          resetStuckQueueItems().then(() => {
            processSyncQueue(apiClient).then((summary) => {
              if (summary && summary.failed > 0) {
                setFailedItems(summary.failedItems);
                setShowFailedModal(true);
              }
              // After sync queue, refresh stale cached GETs
              processRefreshQueue((url) => apiClient.get(url));
            });
          });
        }, 3000);
      }

      // Auto-dismiss toast after 3 seconds
      const timer = setTimeout(() => {
        setShowNetworkToast(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  useEffect(() => {
    // Run cache eviction once per session
    evictStaleCacheEntries();

    // Check for existing failed items on mount if online
    if (!isOffline) {
      getFailedQueueItems().then((items) => {
        if (items && items.length > 0) {
          setFailedItems(items);
          setShowFailedModal(true);
        }
      });
    }
  }, [isOffline]);

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
        <AuthProvider>
          <AlertProvider>
            <div className="min-h-[100dvh] bg-gray-100 dark:bg-slate-900 relative transition-colors duration-300">
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

              {/* Failed Sync Modal */}
              <FailedSyncModal
                isOpen={showFailedModal}
                onClose={() => setShowFailedModal(false)}
                failedItems={failedItems}
                onRetry={async () => {
                  await retryFailedItems();
                  processSyncQueue(apiClient).then((summary) => {
                    if (summary && summary.failed > 0) {
                      setFailedItems(summary.failedItems);
                      setShowFailedModal(true);
                    }
                  });
                }}
                onDiscard={clearFailedItems}
              />

              {/* PWA Install Prompt */}
              <InstallPrompt />

              {/* Vercel Analytics */}
              <Analytics />
            </div>
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
