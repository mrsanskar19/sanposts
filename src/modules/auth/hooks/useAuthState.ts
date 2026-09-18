"use client";

import { useAuthContext } from "../providers/AuthProvider";

export function useAuthState() {
  const { user, session, isLoading, isAuthenticated } = useAuthContext();

  return {
    isAuthenticated,
    isLoading,
    user,
    session,
  };
}
