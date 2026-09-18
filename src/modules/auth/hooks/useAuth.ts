"use client";

import { useAuthContext } from "../providers/AuthProvider";

export function useAuth() {
  const { user, session, isLoading, isAuthenticated, login, signup, logout, refresh, client } =
    useAuthContext();

  return {
    client,
    user,
    session,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    refresh,
  };
}
