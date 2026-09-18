"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { getBrowserContext, sendBrowserError } from "./browser";

export interface ReactErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  endpoint?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ReactErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ReactErrorBoundary extends Component<
  ReactErrorBoundaryProps,
  ReactErrorBoundaryState
> {
  constructor(props: ReactErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ReactErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const endpoint = this.props.endpoint || "/api/self-healing/errors";

    // Non-blocking, silent dispatch to self-healing errors API
    try {
      void sendBrowserError(endpoint, {
        error: {
          name: error?.name || "ReactRenderError",
          message: error?.message || "An error occurred during React rendering",
          stack: error?.stack,
          componentStack: errorInfo?.componentStack || undefined,
        },
        runtime: "frontend",
        source: "reactBoundary",
        severity: "high",
        browser: getBrowserContext(),
        componentStack: errorInfo?.componentStack || undefined,
      });
    } catch {
      // Silently isolate monitoring errors
    }

    try {
      this.props.onError?.(error, errorInfo);
    } catch {
      // Isolate any user callback errors
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (typeof fallback === "function") {
        if (this.state.error) {
          try {
            return fallback(this.state.error, this.resetError);
          } catch {
            return null;
          }
        }
        return null;
      }

      if (fallback !== undefined) {
        return fallback;
      }

      // No error UI displayed to user; render gracefully without disrupting screen
      return null;
    }

    return this.props.children;
  }
}
