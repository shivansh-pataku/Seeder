import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

describe('Rate Limiter Suite', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests under the limit', () => {
    const id = `test-client-${Math.random()}`;
    const result1 = checkRateLimit(id, { limit: 3, windowMs: 10000 });
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = checkRateLimit(id, { limit: 3, windowMs: 10000 });
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);
  });

  it('should reject requests that exceed the limit', () => {
    const id = `test-blocked-${Math.random()}`;
    checkRateLimit(id, { limit: 2, windowMs: 10000 });
    checkRateLimit(id, { limit: 2, windowMs: 10000 });

    const blocked = checkRateLimit(id, { limit: 2, windowMs: 10000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInSeconds).toBeGreaterThan(0);
  });

  it('should extract client IP correctly from headers', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '203.0.113.195, 70.41.3.18');
    const ip = getClientIp({ headers });
    expect(ip).toBe('203.0.113.195');
  });

  it('should fallback to 127.0.0.1 when no proxy headers exist', () => {
    const headers = new Headers();
    const ip = getClientIp({ headers });
    expect(ip).toBe('127.0.0.1');
  });
});

