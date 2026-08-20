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
  AUTH_EXPIRED_EVENT,
  getStoredSession,
  removeStoredSession,
  restoreStoredSession,
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
    let active = true;

    async function initializeSession() {
      const restored = await restoreStoredSession();
      if (!active) return;

      setSession(restored);
      setReady(true);
    }

    function handleAuthExpired() {
      setSession(null);
      setReady(true);
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    void initializeSession();

    return () => {
      active = false;
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const saveSession = useCallback((nextSession: AuthSession) => {
    storeSession(nextSession);
    setSession(nextSession);
    setReady(true);
  }, []);

  const clearSession = useCallback(() => {
    removeStoredSession();
    setSession(null);
    setReady(true);
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
