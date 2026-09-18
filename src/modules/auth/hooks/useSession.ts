"use client";

import { useAuthContext } from "../providers/AuthProvider";

export function useSession() {
  const { session, isLoading, isAuthenticated, refresh } = useAuthContext();

  return {
    session,
    isLoading,
    isAuthenticated,
    isValid: Boolean(session && (!session.expiresAt || new Date(session.expiresAt) > new Date())),
    expiresAt: session?.expiresAt ? new Date(session.expiresAt) : null,
    refreshSession: refresh,
  };
}
