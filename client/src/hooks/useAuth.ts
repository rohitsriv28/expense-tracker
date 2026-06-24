import { createContext, useContext } from "react";

export interface User {
  _id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  settings?: {
    theme: "light" | "dark" | "system";
    currency: string;
    dataRetentionMonths: number;
  };
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
