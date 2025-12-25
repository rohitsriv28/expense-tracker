import { CheckCircle, WifiOff } from "lucide-react";
import { useEffect } from "react";

interface NetworkStatusToastProps {
  isOnline: boolean;
  onDismiss: () => void;
}

// Network Status Toast Component
function NetworkStatusToast({ isOnline, onDismiss }: NetworkStatusToastProps) {
  // Auto-dismiss after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 animate-slide-in-right transform transition-all duration-300 ${
        isOnline ? "bg-green-500" : "bg-red-600"
      } text-white px-4 py-3 rounded-xl shadow-2xl max-w-sm border-2 ${
        isOnline ? "border-green-400" : "border-red-500"
      }`}
    >
      <div className="flex items-center">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
            isOnline ? "bg-green-400" : "bg-red-500"
          }`}
        >
          {isOnline ? (
            <CheckCircle className="w-5 h-5 text-white" />
          ) : (
            <WifiOff className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">
            {isOnline ? "Back Online!" : "You're Offline"}
          </p>
          <p className="text-xs opacity-90">
            {isOnline
              ? "All features are now available"
              : "Changes will sync when reconnected"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Persistent Offline Banner
function OfflineBanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-3 z-40 shadow-2xl border-t-2 border-red-600">
      <div className="container mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <WifiOff className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          </div>
          <span className="text-sm font-medium">Offline Mode</span>
          <span className="hidden sm:inline text-sm opacity-90">
            - Changes will sync automatically when you're back online
          </span>
        </div>
      </div>
    </div>
  );
}

interface NetworkStatusManagerProps {
  isOffline: boolean;
  showToast: boolean;
  onDismissToast: () => void;
}

export default function NetworkStatusManager({
  isOffline,
  showToast,
  onDismissToast,
}: NetworkStatusManagerProps) {
  return (
    <>
      {/* Toast Notification - auto-dismisses after 2 seconds */}
      {showToast && (
        <NetworkStatusToast isOnline={!isOffline} onDismiss={onDismissToast} />
      )}

      {/* Persistent Offline Banner */}
      {isOffline && <OfflineBanner />}
    </>
  );
}
