import crypto from "node:crypto";

import type {
  DetectorError,
  RequestContext,
  ErrorRuntime,
} from "./types";

function normalizeStack(stack?: string): string {
  if (!stack) {
    return "";
  }

  return stack
    // Normalize file paths with line & column numbers (e.g. at Foo (app/page.tsx:12:34))
    .replace(/:\d+:\d+/g, ":LINE:COLUMN")
    // Normalize memory addresses
    .replace(/\b0x[a-fA-F0-9]+\b/g, "ADDRESS")
    // Normalize UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "UUID")
    // Normalize ObjectIds and hashes (24+ hex digits)
    .replace(/\b[0-9a-f]{24,}\b/gi, "HASH")
    // Normalize timestamps
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/gi, "TIMESTAMP")
    // Normalize numbers with 4 or more digits
    .replace(/\b\d{4,}\b/g, "NUM")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMessage(message: string): string {
  if (!message) return "";

  return message
    // Redact tokens, secrets, Bearer values
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    // Redact UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "UUID")
    // Redact ObjectIds / hashes
    .replace(/\b[0-9a-f]{24,}\b/gi, "HASH")
    // Redact memory addresses
    .replace(/\b0x[a-fA-F0-9]+\b/g, "ADDRESS")
    // Redact URLs
    .replace(/https?:\/\/[^\s]+/gi, "URL")
    // Normalize large numbers
    .replace(/\b\d{4,}\b/g, "NUM")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export function createFingerprint(
  error: DetectorError,
  request?: RequestContext,
  runtime: ErrorRuntime = "backend"
): string {
  const normMessage = normalizeMessage(error.message);
  const normStack = normalizeStack(error.stack);
  const method = request?.method ? request.method.toUpperCase() : "";
  const path = request?.path || (request?.url ? new URL(request.url, "http://localhost").pathname : "");

  const parts = [
    runtime,
    error.name || "Error",
    normMessage,
    normStack,
    method,
    path,
  ];

  const payload = parts.join("|");

  return crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex");
}