import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractAuthToken, verifyAuthToken } from '@/lib/api/auth';
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  RateLimitTierConfig,
} from '@/lib/api/rate-limiter';
import { apiError, apiRateLimited, apiUnauthorized } from '@/lib/api/response';

// Public endpoints that bypass authentication
const PUBLIC_PATHS = [
  '/api/v1',
  '/api/v1/health',
  '/api/v1/auth/login',
  '/api/v1/auth/signup',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept /api/v1 routes; leave all web pages and assets untouched
  if (!pathname.startsWith('/api/v1')) {
    return NextResponse.next();
  }

  const requestId =
    request.headers.get('x-request-id') ||
    `req_${crypto.randomUUID().replace(/-/g, '')}`;

  // 1. Handle CORS Preflight
  if (request.method === 'OPTIONS') {
    const preflightHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-API-Key, X-Request-ID',
      'Access-Control-Max-Age': '86400',
      'x-request-id': requestId,
    });
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // 2. Token Extraction & Verification
  const token = extractAuthToken(request.headers);
  const userPayload = token ? await verifyAuthToken(token) : null;

  // 3. Determine Rate Limit Tier & Key
  const clientIp = getClientIp(request.headers);
  let tier: 'auth' | 'public' | 'authenticated' | 'enterprise' = 'public';
  let rateLimitKey = clientIp;

  if (pathname.includes('/auth/login') || pathname.includes('/auth/signup')) {
    tier = 'auth';
    rateLimitKey = `${clientIp}:${pathname}`;
  } else if (userPayload) {
    rateLimitKey = userPayload.sub;
    tier = userPayload.plan === 'Enterprise' ? 'enterprise' : 'authenticated';
  }

  // 4. Evaluate Rate Limit
  const rateLimitResult = checkRateLimit(rateLimitKey, tier);
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    const errorResponse = apiRateLimited(rateLimitResult.retryAfter, requestId);
    // Attach rate limit headers to 429 response
    Object.entries(rateLimitHeaders).forEach(([key, val]) => {
      errorResponse.headers.set(key, val);
    });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }

  // 5. Authentication Enforcement for Protected Routes
  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    (pathname === '/api/v1/load-balancer' && request.method === 'GET');

  if (!isPublicPath && !userPayload) {
    const unauthorizedResponse = apiUnauthorized(
      'Authentication required. Provide a valid Bearer token or X-API-Key.',
      requestId
    );
    Object.entries(rateLimitHeaders).forEach(([key, val]) => {
      unauthorizedResponse.headers.set(key, val);
    });
    unauthorizedResponse.headers.set('x-request-id', requestId);
    return unauthorizedResponse;
  }

  // 6. Forward Request with Injected Context Headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  if (userPayload) {
    requestHeaders.set('x-user-id', userPayload.sub);
    requestHeaders.set('x-user-email', userPayload.email);
    requestHeaders.set('x-user-name', encodeURIComponent(userPayload.name));
    requestHeaders.set('x-user-plan', userPayload.plan);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 7. Attach Security & Tracing Headers to Outgoing Response
  response.headers.set('x-request-id', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Access-Control-Allow-Origin', '*');

  // Attach rate limit headers
  Object.entries(rateLimitHeaders).forEach(([key, val]) => {
    response.headers.set(key, val);
  });

  return response;
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
