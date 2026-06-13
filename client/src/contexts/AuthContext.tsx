import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import apiClient, { setAccessToken } from "../services/apiClient";

import {
  pullFrequencyMapFromServer,
  pushFrequencyMapToServer,
} from "../utils/smartDefaults";

interface User {
  _id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithToken: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await apiClient.post("/auth/refresh");
        setAccessToken(data.data.accessToken);
        const meRes = await apiClient.get("/auth/me");
        setUser(meRes.data.data);
        await pullFrequencyMapFromServer();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const loginWithToken = useCallback(async (accessToken: string) => {
    const { data } = await apiClient.post("/auth/google", { accessToken });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    await pullFrequencyMapFromServer();
  }, []);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
