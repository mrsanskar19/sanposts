/**
 * URL and Redirect Security Utilities
 */

/**
 * Validates and sanitizes a return/redirect URL.
 * Strictly prevents open redirect vulnerabilities by ensuring the URL is either:
 * 1. A relative path on the same host (e.g. /products?id=123)
 * 2. An absolute URL matching an allowed origin (registered application domain)
 */
export function sanitizeRedirectUrl(
  candidateUrl: string | null | undefined,
  allowedOrigins: string[] = []
): string {
  if (!candidateUrl) return "/";

  const trimmed = candidateUrl.trim();

  // Reject malicious pseudo-protocols
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:")
  ) {
    return "/";
  }

  // Allow relative paths (must begin with / but not // to avoid protocol-relative URLs)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  // Check absolute URLs
  try {
    const parsed = new URL(trimmed);
    const candidateOrigin = parsed.origin.toLowerCase();

    // Check against allowed origins
    const isAllowed = allowedOrigins.some((allowed) => {
      try {
        return new URL(allowed).origin.toLowerCase() === candidateOrigin;
      } catch {
        return false;
      }
    });

    if (isAllowed) {
      return trimmed;
    }
  } catch {}

  // Fallback to safe home path
  return "/";
}

/**
 * Cleans OAuth parameters (code, state, sessionCode, error) from current browser URL
 * using history.replaceState, preserving all application query parameters (e.g. ?q=shoes&page=2).
 */
export function cleanCallbackUrl(): void {
  if (typeof window === "undefined" || !window.history || !window.location) return;

  try {
    const url = new URL(window.location.href);
    let changed = false;

    const sensitiveParams = ["code", "state", "sessionCode", "session_code", "error", "error_description"];
    for (const param of sensitiveParams) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    }

    if (changed) {
      const cleanPath = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, document.title, cleanPath);
    }
  } catch (err) {
    console.error("[cleanCallbackUrl] Error cleaning URL parameters:", err);
  }
}
