import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { AuthContext, type User } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import type { ReactNode } from "react";
import apiClient, { setAccessToken } from "../services/apiClient";

import {
  pullFrequencyMapFromServer,
  pushFrequencyMapToServer,
} from "../utils/smartDefaults";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await apiClient.post("/auth/refresh");
        setAccessToken(data.data.accessToken);
        const meRes = await apiClient.get("/auth/me");
        const userData = meRes.data.data;
        setUser(userData);
        if (userData?.settings?.theme) {
          setTheme(userData.settings.theme);
        }
        await pullFrequencyMapFromServer();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [setTheme]);

  const loginWithToken = useCallback(async (token: string) => {
    const { data } = await apiClient.post("/auth/google", { idToken: token });
    setAccessToken(data.data.accessToken);
    const userData = data.data.user;
    setUser(userData);
    if (userData?.settings?.theme) {
      setTheme(userData.settings.theme);
    }
    await pullFrequencyMapFromServer();
  }, [setTheme]);

  const logout = useCallback(async () => {
    try {
      await Promise.race([
        pushFrequencyMapToServer(),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      await apiClient.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const contextValue = useMemo(
    () => ({ user, loading, loginWithToken, logout }),
    [user, loading, loginWithToken, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

