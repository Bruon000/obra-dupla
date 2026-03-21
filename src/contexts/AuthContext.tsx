import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  login as apiLogin,
  registerAccount as apiRegister,
  setApiTokenInMemory,
  type AuthUser,
  type RegisterPayload,
} from "@/lib/api";

const STORAGE_TOKEN = "obra_dupla_token";
const STORAGE_USER = "obra_dupla_user";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerAccount: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): { token: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN);
    const userStr = localStorage.getItem(STORAGE_USER);
    const user = userStr ? (JSON.parse(userStr) as AuthUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { token: t, user: u } = loadStored();
    setToken(t);
    setUser(u);
    setApiTokenInMemory(t);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    try {
      localStorage.setItem(STORAGE_TOKEN, data.access_token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));
    } catch {
      // Se localStorage não estiver disponível no APK/ambiente, seguimos com o token em memória.
    }
    setToken(data.access_token);
    setUser(data.user);
    setApiTokenInMemory(data.access_token);
  }, []);

  const registerAccount = useCallback(async (payload: RegisterPayload) => {
    const data = await apiRegister(payload);
    try {
      localStorage.setItem(STORAGE_TOKEN, data.access_token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));
    } catch {
      // ignora
    }
    setToken(data.access_token);
    setUser(data.user);
    setApiTokenInMemory(data.access_token);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
    } catch {
      // Ignora se localStorage não estiver disponível.
    }
    setToken(null);
    setUser(null);
    setApiTokenInMemory(null);
  }, []);

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated: !!token && !!user,
    login,
    registerAccount,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
