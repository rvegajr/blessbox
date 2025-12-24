/**
 * UsageDisplay Tests - TDD Approach
 * Tests written BEFORE implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsageDisplay } from './UsageDisplay';
import { calculateUsageStatus } from '../interfaces/IUsageDisplay';
import type { UsageDisplayData } from '../interfaces/IUsageDisplay';

// Mock the database client
vi.mock('../db', () => ({
  getDbClient: () => ({
    execute: vi.fn()
  }),
  ensureSubscriptionSchema: vi.fn()
}));

describe('UsageDisplay', () => {
  let display: UsageDisplay;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    display = new UsageDisplay();
    mockDb = (display as any).db;
  });

  describe('getUsageDisplay', () => {
    it('returns ok status when under 80%', async () => {
      // Given: org with 50/100 registrations (50%)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 50,
          status: 'active'
        }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.status).toBe('ok');
      expect(result.percentage).toBe(50);
      expect(result.currentCount).toBe(50);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(50);
      expect(result.planType).toBe('free');
    });

    it('returns warning status at 80-95%', async () => {
      // Given: org with 85/100 registrations (85%)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 85,
          status: 'active'
        }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.status).toBe('warning');
      expect(result.percentage).toBe(85);
    });

    it('returns critical status above 95%', async () => {
      // Given: org with 98/100 registrations (98%)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 98,
          status: 'active'
        }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.status).toBe('critical');
      expect(result.percentage).toBe(98);
    });

    it('returns critical status when at 100%', async () => {
      // Given: org with 100/100 registrations (100%)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 100,
          status: 'active'
        }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.status).toBe('critical');
      expect(result.percentage).toBe(100);
      expect(result.remaining).toBe(0);
    });

    it('caps percentage at 100+ but shows actual count', async () => {
      // Given: org with 110/100 registrations (legacy overage)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 110,
          status: 'active'
        }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.currentCount).toBe(110);
      expect(result.percentage).toBe(110); // Shows actual for clarity
      expect(result.remaining).toBe(0); // No negative remaining
      expect(result.status).toBe('critical');
    });

    it('returns Standard plan data correctly', async () => {
      // Given: Standard plan with 4000/5000 (80%)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          current_registration_count: 4000,
          status: 'active'
        }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.planType).toBe('standard');
      expect(result.limit).toBe(5000);
      expect(result.currentCount).toBe(4000);
      expect(result.percentage).toBe(80);
      expect(result.status).toBe('warning'); // exactly 80%
    });

    it('returns Enterprise plan data correctly', async () => {
      // Given: Enterprise plan with 25000/50000 (50%)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'enterprise',
          registration_limit: 50000,
          current_registration_count: 25000,
          status: 'active'
        }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.planType).toBe('enterprise');
      expect(result.limit).toBe(50000);
      expect(result.percentage).toBe(50);
      expect(result.status).toBe('ok');
    });

    it('uses free tier defaults when no subscription', async () => {
      // Given: no subscription exists
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      // Mock registration count query
      mockDb.execute.mockResolvedValueOnce({
        rows: [{ count: 25 }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.planType).toBe('free');
      expect(result.limit).toBe(100);
      expect(result.currentCount).toBe(25);
      expect(result.percentage).toBe(25);
      expect(result.status).toBe('ok');
    });

    it('handles zero registrations', async () => {
      // Given: new org with 0 registrations
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          current_registration_count: 0,
          status: 'active'
        }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.currentCount).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.remaining).toBe(5000);
      expect(result.status).toBe('ok');
    });

    it('handles null count as zero', async () => {
      // Given: subscription with null count
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: null,
          status: 'active'
        }]
      });

      // When
      const result = await display.getUsageDisplay('org-123');

      // Then
      expect(result.currentCount).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });
});

describe('calculateUsageStatus', () => {
  it('returns ok for 0%', () => {
    expect(calculateUsageStatus(0)).toBe('ok');
  });

  it('returns ok for 50%', () => {
    expect(calculateUsageStatus(50)).toBe('ok');
  });

  it('returns ok for 79%', () => {
    expect(calculateUsageStatus(79)).toBe('ok');
  });

  it('returns warning for exactly 80%', () => {
    expect(calculateUsageStatus(80)).toBe('warning');
  });

  it('returns warning for 90%', () => {
    expect(calculateUsageStatus(90)).toBe('warning');
  });

  it('returns warning for 94%', () => {
    expect(calculateUsageStatus(94)).toBe('warning');
  });

  it('returns critical for exactly 95%', () => {
    expect(calculateUsageStatus(95)).toBe('critical');
  });

  it('returns critical for 100%', () => {
    expect(calculateUsageStatus(100)).toBe('critical');
  });

  it('returns critical for over 100%', () => {
    expect(calculateUsageStatus(110)).toBe('critical');
  });
});
