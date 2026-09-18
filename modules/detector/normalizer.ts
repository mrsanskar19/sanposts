import type { DetectorError } from "./types";

function safeStringify(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "symbol") {
    return String(value);
  }
  if (typeof value === "bigint") {
    return `${value.toString()}n`;
  }

  try {
    const seen = new WeakSet();
    return JSON.stringify(value, (_key, val) => {
      if (typeof val === "bigint") return val.toString();
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return "[Unserializable Error]";
    }
  }
}

export function normalizeError(
  error: unknown,
  componentStack?: string
): DetectorError {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      stack: error.stack,
      code: typeof (error as Error & { code?: unknown }).code === "string"
        ? (error as Error & { code: string }).code
        : undefined,
      cause: error.cause,
      componentStack,
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
      componentStack,
    };
  }

  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;

    return {
      name: typeof value.name === "string" ? value.name : "Error",
      message:
        typeof value.message === "string"
          ? value.message
          : safeStringify(error),
      stack: typeof value.stack === "string" ? value.stack : undefined,
      code: typeof value.code === "string" ? value.code : undefined,
      cause: value.cause,
      componentStack:
        componentStack ||
        (typeof value.componentStack === "string"
          ? value.componentStack
          : undefined),
    };
  }

  return {
    name: "Error",
    message: safeStringify(error),
    componentStack,
  };
}