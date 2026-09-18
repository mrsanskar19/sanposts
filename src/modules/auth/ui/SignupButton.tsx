"use client";

import React from "react";
import { Button } from "@heroui/react";
import { UserPlus } from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";
import { SignupOptions } from "../types";

export interface SignupButtonProps {
  children?: React.ReactNode;
  options?: SignupOptions;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  showIcon?: boolean;
}

export function SignupButton({
  children = "Create Account",
  options,
  className = "",
  variant = "outline",
  showIcon = true,
}: SignupButtonProps) {
  const { signup, isLoading } = useAuthContext();

  return (
    <Button
      variant={variant}
      isDisabled={isLoading}
      onClick={() => signup(options)}
      className={`inline-flex items-center gap-2 font-medium ${className}`}
    >
      {showIcon && <UserPlus className="w-4 h-4" />}
      <span>{children}</span>
    </Button>
  );
}
