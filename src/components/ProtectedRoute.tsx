import { Navigate } from "react-router-dom";
import { useAuth } from "../services/authService";
import { Loader2, Shield, Wifi, WifiOff } from "lucide-react";
import type { ReactElement } from "react";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactElement;
  fallback?: ReactElement;
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="ml-3">
                  <div className="h-6 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-8 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="space-y-6">
            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>

            {/* Form skeleton */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    <div className="w-full h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
              <div className="w-32 h-12 bg-gray-200 rounded-lg"></div>
            </div>

            {/* List skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-md p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="w-48 h-5 bg-gray-200 rounded"></div>
                    </div>
                    <div className="text-right">
                      <div className="w-20 h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="w-16 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced loading component with connection status
function LoadingScreen() {
  const [dots, setDots] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Loading animation */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto">
            <Shield className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Loading text */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Securing your session{dots}
        </h2>
        <p className="text-gray-600 mb-6">
          Please wait while we verify your credentials
        </p>

        {/* Animated loader */}
        <div className="flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>

        {/* Connection status */}
        <div className="flex items-center justify-center space-x-2 text-sm">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-amber-500" />
              <span className="text-amber-600 font-medium">Connecting...</span>
            </>
          )}
        </div>

        <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
          <div className="bg-red-600 h-2 rounded-full animate-pulse w-2/3"></div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    // Show skeleton after 2 seconds of loading for better UX
    const timer = setTimeout(() => {
      if (loading) {
        setShowSkeleton(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading]);

  // Show custom fallback if provided
  if (loading && fallback) {
    return fallback;
  }

  // Show loading screen initially, then skeleton if taking too long
  if (loading) {
    return showSkeleton ? <LoadingSkeleton /> : <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return children;
}
