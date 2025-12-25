import { useState, useEffect } from "react";
import {
  X,
  Smartphone,
  Apple,
  Chrome,
  Share,
  PlusSquare,
  Download,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<
    "ios" | "android" | "desktop" | "unknown"
  >("unknown");
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Safe localStorage access
  const safeLocalStorageGet = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeLocalStorageSet = (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage is not available
    }
  };

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkStandalone = () => {
      interface NavigatorStandalone extends Navigator {
        standalone?: boolean;
      }
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as NavigatorStandalone).standalone ||
        document.referrer.includes("android-app://");
      setIsStandalone(!!isStandaloneMode);
    };

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /ipad|iphone|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isMobile =
        /mobile|tablet|android|webos|iphone|ipad|opera mini/.test(userAgent);

      if (isIOS) setPlatform("ios");
      else if (isAndroid) setPlatform("android");
      else if (!isMobile) setPlatform("desktop");
      else setPlatform("unknown");
    };

    checkStandalone();
    detectPlatform();

    // Track user interaction
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    // Listen for beforeinstallprompt event (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt event fired");
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);

      // Check if prompt was recently dismissed
      const dismissedTime = safeLocalStorageGet("install-prompt-dismissed");
      const shouldSkip =
        dismissedTime &&
        Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000;

      if (!shouldSkip && !isStandalone && hasUserInteracted) {
        // Show prompt after a delay to avoid being intrusive
        setTimeout(() => {
          setIsVisible(true);
        }, 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log("App was installed");
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, [hasUserInteracted, isStandalone]);

  // Handle iOS-specific logic
  useEffect(() => {
    if (platform === "ios" && !isStandalone && hasUserInteracted) {
      const hasShownBefore = safeLocalStorageGet("ios-install-prompt-shown");
      const dismissedTime = safeLocalStorageGet("install-prompt-dismissed");

      const shouldSkip =
        dismissedTime &&
        Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000;

      if (!hasShownBefore && !shouldSkip) {
        // Show iOS prompt after user has interacted and some time has passed
        const timer = setTimeout(() => {
          setIsVisible(true);
          safeLocalStorageSet("ios-install-prompt-shown", "true");
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [platform, isStandalone, hasUserInteracted]);

  const handleInstall = async () => {
    if (!deferredPrompt && platform !== "ios") {
      console.log("No deferred prompt available");
      return;
    }

    if (platform === "ios") {
      setShowIOSInstructions(true);
      return;
    }

    setIsInstalling(true);
    try {
      if (deferredPrompt) {
        console.log("Prompting user to install");
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          console.log("PWA installation accepted");
          setIsVisible(false);
        } else {
          console.log("PWA installation dismissed");
        }
      }
    } catch (error) {
      console.error("Installation failed:", error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSInstructions(false);
    setDeferredPrompt(null);

    // Don't show again for 24 hours
    safeLocalStorageSet("install-prompt-dismissed", Date.now().toString());
  };

  const handleLaterDismiss = () => {
    setIsVisible(false);

    // Show again after 10 minutes if conditions are met
    setTimeout(() => {
      const dismissedTime = safeLocalStorageGet("install-prompt-dismissed");
      if (
        !dismissedTime ||
        Date.now() - parseInt(dismissedTime) > 24 * 60 * 60 * 1000
      ) {
        if (deferredPrompt || platform === "ios") {
          setIsVisible(true);
        }
      }
    }, 10 * 60 * 1000);
  };

  // Don't show if already installed or not ready
  if (isStandalone || !isVisible || !hasUserInteracted) {
    return null;
  }

  // iOS Instructions Modal - Native iOS Sheet Style
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-end md:items-center justify-center animate-fade-in">
        <div className="bg-[#F2F2F2] dark:bg-[#1C1C1E] w-full max-w-sm md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up">
          {/* iOS Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2C2C2E]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-600 rounded-[10px] flex items-center justify-center mr-3 shadow-md">
                <Apple className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-black dark:text-white font-semibold text-[17px] leading-tight">
                  Install CashFlow
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-[13px]">
                  App Store
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* iOS Instructions */}
          <div className="p-6 space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4 mt-1">
                <Share className="w-7 h-7 text-[#007AFF]" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-black dark:text-white leading-snug">
                  1. Tap the <span className="text-[#007AFF]">Share</span>{" "}
                  button
                </p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                  At the bottom of your screen
                </p>
              </div>
            </div>
            <div className="w-full h-[1px] bg-gray-300 dark:bg-gray-700/50"></div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4 mt-1">
                <PlusSquare className="w-7 h-7 text-gray-800 dark:text-gray-200" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-black dark:text-white leading-snug">
                  2. Select{" "}
                  <span className="font-bold">Add to Home Screen</span>
                </p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                  Scroll down to find this option
                </p>
              </div>
            </div>
          </div>

          {/* iOS Action */}
          <div className="p-4 bg-gray-100 dark:bg-[#121212] flex justify-center pb-8 md:pb-4">
            <button
              onClick={handleDismiss}
              className="text-[#007AFF] text-[17px] font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Install Prompt - only show if we have a deferred prompt (Android) or iOS
  if (!deferredPrompt && platform !== "ios") {
    return null;
  }

  return (
    <div
      className={`fixed z-50 animate-slide-up ${
        platform === "desktop"
          ? "bottom-4 right-4 max-w-sm"
          : "bottom-0 left-0 right-0 rounded-t-3xl"
      }`}
    >
      <div
        className={`bg-white dark:bg-slate-900 shadow-[0_-5px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-white/10 overflow-hidden backdrop-blur-md transition-colors duration-300 ${
          platform === "desktop" ? "rounded-3xl" : "rounded-t-3xl"
        }`}
      >
        {/* Header - Native Feel */}
        <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              {platform === "ios" ? (
                <Apple className="w-6 h-6 text-white" />
              ) : platform === "android" ? (
                <Smartphone className="w-6 h-6 text-white" />
              ) : (
                <Chrome className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold text-lg leading-tight">
                Install CashFlow
              </h3>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                {platform === "ios" ? "App Store" : "Google Play Store"}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
            Install the app for the best experience. Access your expenses
            offline, get fast performance, and track your spending securely.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleLaterDismiss}
              className="px-4 py-3.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 rounded-xl transition-all font-semibold text-sm"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="px-4 py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold text-sm flex items-center justify-center shadow-lg shadow-red-500/20"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="h-1 w-32 bg-gray-300 dark:bg-gray-700 rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
