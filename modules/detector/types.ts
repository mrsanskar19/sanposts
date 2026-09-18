export type ErrorSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ErrorSource =
  | "uncaughtException"
  | "unhandledRejection"
  | "request"
  | "browserError"
  | "browserUnhandledRejection"
  | "reactBoundary"
  | "manual";

export type ErrorRuntime =
  | "frontend"
  | "backend";

export interface DetectorError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  cause?: unknown;
  componentStack?: string;
}

export interface RequestContext {
  method?: string;
  url?: string;
  path?: string;
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: unknown;
  ip?: string;
  userAgent?: string;
}

export interface BrowserContext {
  url?: string;
  userAgent?: string;
  platform?: string;
  language?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface RuntimeContext {
  nodeVersion?: string;
  platform?: string;
  environment: string;
  pid?: number;
  timestamp: string;
  framework?: string;
}

export interface DetectedError {
  id: string;
  fingerprint: string;

  runtime: ErrorRuntime;
  source: ErrorSource;
  severity: ErrorSeverity;

  error: DetectorError;

  request?: RequestContext;
  browser?: BrowserContext;

  runtimeContext: RuntimeContext;

  occurrences: number;

  firstSeen: string;
  lastSeen: string;

  projectId?: string;
  deploymentId?: string;
  environment?: string;
}

export interface ErrorInput {
  error: unknown;
  runtime?: ErrorRuntime;
  source?: ErrorSource;
  severity?: ErrorSeverity;
  request?: RequestContext;
  browser?: BrowserContext;
  componentStack?: string;
}

export interface DetectorOptions {
  enabled?: boolean;
  environment?: string;
  projectId?: string;
  deploymentId?: string;
  deduplicationWindowMs?: number;
  captureRequestBody?: boolean;
  captureHeaders?: boolean;
  captureBrowser?: boolean;
  onCapture?: (error: DetectedError) => void | Promise<void>;
}

export interface DetectorStorage {
  save(error: DetectedError): Promise<void> | void;

  findByFingerprint(
    fingerprint: string
  ):
    | Promise<DetectedError | undefined>
    | DetectedError
    | undefined;

  getAll():
    | Promise<DetectedError[]>
    | DetectedError[];

  clear(): Promise<void> | void;
}