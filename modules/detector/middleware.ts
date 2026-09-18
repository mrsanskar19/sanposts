import type {
  ErrorInput,
  RequestContext,
} from "./types";

export function createErrorMiddleware(
  onError: (input: ErrorInput) => void | Promise<unknown>
) {
  return async function execute<T>(
    handler: () => Promise<T> | T,
    request?: RequestContext
  ): Promise<T> {
    try {
      return await handler();
    } catch (error) {
      try {
        const result = onError({
          error,
          request,
          source: "request",
          runtime: "backend",
          severity: "high",
        });
        if (result && typeof (result as Promise<unknown>).catch === "function") {
          (result as Promise<unknown>).catch(() => {});
        }
      } catch {
        // Never allow monitoring failure to interfere with error propagation
      }

      throw error;
    }
  };
}