"use client";

import { useAuthContext } from "../providers/AuthProvider";

export function useUser() {
  const { user, isLoading, isAuthenticated } = useAuthContext();

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
