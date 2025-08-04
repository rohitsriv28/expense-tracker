import { useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  signOut,
  getRedirectResult,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result on app load
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect result error:", error);
    });

    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      // Try popup first (works better in development)
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Fallback to redirect if popup fails
      if (
        error.code === "auth/popup-blocked" ||
        error.code === "auth/popup-closed-by-user"
      ) {
        console.log("Popup blocked, using redirect method");
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, loading, loginWithGoogle, logout };
};
