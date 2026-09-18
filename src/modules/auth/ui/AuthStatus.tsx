"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";

export interface AuthStatusProps {
  className?: string;
  showEmail?: boolean;
}

export function AuthStatus({ className = "", showEmail = true }: AuthStatusProps) {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[11px] font-medium ${className}`}
      >
        <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
        <span>Checking...</span>
      </span>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium ${className}`}
      >
        <ShieldAlert className="w-3 h-3 text-zinc-400" />
        <span>Unauthenticated</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium ${className}`}
    >
      <ShieldCheck className="w-3 h-3 text-emerald-500" />
      <span>{showEmail ? user.email : "Signed In"}</span>
    </span>
  );
}
