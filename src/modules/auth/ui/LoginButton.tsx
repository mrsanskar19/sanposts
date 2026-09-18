"use client";

import React from "react";
import { Button } from "@heroui/react";
import { LogIn } from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";
import { LoginOptions } from "../types";

export interface LoginButtonProps {
  children?: React.ReactNode;
  options?: LoginOptions;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  showIcon?: boolean;
}

export function LoginButton({
  children = "Sign In",
  options,
  className = "",
  variant = "primary",
  showIcon = true,
}: LoginButtonProps) {
  const { login, isLoading } = useAuthContext();

  return (
    <Button
      variant={variant}
      isDisabled={isLoading}
      onClick={() => login(options)}
      className={`inline-flex items-center gap-2 font-medium ${
        variant === "primary" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
      } ${className}`}
    >
      {showIcon && <LogIn className="w-4 h-4" />}
      <span>{children}</span>
    </Button>
  );
}
