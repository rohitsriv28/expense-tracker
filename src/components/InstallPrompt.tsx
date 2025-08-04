import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsVisible(false);
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
      <div className="flex items-center">
        <span className="mr-4">
          Install ExpenseTracker for better experience?
        </span>
        <div className="flex">
          <button
            onClick={() => setIsVisible(false)}
            className="mr-2 px-3 py-1 bg-transparent border border-white rounded"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-1 bg-white text-indigo-600 rounded font-medium"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
