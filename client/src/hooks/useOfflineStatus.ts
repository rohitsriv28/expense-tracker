import { useState, useEffect } from "react";

export default function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Confirmed: Handlers are defined as named consts inside useEffect,
  // cleanup function removes both, and dependency array is empty [].
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}
