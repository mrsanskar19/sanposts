"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { LogOut, Loader2 } from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";

export interface LogoutButtonProps {
  children?: React.ReactNode;
  redirectTo?: string;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  showIcon?: boolean;
}

export function LogoutButton({
  children = "Sign Out",
  redirectTo,
  className = "",
  variant = "ghost",
  showIcon = true,
}: LogoutButtonProps) {
  const { logout } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout({ redirectTo });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      isDisabled={loading}
      onClick={handleLogout}
      className={`inline-flex items-center gap-2 font-medium ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        showIcon && <LogOut className="w-4 h-4" />
      )}
      <span>{children}</span>
    </Button>
  );
}
