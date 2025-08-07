import { useState, useEffect } from "react";
import {
  Download,
  X,
  Smartphone,
  Apple,
  Chrome,
  Shield,
  Zap,
  Wifi,
  Star,
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

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
    };

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /ipad|iphone|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isMobile =
        /mobile|tablet|android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
          userAgent
        );

      if (isIOS) setPlatform("ios");
      else if (isAndroid) setPlatform("android");
      else if (!isMobile) setPlatform("desktop");
      else setPlatform("unknown");
    };

    checkStandalone();
    detectPlatform();

    // Listen for beforeinstallprompt event (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);

      // Show prompt after a delay to avoid being intrusive
      setTimeout(() => {
        if (!isStandalone) {
          setIsVisible(true);
        }
      }, 3000);
    };

    // For iOS devices, show manual instructions after some interaction
    const handleIOSCheck = () => {
      if (platform === "ios" && !isStandalone) {
        // Check if user has been on the site for a while (indicating engagement)
        setTimeout(() => {
          const hasShownBefore = localStorage.getItem(
            "ios-install-prompt-shown"
          );
          if (!hasShownBefore) {
            setIsVisible(true);
            localStorage.setItem("ios-install-prompt-shown", "true");
          }
        }, 5000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, we need to rely on time-based or interaction-based triggers
    if (platform === "ios") {
      handleIOSCheck();
    }

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [platform, isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt && platform !== "ios") return;

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
          // Track successful installation
          console.log("PWA installation accepted");
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

    // Don't show again for a while
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  const handleLaterDismiss = () => {
    setIsVisible(false);
    // Show again after some time
    setTimeout(() => {
      const dismissedTime = localStorage.getItem("install-prompt-dismissed");
      if (
        !dismissedTime ||
        Date.now() - parseInt(dismissedTime) > 24 * 60 * 60 * 1000
      ) {
        setIsVisible(true);
      }
    }, 10 * 60 * 1000); // Show again in 10 minutes
  };

  // Don't show if already installed
  if (isStandalone || !isVisible) return null;

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full animate-scale-up">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    Install on iOS
                  </h3>
                  <p className="text-blue-100 text-sm">Add to Home Screen</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <p className="text-sm text-blue-800">
                  Tap the <strong>Share</strong> button in Safari
                </p>
              </div>

              <div className="flex items-center p-3 bg-green-50 rounded-xl">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <p className="text-sm text-green-800">
                  Scroll and tap <strong>"Add to Home Screen"</strong>
                </p>
              </div>

              <div className="flex items-center p-3 bg-purple-50 rounded-xl">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <p className="text-sm text-purple-800">
                  Tap <strong>"Add"</strong> to install
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Install Prompt
  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-50 animate-slide-up">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-pink-400/20" />
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                {platform === "ios" ? (
                  <Apple className="w-6 h-6 text-white" />
                ) : platform === "android" ? (
                  <Smartphone className="w-6 h-6 text-white" />
                ) : (
                  <Chrome className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-white font-bold text-xl tracking-tight">
                  Install CashFlow
                </h3>
                <p className="text-indigo-100 text-sm font-medium">
                  Get the full app experience
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-all group"
            >
              <X className="w-4 h-4 text-white group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Wifi className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Works Offline</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Lightning Fast
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Secure & Private
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-yellow-400 fill-current"
                />
              ))}
              <span className="ml-2 text-sm font-semibold text-gray-700">
                5.0
              </span>
            </div>
            <p className="text-xs text-center text-gray-600 leading-relaxed">
              "Best expense tracker I've ever used! The offline feature is a
              game-changer."
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleLaterDismiss}
              className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all font-semibold text-sm hover:scale-105 active:scale-95"
            >
              Maybe Later
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold text-sm flex items-center justify-center disabled:opacity-50 hover:scale-105 active:scale-95 shadow-lg"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install Now
                </>
              )}
            </button>
          </div>

          {/* Platform-specific note */}
          <p className="text-xs text-center text-gray-500 mt-4">
            {platform === "ios" && "For iPhone/iPad users"}
            {platform === "android" && "For Android users"}
            {platform === "desktop" && "For desktop users"}
            {platform === "unknown" && "Works on all devices"}
          </p>
        </div>
      </div>
    </div>
  );
}
