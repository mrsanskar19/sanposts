"use client";

import { useEffect } from "react";
import type { BrowserContext, ErrorInput } from "./types";

export interface BrowserDetectorOptions {
  endpoint?: string;
}

export function getBrowserContext(): BrowserContext {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    url: window.location?.href,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    platform: typeof navigator !== "undefined" ? navigator.platform : undefined,
    language: typeof navigator !== "undefined" ? navigator.language : undefined,
    viewport: {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0,
    },
  };
}

export async function sendBrowserError(
  endpoint: string,
  payload: ErrorInput
): Promise<void> {
  if (typeof window === "undefined" || typeof fetch === "undefined") {
    return;
  }

  try {
    const supportsKeepAlive = "keepalive" in new Request("");
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      ...(supportsKeepAlive ? { keepalive: true } : {}),
    });
  } catch {
    // Silently isolate any monitoring or network failure.
    // Never allow the monitoring system to crash or disrupt the user's application.
  }
}

export function BrowserDetector({
  endpoint = "/api/self-healing/errors",
}: BrowserDetectorOptions = {}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleError = (event: ErrorEvent) => {
      const err = event.error;
      const message =
        event.message || (err instanceof Error ? err.message : String(err || "Unknown browser error"));

      void sendBrowserError(endpoint, {
        error: {
          name: err?.name || "Error",
          message,
          stack: err?.stack,
        },
        runtime: "frontend",
        source: "browserError",
        severity: "medium",
        browser: getBrowserContext(),
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const isError = reason instanceof Error;

      void sendBrowserError(endpoint, {
        error: {
          name: isError ? reason.name : "UnhandledRejection",
          message: isError
            ? reason.message
            : typeof reason === "string"
            ? reason
            : JSON.stringify(reason) || "Unhandled promise rejection",
          stack: isError ? reason.stack : undefined,
        },
        runtime: "frontend",
        source: "browserUnhandledRejection",
        severity: "high",
        browser: getBrowserContext(),
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [endpoint]);

  return null;
}