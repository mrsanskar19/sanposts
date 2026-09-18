"use client";

import React, { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  requiredRole?: "USER" | "DEVELOPER" | "ADMIN";
  redirectToLogin?: boolean;
}

export function AuthGuard({
  children,
  fallback,
  loadingFallback,
  requiredRole,
  redirectToLogin = false,
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, login } = useAuthContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && redirectToLogin) {
      login();
    }
  }, [isLoading, isAuthenticated, redirectToLogin, login]);

  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div className="p-8 flex items-center justify-center text-zinc-500 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span>Verifying authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-bold text-sm">Authentication Required</h3>
        <p className="text-xs text-zinc-500">Please sign in to view this protected resource.</p>
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== "ADMIN") {
    return (
      <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="font-bold text-sm text-red-600">Access Restricted</h3>
        <p className="text-xs text-zinc-500">Your account does not hold the required permissions.</p>
      </div>
    );
  }

  return <>{children}</>;
}
