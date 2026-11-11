// src/app/lib/rateLimit.ts

export interface RateLimitConfig {
  limit: number; // Maximum number of requests allowed in window
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

// In-memory sliding window store: Map<identifierKey, Array<timestampMs>>
const rateLimitStore = new Map<string, number[]>();

// Periodically purge stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const validTimestamps = timestamps.filter((t) => now - t < 5 * 60 * 1000);
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, validTimestamps);
      }
    }
  }, CLEANUP_INTERVAL).unref?.();
}

/**
 * Sliding Window In-Memory Rate Limiter
 *
 * @param identifier Client identifier (IP address, user ID, or composite token)
 * @param config { limit, windowMs }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 60, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const timestamps = rateLimitStore.get(identifier) || [];

  // Filter timestamps within the current sliding window
  const recentTimestamps = timestamps.filter((t) => t > windowStart);

  if (recentTimestamps.length >= config.limit) {
    const oldest = recentTimestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + config.windowMs - now) / 1000));

    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  // Record this request
  recentTimestamps.push(now);
  rateLimitStore.set(identifier, recentTimestamps);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - recentTimestamps.length,
    resetInSeconds: Math.ceil(config.windowMs / 1000),
  };
}

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIp(req: Request | { headers: Headers }): string {
  const headers = req.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return '127.0.0.1';
}
