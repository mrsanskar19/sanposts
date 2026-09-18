import type { ErrorInput } from "./types";

type ErrorHandler = (input: ErrorInput) => void;

export function registerProcessHandlers(
  onError: ErrorHandler
): () => void {
  if (typeof process === "undefined" || !process.on) {
    return () => {};
  }

  const uncaughtException = (error: unknown) => {
    try {
      onError({
        error,
        source: "uncaughtException",
        severity: "critical",
      });
    } catch {
      // Never crash during error reporting
    }
  };

  const unhandledRejection = (reason: unknown) => {
    try {
      onError({
        error: reason,
        source: "unhandledRejection",
        severity: "critical",
      });
    } catch {
      // Never crash during error reporting
    }
  };

  process.on("uncaughtException", uncaughtException);
  process.on("unhandledRejection", unhandledRejection);

  return () => {
    try {
      process.off("uncaughtException", uncaughtException);
      process.off("unhandledRejection", unhandledRejection);
    } catch {
      // Safe cleanup
    }
  };
}