/**
 * Sliding Window In-Memory Rate Limiter for API v1.
 * Works seamlessly in edge and node runtimes with automatic memory hygiene.
 */

export interface RateLimitTierConfig {
  windowMs: number; // Duration of window in ms
  maxRequests: number; // Max requests allowed within window
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTierConfig> = {
  // Sensitive auth endpoints (login, signup)
  auth: {
    windowMs: 60 * 1000,
    maxRequests: 15,
  },
  // Public unauthenticated requests
  public: {
    windowMs: 60 * 1000,
    maxRequests: 40,
  },
  // Standard authenticated users
  authenticated: {
    windowMs: 60 * 1000,
    maxRequests: 150,
  },
  // Enterprise / High-throughput API key users
  enterprise: {
    windowMs: 60 * 1000,
    maxRequests: 600,
  },
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;       // Unix timestamp (seconds) when limit resets
  retryAfter: number;  // Seconds until retry allowed
}

// In-memory sliding window bucket store
interface TokenRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, TokenRecord>();

// Periodic cleanup of stale memory records every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanStaleRecords() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of memoryStore.entries()) {
    // Retain only timestamps from the last 15 minutes
    const validTimestamps = record.timestamps.filter(ts => now - ts < 15 * 60 * 1000);
    if (validTimestamps.length === 0) {
      memoryStore.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}

/**
 * Check if a request exceeds rate limits under the given tier.
 */
export function checkRateLimit(
  identifier: string,
  tierName: keyof typeof RATE_LIMIT_TIERS = 'public'
): RateLimitResult {
  cleanStaleRecords();

  const config = RATE_LIMIT_TIERS[tierName] || RATE_LIMIT_TIERS.public;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const storageKey = `${tierName}:${identifier}`;
  let record = memoryStore.get(storageKey);

  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(storageKey, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter(ts => ts > windowStart);

  const currentCount = record.timestamps.length;
  const resetTimeMs = (record.timestamps[0] || now) + config.windowMs;
  const resetSeconds = Math.ceil(resetTimeMs / 1000);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

  if (currentCount >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: resetSeconds,
      retryAfter: retryAfterSeconds,
    };
  }

  // Register this request
  record.timestamps.push(now);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.timestamps.length,
    reset: resetSeconds,
    retryAfter: 0,
  };
}

/**
 * Helper to extract client IP address from request headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * Create Rate Limit response headers.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    ...(result.retryAfter > 0 ? { 'Retry-After': String(result.retryAfter) } : {}),
  };
}
