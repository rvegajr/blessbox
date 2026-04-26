/**
 * In-memory token-bucket rate limiter.
 *
 * Best-effort only: Vercel serverless = per-instance memory, so a single
 * client can be served by multiple instances and effectively get N x limit.
 * This provides baseline protection against trivial brute-force / abuse.
 *
 * TODO(prod): swap the in-memory `buckets` Map for a distributed store
 * (e.g. Upstash Redis via @upstash/ratelimit) so limits are enforced
 * globally across all serverless instances.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window resets
}

// Exported only for tests. Do not use elsewhere.
export const __buckets: Map<string, Bucket> = new Map();

/** Clear in-memory state. Test-only. */
export function __resetRateLimit(): void {
  __buckets.clear();
}

/**
 * Extract a best-effort client IP from the request headers.
 * Order: first hop of `x-forwarded-for`, then `x-real-ip`, then `'unknown'`.
 */
export function getClientIp(req: Pick<NextRequest, 'headers'>): string {
  // Tolerate stub requests in tests that lack a Headers object.
  const headers = (req as any)?.headers;
  if (!headers || typeof headers.get !== 'function') return 'unknown';
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = headers.get('x-real-ip');
  if (real && real.trim()) return real.trim();
  return 'unknown';
}

export interface RateLimitOptions {
  /** Logical route key, e.g. 'auth/send-code'. Combined with ip to form the bucket key. */
  key: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /**
   * Optional override of the per-bucket identity (e.g. an email or session id).
   * Defaults to the client IP extracted from headers.
   */
  identifier?: string;
  /** Inject current time. Test-only. */
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
  /** Remaining tokens in the current window (0 when blocked). */
  remaining: number;
}

/**
 * Consume one token from the bucket identified by `${key}:${identifier ?? ip}`.
 * Lazily expires stale buckets on access — no background timers.
 */
export function rateLimit(
  req: Pick<NextRequest, 'headers'>,
  opts: RateLimitOptions
): RateLimitResult {
  const now = opts.now ? opts.now() : Date.now();
  const id = opts.identifier ?? getClientIp(req);
  const bucketKey = `${opts.key}:${id}`;

  let bucket = __buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + opts.windowMs };
    __buckets.set(bucketKey, bucket);
  }

  // Lazy GC: opportunistically clear up to a few stale neighbors so the map
  // doesn't grow unbounded under low-churn keys. Bounded to keep this O(1)-ish.
  if (__buckets.size > 1000) {
    let scanned = 0;
    for (const [k, b] of __buckets) {
      if (b.resetAt <= now) __buckets.delete(k);
      if (++scanned >= 50) break;
    }
  }

  if (bucket.count >= opts.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec, remaining: 0 };
  }

  bucket.count += 1;
  return {
    allowed: true,
    retryAfterSec: 0,
    remaining: Math.max(0, opts.limit - bucket.count),
  };
}

/**
 * Build a 429 response with a `Retry-After` header (seconds).
 */
export function rateLimitResponse(retryAfterSec: number): Response {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please slow down and try again shortly.',
      retryAfterSec,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, Math.floor(retryAfterSec))),
      },
    }
  );
}
