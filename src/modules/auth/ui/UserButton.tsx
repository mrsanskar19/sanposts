"use client";

import React, { useState, useRef, useEffect } from "react";
import { User, LogOut, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";

export interface UserButtonProps {
  className?: string;
  showName?: boolean;
}

export function UserButton({ className = "", showName = true }: UserButtonProps) {
  const { user, isAuthenticated, logout } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return null;
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {initials}
          </div>
        )}

        {showName && (
          <>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hidden sm:inline">
              {user.name || user.email}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 animate-in fade-in duration-150">
          <div className="p-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
              {user.name}
            </div>
            <div className="text-[11px] font-mono text-zinc-500 truncate">{user.email}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[10px]">
                {user.role}
              </span>
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                  <AlertCircle className="w-3 h-3" /> Unverified
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors font-medium text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
