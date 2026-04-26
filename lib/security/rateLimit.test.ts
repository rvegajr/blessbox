import { describe, it, expect, beforeEach } from 'vitest';
import {
  rateLimit,
  rateLimitResponse,
  getClientIp,
  __resetRateLimit,
} from './rateLimit';

function makeReq(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as any;
}

describe('rateLimit helper', () => {
  beforeEach(() => {
    __resetRateLimit();
  });

  describe('getClientIp', () => {
    it('uses first hop of x-forwarded-for', () => {
      const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
      expect(getClientIp(req)).toBe('1.2.3.4');
    });

    it('falls back to x-real-ip', () => {
      expect(getClientIp(makeReq({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9');
    });

    it("returns 'unknown' when no headers present", () => {
      expect(getClientIp(makeReq())).toBe('unknown');
    });
  });

  describe('token consumption', () => {
    it('allows requests up to the limit then blocks', () => {
      const req = makeReq({ 'x-forwarded-for': '1.1.1.1' });
      const opts = { key: 'test', limit: 3, windowMs: 60_000, now: () => 1_000 };

      expect(rateLimit(req, opts).allowed).toBe(true);
      expect(rateLimit(req, opts).allowed).toBe(true);
      const third = rateLimit(req, opts);
      expect(third.allowed).toBe(true);
      expect(third.remaining).toBe(0);

      const fourth = rateLimit(req, opts);
      expect(fourth.allowed).toBe(false);
      expect(fourth.retryAfterSec).toBeGreaterThan(0);
    });

    it('reports a sensible retryAfterSec when blocked', () => {
      const req = makeReq({ 'x-forwarded-for': '1.1.1.1' });
      let t = 0;
      const opts = { key: 'r', limit: 1, windowMs: 10_000, now: () => t };
      rateLimit(req, opts);
      const blocked = rateLimit(req, opts);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSec).toBe(10);
    });
  });

  describe('window expiry', () => {
    it('refills the bucket once the window has elapsed', () => {
      const req = makeReq({ 'x-forwarded-for': '2.2.2.2' });
      let t = 0;
      const opts = { key: 'win', limit: 2, windowMs: 5_000, now: () => t };

      expect(rateLimit(req, opts).allowed).toBe(true);
      expect(rateLimit(req, opts).allowed).toBe(true);
      expect(rateLimit(req, opts).allowed).toBe(false);

      // Advance past the window
      t = 6_000;
      expect(rateLimit(req, opts).allowed).toBe(true);
      expect(rateLimit(req, opts).allowed).toBe(true);
      expect(rateLimit(req, opts).allowed).toBe(false);
    });
  });

  describe('key isolation', () => {
    it('different IPs do not share a bucket', () => {
      const a = makeReq({ 'x-forwarded-for': '1.1.1.1' });
      const b = makeReq({ 'x-forwarded-for': '2.2.2.2' });
      const opts = { key: 'iso', limit: 1, windowMs: 60_000, now: () => 1 };
      expect(rateLimit(a, opts).allowed).toBe(true);
      expect(rateLimit(a, opts).allowed).toBe(false);
      // b is independent
      expect(rateLimit(b, opts).allowed).toBe(true);
    });

    it('different route keys do not share a bucket', () => {
      const req = makeReq({ 'x-forwarded-for': '1.1.1.1' });
      const now = () => 1;
      expect(rateLimit(req, { key: 'route-a', limit: 1, windowMs: 60_000, now }).allowed).toBe(true);
      expect(rateLimit(req, { key: 'route-a', limit: 1, windowMs: 60_000, now }).allowed).toBe(false);
      // Different route, same IP — fresh bucket
      expect(rateLimit(req, { key: 'route-b', limit: 1, windowMs: 60_000, now }).allowed).toBe(true);
    });

    it('honors explicit identifier override (e.g. email)', () => {
      const req = makeReq({ 'x-forwarded-for': '1.1.1.1' });
      const opts = (identifier: string) => ({
        key: 'email',
        limit: 1,
        windowMs: 60_000,
        identifier,
        now: () => 1,
      });
      expect(rateLimit(req, opts('a@x.com')).allowed).toBe(true);
      expect(rateLimit(req, opts('a@x.com')).allowed).toBe(false);
      expect(rateLimit(req, opts('b@x.com')).allowed).toBe(true);
    });
  });

  describe('rateLimitResponse', () => {
    it('returns a 429 with Retry-After header', async () => {
      const res = rateLimitResponse(42);
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('42');
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.retryAfterSec).toBe(42);
    });

    it('floors fractional seconds and never goes below 1', () => {
      expect(rateLimitResponse(0).headers.get('Retry-After')).toBe('1');
      expect(rateLimitResponse(2.7).headers.get('Retry-After')).toBe('2');
    });
  });
});
