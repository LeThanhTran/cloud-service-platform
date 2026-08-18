"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getStoredSession,
  removeStoredSession,
  storeSession,
} from "@/lib/api";
import type { AuthSession } from "@/types/auth";

type AuthContextValue = {
  session: AuthSession | null;
  ready: boolean;
  saveSession: (session: AuthSession) => void;
  clearSession: () => void;
  reloadSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  const reloadSession = useCallback(() => {
    setSession(getStoredSession());
  }, []);

  useEffect(() => {
    reloadSession();
    setReady(true);
  }, [reloadSession]);

  const saveSession = useCallback((nextSession: AuthSession) => {
    storeSession(nextSession);
    setSession(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    removeStoredSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, saveSession, clearSession, reloadSession }),
    [session, ready, saveSession, clearSession, reloadSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider.");
  }

  return context;
}
