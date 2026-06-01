import { useState, useEffect } from "react";
import {
  X,
  Smartphone,
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
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
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
      return;
    }

    if (platform === "ios") {
      setShowIOSInstructions(true);
      return;
    }

    setIsInstalling(true);
    try {
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          setIsVisible(false);
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
    setTimeout(
      () => {
        const dismissedTime = safeLocalStorageGet("install-prompt-dismissed");
        if (
          !dismissedTime ||
          Date.now() - parseInt(dismissedTime) > 24 * 60 * 60 * 1000
        ) {
          if (deferredPrompt || platform === "ios") {
            setIsVisible(true);
          }
        }
      },
      10 * 60 * 1000,
    );
  };

  // Don't show if already installed or not ready
  if (isStandalone || !isVisible || !hasUserInteracted) {
    return null;
  }

  // iOS Instructions Modal - Native iOS Sheet Style
  if (showIOSInstructions) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4"
        style={{ background: "rgba(0, 0, 0, 0.6)" }}
      >
        <div
          className="w-full max-w-[400px] rounded-2xl overflow-hidden animate-slide-up shadow-2xl border border-white/5"
          style={{ background: "#2C2C2E" }}
        >
          {/* iOS Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D32F2F] rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">₹</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-[15px] leading-tight">
                  Install CashFlow
                </h3>
                <p className="text-gray-400 text-[13px]">
                  Add to your home screen
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* iOS Instructions */}
          <div className="p-5 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center">
                  <Share className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white leading-snug">
                  1. Tap the Share button
                </p>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  The <Share className="inline w-3 h-3 text-[#007AFF] mx-0.5" />{" "}
                  icon at the bottom of Safari
                </p>
              </div>
            </div>
            <div className="w-full h-[1px] bg-white/10"></div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 border border-white/20 rounded-lg flex items-center justify-center">
                  <PlusSquare className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white leading-snug">
                  2. Tap "Add to Home Screen"
                </p>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  Scroll down in the share sheet to find it
                </p>
              </div>
            </div>
          </div>

          {/* iOS Action */}
          <div className="p-4 border-t border-white/10 bg-[#333335] flex justify-center">
            <button
              onClick={handleDismiss}
              className="text-[#007AFF] text-[15px] font-semibold hover:opacity-80 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Install Prompt
  return (
    <div
      className={`fixed z-50 animate-slide-up p-4 flex justify-center items-end ${
        platform === "desktop" ? "bottom-4 right-4" : "bottom-0 left-0 right-0"
      }`}
    >
      <div
        className="w-full max-w-[500px] rounded-xl overflow-hidden shadow-2xl border border-white/5"
        style={{ background: "#2C2C2E" }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D32F2F] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">₹</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-[15px] leading-tight">
                CashFlow
              </h3>
              <p className="text-gray-400 text-[13px]">
                {platform === "desktop"
                  ? "Available as a desktop app"
                  : "cashflow-c.web.app"}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {platform === "desktop" ? (
            <div className="mb-5 space-y-3">
              <p className="text-gray-300 text-[14px]">
                Get a faster, focused experience. Pin it to your taskbar and
                open it like any native app.
              </p>
              <div className="flex items-center gap-4 text-[13px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Chrome className="w-4 h-4" /> Chrome
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> Edge
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-5 space-y-3">
              <h4 className="text-gray-300 text-[14px] font-medium flex items-center gap-2">
                <PlusSquare className="w-4 h-4 text-[#4CAF50]" />
                Add to Home screen
              </h4>
              <div className="bg-[#1C1C1E] rounded-lg p-3 flex items-start gap-3 border border-white/5">
                <div className="mt-0.5 text-[#4CAF50]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <p className="text-gray-400 text-[13px] leading-relaxed">
                  Works offline. Access your expenses anywhere — no internet
                  needed after first load.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleLaterDismiss}
              className="px-4 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium text-[14px]"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="px-4 py-2.5 rounded-lg bg-[#D32F2F] text-white hover:bg-[#B71C1C] transition-colors font-medium text-[14px] flex items-center justify-center"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/30 border-t-white mr-2"></div>
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2 opacity-80" />
                  Install
                </>
              )}
            </button>
          </div>

          {!platform && (
            <div className="mt-4 flex justify-center">
              <div className="h-1 w-12 bg-white/10 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
