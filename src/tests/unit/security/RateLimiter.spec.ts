// TDD: Rate Limiter Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from '../../../implementations/security/RateLimiter';
import type { IRateLimiter, RateLimitConfig } from '../../../interfaces/security/IRateLimiter';

describe('RateLimiter (TDD)', () => {
  let rateLimiter: IRateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('checkLimit()', () => {
    it('should allow requests within limit', async () => {
      // Arrange
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000, // 1 minute
      };
      rateLimiter.configureLimits('/api/test', config);

      // Act
      const result = await rateLimiter.checkLimit('user123', '/api/test');

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('should block requests when limit exceeded', async () => {
      // Arrange
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 60000,
      };
      rateLimiter.configureLimits('/api/test', config);

      // Act - Make requests up to limit
      await rateLimiter.checkLimit('user123', '/api/test');
      await rateLimiter.checkLimit('user123', '/api/test');
      const blockedResult = await rateLimiter.checkLimit('user123', '/api/test');

      // Assert
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    it('should reset limits after time window', async () => {
      // Arrange
      const config: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 1000, // 1 second
      };
      rateLimiter.configureLimits('/api/test', config);

      // Act - Exhaust limit
      await rateLimiter.checkLimit('user123', '/api/test');
      const blockedResult = await rateLimiter.checkLimit('user123', '/api/test');
      expect(blockedResult.allowed).toBe(false);

      // Fast-forward time
      vi.advanceTimersByTime(1001);

      // Try again after window reset
      const allowedResult = await rateLimiter.checkLimit('user123', '/api/test');

      // Assert
      expect(allowedResult.allowed).toBe(true);
      expect(allowedResult.remaining).toBe(0);
    });

    it('should handle different identifiers separately', async () => {
      // Arrange
      const config: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 60000,
      };
      rateLimiter.configureLimits('/api/test', config);

      // Act
      const user1Result = await rateLimiter.checkLimit('user1', '/api/test');
      const user2Result = await rateLimiter.checkLimit('user2', '/api/test');

      // Assert
      expect(user1Result.allowed).toBe(true);
      expect(user2Result.allowed).toBe(true);
    });

    it('should handle different endpoints separately', async () => {
      // Arrange
      const config1: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };
      const config2: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };
      
      rateLimiter.configureLimits('/api/endpoint1', config1);
      rateLimiter.configureLimits('/api/endpoint2', config2);

      // Act
      await rateLimiter.checkLimit('user123', '/api/endpoint1'); // Exhausts endpoint1
      const endpoint1Blocked = await rateLimiter.checkLimit('user123', '/api/endpoint1');
      const endpoint2Allowed = await rateLimiter.checkLimit('user123', '/api/endpoint2');

      // Assert
      expect(endpoint1Blocked.allowed).toBe(false);
      expect(endpoint2Allowed.allowed).toBe(true);
    });
  });

  describe('resetLimits()', () => {
    it('should reset limits for specific identifier', async () => {
      // Arrange
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };
      rateLimiter.configureLimits('/api/test', config);
      
      // Exhaust limit
      await rateLimiter.checkLimit('user123', '/api/test');
      const blockedResult = await rateLimiter.checkLimit('user123', '/api/test');
      expect(blockedResult.allowed).toBe(false);

      // Act
      await rateLimiter.resetLimits('user123', '/api/test');
      const allowedResult = await rateLimiter.checkLimit('user123', '/api/test');

      // Assert
      expect(allowedResult.allowed).toBe(true);
    });
  });

  describe('getLimitStatus()', () => {
    it('should return current limit status', async () => {
      // Arrange
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };
      rateLimiter.configureLimits('/api/test', config);
      
      await rateLimiter.checkLimit('user123', '/api/test');
      await rateLimiter.checkLimit('user123', '/api/test');

      // Act
      const status = await rateLimiter.getLimitStatus('user123', '/api/test');

      // Assert
      expect(status.requests).toBe(2);
      expect(status.limit).toBe(5);
      expect(status.remaining).toBe(3);
      expect(status.blocked).toBe(false);
      expect(status.resetTime).toBeInstanceOf(Date);
    });
  });

  describe('Interface Segregation Principle', () => {
    it('should only expose rate limiting methods', () => {
      // Assert that the service only has rate limiting methods
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(rateLimiter));
      const expectedMethods = [
        'constructor',
        'checkLimit',
        'resetLimits',
        'getLimitStatus',
        'configureLimits',
      ];

      expectedMethods.forEach(method => {
        expect(methods).toContain(method);
      });

      // Should not have authentication or validation methods
      expect(methods).not.toContain('validatePassword');
      expect(methods).not.toContain('generateToken');
    });
  });
});