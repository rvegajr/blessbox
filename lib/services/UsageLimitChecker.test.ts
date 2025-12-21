/**
 * UsageLimitChecker Tests - TDD Approach
 * Tests written BEFORE implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsageLimitChecker } from './UsageLimitChecker';
import type { UsageLimitResult } from '../interfaces/IUsageLimitChecker';

// Mock the database client
vi.mock('../db', () => ({
  getDbClient: () => ({
    execute: vi.fn()
  }),
  ensureSubscriptionSchema: vi.fn()
}));

describe('UsageLimitChecker', () => {
  let checker: UsageLimitChecker;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    checker = new UsageLimitChecker();
    mockDb = (checker as any).db;
  });

  describe('canRegister', () => {
    it('returns allowed=true when under limit (Free plan)', async () => {
      // Given: org with 50/100 registrations on Free plan
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 50,
          status: 'active'
        }]
      });

      // When
      const result = await checker.canRegister('org-123');

      // Then
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(50);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(50);
      expect(result.planType).toBe('free');
      expect(result.message).toBeUndefined();
    });

    it('returns allowed=false when at limit', async () => {
      // Given: org with 100/100 registrations (at limit)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 100,
          status: 'active'
        }]
      });

      // When
      const result = await checker.canRegister('org-123');

      // Then
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(100);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(0);
      expect(result.message).toContain('limit');
      expect(result.upgradeUrl).toBe('/pricing');
    });

    it('returns allowed=false when over limit', async () => {
      // Given: org with 105/100 registrations (over limit - legacy data)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 105,
          status: 'active'
        }]
      });

      // When
      const result = await checker.canRegister('org-123');

      // Then
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(105);
      expect(result.remaining).toBe(0);
      expect(result.message).toContain('limit');
    });

    it('returns allowed=true for Standard plan with room', async () => {
      // Given: org with 4000/5000 registrations on Standard
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          current_registration_count: 4000,
          status: 'active'
        }]
      });

      // When
      const result = await checker.canRegister('org-123');

      // Then
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(4000);
      expect(result.limit).toBe(5000);
      expect(result.remaining).toBe(1000);
      expect(result.planType).toBe('standard');
    });

    it('returns allowed=true for Enterprise plan (high limit)', async () => {
      // Given: org with 49999 registrations on Enterprise (50k limit)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'enterprise',
          registration_limit: 50000,
          current_registration_count: 49999,
          status: 'active'
        }]
      });

      // When
      const result = await checker.canRegister('org-123');

      // Then
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
      expect(result.planType).toBe('enterprise');
    });

    it('uses free tier defaults when no subscription exists', async () => {
      // Given: org with no subscription record
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      // Also mock the registration count query
      mockDb.execute.mockResolvedValueOnce({
        rows: [{ count: 25 }]
      });

      // When
      const result = await checker.canRegister('org-123');

      // Then: Uses free tier limits (100)
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.planType).toBe('free');
      expect(result.currentCount).toBe(25);
      expect(result.remaining).toBe(75);
    });

    it('uses free tier defaults when subscription is cancelled', async () => {
      // Given: org with cancelled subscription
      // SQL query filters by status='active', so cancelled subscriptions won't be found
      mockDb.execute.mockResolvedValueOnce({
        rows: [] // No active subscription found (cancelled subscription is filtered out by SQL)
      });
      
      // Mock fallback registration count (200 registrations exist)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{ count: 200 }]
      });

      // When
      const result = await checker.canRegister('org-123');

      // Then: Falls back to free tier, but 200 > 100 (free limit)
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(100);
      expect(result.planType).toBe('free');
      expect(result.message).toContain('limit');
    });

    it('allows registration when count is exactly one less than limit', async () => {
      // Given: org with 99/100 (exactly one slot left)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 99,
          status: 'active'
        }]
      });

      // When
      const result = await checker.canRegister('org-123');

      // Then
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('handles null current_registration_count as zero', async () => {
      // Given: org with null count (new subscription)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          current_registration_count: null,
          status: 'active'
        }]
      });

      // When
      const result = await checker.canRegister('org-123');

      // Then
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(0);
      expect(result.remaining).toBe(5000);
    });

    it('handles database errors gracefully', async () => {
      // Given: database throws error
      mockDb.execute.mockRejectedValueOnce(new Error('Database connection failed'));

      // When/Then: Should throw (let caller handle)
      await expect(checker.canRegister('org-123')).rejects.toThrow('Database connection failed');
    });
  });
});
