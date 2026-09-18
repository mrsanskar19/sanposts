import { NextResponse } from 'next/server';

export interface ApiResponseMeta {
  timestamp: string;
  requestId?: string;
  version: string;
  node?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  meta: ApiResponseMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

const API_VERSION = 'v1';

export function createMeta(requestId?: string, node?: string): ApiResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
    version: API_VERSION,
    ...(node ? { node } : {}),
  };
}

export function apiSuccess<T>(
  data: T,
  init?: {
    status?: number;
    requestId?: string;
    node?: string;
    headers?: HeadersInit;
  }
) {
  const meta = createMeta(init?.requestId, init?.node);
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta,
  };

  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: init?.headers,
  });
}

export function apiError(
  code: string,
  message: string,
  init?: {
    status?: number;
    details?: unknown;
    requestId?: string;
    node?: string;
    headers?: HeadersInit;
  }
) {
  const meta = createMeta(init?.requestId, init?.node);
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(init?.details ? { details: init.details } : {}),
    },
    meta,
  };

  return NextResponse.json(body, {
    status: init?.status ?? 400,
    headers: init?.headers,
  });
}

export function apiUnauthorized(message = 'Unauthorized: Invalid or missing token', requestId?: string) {
  return apiError('UNAUTHORIZED', message, {
    status: 401,
    requestId,
  });
}

export function apiForbidden(message = 'Forbidden: Access denied', requestId?: string) {
  return apiError('FORBIDDEN', message, {
    status: 403,
    requestId,
  });
}

export function apiNotFound(message = 'Resource not found', requestId?: string) {
  return apiError('NOT_FOUND', message, {
    status: 404,
    requestId,
  });
}

export function apiRateLimited(retryAfterSeconds: number, requestId?: string) {
  return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', {
    status: 429,
    requestId,
    headers: {
      'Retry-After': String(retryAfterSeconds),
    },
  });
}
