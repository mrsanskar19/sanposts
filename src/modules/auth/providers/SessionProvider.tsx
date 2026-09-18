"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useAuthContext } from "./AuthProvider";
import { AuthSession } from "../types";

export interface SessionContextValue {
  session: AuthSession | null;
  isValid: boolean;
  expiresAt: Date | null;
  refreshSession: () => Promise<AuthSession | null>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export interface SessionProviderProps {
  children: React.ReactNode;
  refreshIntervalMs?: number;
}

export function SessionProvider({ children, refreshIntervalMs = 60000 }: SessionProviderProps) {
  const { session, refresh, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refresh().catch(() => {});
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [isAuthenticated, refresh, refreshIntervalMs]);

  const value: SessionContextValue = {
    session,
    isValid: Boolean(session && (!session.expiresAt || new Date(session.expiresAt) > new Date())),
    expiresAt: session?.expiresAt ? new Date(session.expiresAt) : null,
    refreshSession: refresh,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a <SessionProvider>");
  }
  return context;
}
