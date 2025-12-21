/**
 * PlanUpgrade Tests - TDD Approach
 * Tests written BEFORE implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanUpgrade } from './PlanUpgrade';
import { PLAN_HIERARCHY } from '../interfaces/IPlanUpgrade';

// Mock the database client
vi.mock('../db', () => ({
  getDbClient: () => ({
    execute: vi.fn()
  }),
  ensureSubscriptionSchema: vi.fn(),
  nowIso: () => new Date().toISOString()
}));

describe('PlanUpgrade', () => {
  let upgrade: PlanUpgrade;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    upgrade = new PlanUpgrade();
    mockDb = (upgrade as any).db;
  });

  describe('isValidUpgrade', () => {
    it('returns true for free → standard', () => {
      expect(upgrade.isValidUpgrade('free', 'standard')).toBe(true);
    });

    it('returns true for free → enterprise', () => {
      expect(upgrade.isValidUpgrade('free', 'enterprise')).toBe(true);
    });

    it('returns true for standard → enterprise', () => {
      expect(upgrade.isValidUpgrade('standard', 'enterprise')).toBe(true);
    });

    it('returns false for same plan (free → free)', () => {
      expect(upgrade.isValidUpgrade('free', 'free')).toBe(false);
    });

    it('returns false for same plan (standard → standard)', () => {
      expect(upgrade.isValidUpgrade('standard', 'standard')).toBe(false);
    });

    it('returns false for downgrade (standard → free)', () => {
      expect(upgrade.isValidUpgrade('standard', 'free')).toBe(false);
    });

    it('returns false for downgrade (enterprise → standard)', () => {
      expect(upgrade.isValidUpgrade('enterprise', 'standard')).toBe(false);
    });

    it('returns false for downgrade (enterprise → free)', () => {
      expect(upgrade.isValidUpgrade('enterprise', 'free')).toBe(false);
    });
  });

  describe('previewUpgrade', () => {
    it('returns preview for free → standard upgrade', async () => {
      // Given: org on free plan
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          current_registration_count: 50,
          status: 'active'
        }]
      });

      // When
      const preview = await upgrade.previewUpgrade('org-123', 'standard');

      // Then
      expect(preview.currentPlan).toBe('free');
      expect(preview.currentPlanName).toBe('Free');
      expect(preview.currentLimit).toBe(100);
      expect(preview.targetPlan).toBe('standard');
      expect(preview.targetPlanName).toBe('Standard');
      expect(preview.targetLimit).toBe(5000);
      expect(preview.currentMonthlyPrice).toBe(0);
      expect(preview.newMonthlyPrice).toBe(1900); // $19.00
      expect(preview.priceDifference).toBe(1900);
      expect(preview.amountDueNow).toBe(1900);
      expect(preview.effectiveImmediately).toBe(true);
      expect(preview.summary).toContain('Free');
      expect(preview.summary).toContain('Standard');
    });

    it('returns preview for free → enterprise upgrade', async () => {
      // Given: org on free plan
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          registration_limit: 100,
          status: 'active'
        }]
      });

      // When
      const preview = await upgrade.previewUpgrade('org-123', 'enterprise');

      // Then
      expect(preview.currentPlan).toBe('free');
      expect(preview.targetPlan).toBe('enterprise');
      expect(preview.targetLimit).toBe(50000);
      expect(preview.newMonthlyPrice).toBe(9900); // $99.00
      expect(preview.amountDueNow).toBe(9900);
    });

    it('returns preview for standard → enterprise upgrade', async () => {
      // Given: org on standard plan
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          status: 'active'
        }]
      });

      // When
      const preview = await upgrade.previewUpgrade('org-123', 'enterprise');

      // Then
      expect(preview.currentPlan).toBe('standard');
      expect(preview.currentMonthlyPrice).toBe(1900);
      expect(preview.targetPlan).toBe('enterprise');
      expect(preview.newMonthlyPrice).toBe(9900);
      expect(preview.priceDifference).toBe(8000); // $80.00 difference
      expect(preview.amountDueNow).toBe(9900); // Full month for simplicity
    });

    it('throws error for invalid downgrade', async () => {
      // Given: org on standard plan
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          status: 'active'
        }]
      });

      // When/Then
      await expect(upgrade.previewUpgrade('org-123', 'free'))
        .rejects.toThrow('Cannot downgrade');
    });

    it('throws error for same plan', async () => {
      // Given: org on standard plan
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          status: 'active'
        }]
      });

      // When/Then
      await expect(upgrade.previewUpgrade('org-123', 'standard'))
        .rejects.toThrow('already on');
    });

    it('uses free plan defaults when no subscription exists', async () => {
      // Given: no subscription
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      // When
      const preview = await upgrade.previewUpgrade('org-123', 'standard');

      // Then: defaults to free plan
      expect(preview.currentPlan).toBe('free');
      expect(preview.currentMonthlyPrice).toBe(0);
    });
  });

  describe('executeUpgrade', () => {
    it('upgrades free → standard successfully', async () => {
      // Given: org on free plan
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'sub-123',
            plan_type: 'free',
            registration_limit: 100,
            current_registration_count: 50,
            status: 'active'
          }]
        })
        // Update subscription
        .mockResolvedValueOnce({ rowsAffected: 1 });

      // When
      const result = await upgrade.executeUpgrade('org-123', 'standard');

      // Then
      expect(result.success).toBe(true);
      expect(result.newPlanType).toBe('standard');
      expect(result.newLimit).toBe(5000);
      expect(result.message).toContain('upgraded');
    });

    it('upgrades standard → enterprise successfully', async () => {
      // Given: org on standard plan
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'sub-123',
            plan_type: 'standard',
            registration_limit: 5000,
            status: 'active'
          }]
        })
        .mockResolvedValueOnce({ rowsAffected: 1 });

      // When
      const result = await upgrade.executeUpgrade('org-123', 'enterprise');

      // Then
      expect(result.success).toBe(true);
      expect(result.newPlanType).toBe('enterprise');
      expect(result.newLimit).toBe(50000);
    });

    it('returns error for invalid downgrade', async () => {
      // Given: org on enterprise plan
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'enterprise',
          status: 'active'
        }]
      });

      // When
      const result = await upgrade.executeUpgrade('org-123', 'standard');

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot downgrade');
    });

    it('creates subscription if none exists', async () => {
      // Given: no subscription
      mockDb.execute
        .mockResolvedValueOnce({ rows: [] })
        // Insert new subscription
        .mockResolvedValueOnce({ rowsAffected: 1 });

      // When
      const result = await upgrade.executeUpgrade('org-123', 'standard');

      // Then
      expect(result.success).toBe(true);
      expect(result.newPlanType).toBe('standard');
    });

    it('preserves registration count on upgrade', async () => {
      // Given: org with 50 registrations on free plan
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'sub-123',
            plan_type: 'free',
            registration_limit: 100,
            current_registration_count: 50,
            status: 'active'
          }]
        })
        .mockResolvedValueOnce({ rowsAffected: 1 });

      // When
      await upgrade.executeUpgrade('org-123', 'standard');

      // Then: verify UPDATE keeps current_registration_count
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.not.stringContaining('current_registration_count = 0')
        })
      );
    });
  });
});

describe('PLAN_HIERARCHY', () => {
  it('has correct ordering', () => {
    expect(PLAN_HIERARCHY.free).toBeLessThan(PLAN_HIERARCHY.standard);
    expect(PLAN_HIERARCHY.standard).toBeLessThan(PLAN_HIERARCHY.enterprise);
  });
});
