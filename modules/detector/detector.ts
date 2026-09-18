import { createFingerprint } from "./fingerprint";
import { normalizeError } from "./normalizer";
import { generateId, now, sanitizeHeaders, sanitizeValue } from "./utils";
import { MemoryStorage } from "./storage";
import { registerProcessHandlers } from "./process";
import type {
  BrowserContext,
  DetectedError,
  DetectorOptions,
  DetectorStorage,
  ErrorInput,
  RequestContext,
  ErrorSeverity,
} from "./types";

export class Detector {
  private readonly options: Required<
    Omit<DetectorOptions, "projectId" | "deploymentId" | "onCapture">
  > & {
    projectId?: string;
    deploymentId?: string;
    onCapture?: (error: DetectedError) => void | Promise<void>;
  };

  private readonly storage: DetectorStorage;
  private cleanupProcessHandlers?: () => void;

  constructor(
    options: DetectorOptions = {},
    storage: DetectorStorage = new MemoryStorage()
  ) {
    this.options = {
      enabled: options.enabled ?? true,
      environment:
        options.environment ?? process.env.NODE_ENV ?? "development",
      projectId: options.projectId ?? process.env.PROJECT_ID,
      deploymentId: options.deploymentId ?? process.env.VERCEL_DEPLOYMENT_ID,
      deduplicationWindowMs: options.deduplicationWindowMs ?? 300000,
      captureRequestBody: options.captureRequestBody ?? false,
      captureHeaders: options.captureHeaders ?? false,
      captureBrowser: options.captureBrowser ?? true,
      onCapture: options.onCapture,
    };

    this.storage = storage;
  }

  start(): void {
    if (!this.options.enabled || this.cleanupProcessHandlers) {
      return;
    }

    this.cleanupProcessHandlers = registerProcessHandlers((input) => {
      void this.capture(input);
    });
  }

  stop(): void {
    this.cleanupProcessHandlers?.();
    this.cleanupProcessHandlers = undefined;
  }

  async capture(input: ErrorInput): Promise<DetectedError | undefined> {
    if (!this.options.enabled) {
      return undefined;
    }

    try {
      const error = normalizeError(input.error, input.componentStack);
      const request = this.sanitizeRequest(input.request);
      const browser = this.sanitizeBrowser(input.browser);
      const runtime = input.runtime ?? "backend";

      const fingerprint = createFingerprint(error, request, runtime);
      const timestamp = now();

      const existing = await this.storage.findByFingerprint(fingerprint);

      if (existing) {
        const lastSeenTime = new Date(existing.lastSeen).getTime();
        const nowTime = new Date(timestamp).getTime();

        if (nowTime - lastSeenTime <= this.options.deduplicationWindowMs) {
          existing.occurrences += 1;
          existing.lastSeen = timestamp;

          if (
            input.severity &&
            this.severityRank(input.severity) > this.severityRank(existing.severity)
          ) {
            existing.severity = input.severity;
          }

          if (!existing.error.componentStack && error.componentStack) {
            existing.error.componentStack = error.componentStack;
          }

          await this.storage.save(existing);
          console.log(`[Self-Healing] 🚨 Error Detected (recurring #${existing.occurrences}): [${existing.runtime}] ${existing.error.name}: ${existing.error.message} (Fingerprint: ${existing.fingerprint.slice(0, 8)})`);
          this.triggerOnCapture(existing);
          return existing;
        }
      }

      const detected: DetectedError = {
        id: generateId(),
        fingerprint,
        runtime,
        source: input.source ?? "manual",
        severity: input.severity ?? "medium",
        error,
        request,
        browser,
        runtimeContext: {
          nodeVersion: runtime === "frontend" ? undefined : process.version,
          platform:
            runtime === "frontend" ? browser?.platform : process.platform,
          environment: this.options.environment,
          pid: runtime === "frontend" ? undefined : process.pid,
          timestamp,
        },
        occurrences: 1,
        firstSeen: timestamp,
        lastSeen: timestamp,
        projectId: this.options.projectId,
        deploymentId: this.options.deploymentId,
        environment: this.options.environment,
      };

      await this.storage.save(detected);
      console.log(`[Self-Healing] 🚨 Error Detected: [${detected.runtime}] ${detected.error.name}: ${detected.error.message} (Fingerprint: ${detected.fingerprint.slice(0, 8)})`);
      this.triggerOnCapture(detected);
      return detected;
    } catch {
      return undefined;
    }
  }

  private triggerOnCapture(detected: DetectedError): void {
    if (this.options.onCapture) {
      try {
        const promise = this.options.onCapture(detected);
        if (promise && typeof (promise as Promise<void>).catch === "function") {
          (promise as Promise<void>).catch(() => {});
        }
      } catch {
        // Silently isolate auto-healing triggers
      }
    }
  }

  async captureFrontendError(
    error: unknown,
    browser?: BrowserContext,
    componentStack?: string
  ): Promise<DetectedError | undefined> {
    return this.capture({
      error,
      runtime: "frontend",
      source: "browserError",
      severity: "medium",
      browser,
      componentStack,
    });
  }

  async captureBackendError(
    error: unknown,
    request?: RequestContext
  ): Promise<DetectedError | undefined> {
    return this.capture({
      error,
      runtime: "backend",
      source: "request",
      severity: "high",
      request,
    });
  }

  async getErrors(): Promise<DetectedError[]> {
    try {
      const errors = await this.storage.getAll();
      return [...errors].sort(
        (a, b) =>
          new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );
    } catch {
      return [];
    }
  }

  async getError(idOrFingerprint: string): Promise<DetectedError | undefined> {
    try {
      const byFingerprint = await this.storage.findByFingerprint(idOrFingerprint);
      if (byFingerprint) return byFingerprint;

      const all = await this.storage.getAll();
      return all.find(
        (err) => err.id === idOrFingerprint || err.fingerprint === idOrFingerprint
      );
    } catch {
      return undefined;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clear();
    } catch {
      // Isolated
    }
  }

  isRunning(): boolean {
    return Boolean(this.cleanupProcessHandlers);
  }

  private sanitizeRequest(request?: RequestContext): RequestContext | undefined {
    if (!request) return undefined;

    const sanitized: RequestContext = {
      method: request.method,
      url: request.url ? request.url.split("?")[0] : undefined,
      path: request.path,
      ip: request.ip,
      userAgent: request.userAgent,
    };

    if (this.options.captureHeaders && request.headers) {
      sanitized.headers = sanitizeHeaders(request.headers);
    }

    if (this.options.captureRequestBody && request.body) {
      sanitized.body = sanitizeValue(request.body);
    }

    if (request.query) {
      sanitized.query = sanitizeValue(request.query) as Record<string, unknown>;
    }

    return sanitized;
  }

  private sanitizeBrowser(browser?: BrowserContext): BrowserContext | undefined {
    if (!browser || !this.options.captureBrowser) {
      return undefined;
    }

    return {
      url: browser.url ? browser.url.split("?")[0] : undefined,
      userAgent: browser.userAgent,
      platform: browser.platform,
      language: browser.language,
      viewport: browser.viewport,
    };
  }

  private severityRank(severity: ErrorSeverity): number {
    return {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    }[severity];
  }
}