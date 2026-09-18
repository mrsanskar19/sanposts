"use client";

import React from "react";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@heroui/react";
import { useAuthContext } from "../providers/AuthProvider";

export interface SessionStatusProps {
  className?: string;
}

export function SessionStatus({ className = "" }: SessionStatusProps) {
  const { session, isAuthenticated, refresh } = useAuthContext();
  const [refreshing, setRefreshing] = React.useState(false);

  if (!isAuthenticated || !session) {
    return null;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const expiresStr = session.expiresAt
    ? new Date(session.expiresAt).toLocaleTimeString()
    : "Active";

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-blue-500" />
      <span>Session valid until {expiresStr}</span>
      <Button
        variant="ghost"
        onClick={handleRefresh}
        isDisabled={refreshing}
        className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
