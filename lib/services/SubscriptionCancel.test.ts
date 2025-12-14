/**
 * SubscriptionCancel Tests - TDD Approach
 * Tests written BEFORE implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionCancel } from './SubscriptionCancel';

// Mock the database client
vi.mock('../db', () => ({
  getDbClient: () => ({
    execute: vi.fn()
  }),
  ensureSubscriptionSchema: vi.fn(),
  nowIso: () => '2025-01-15T00:00:00.000Z'
}));

describe('SubscriptionCancel', () => {
  let cancel: SubscriptionCancel;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    cancel = new SubscriptionCancel();
    mockDb = (cancel as any).db;
  });

  describe('canCancel', () => {
    it('returns true for active paid subscription', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          status: 'active'
        }]
      });

      const result = await cancel.canCancel('org-123');
      expect(result).toBe(true);
    });

    it('returns true for enterprise subscription', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'enterprise',
          status: 'active'
        }]
      });

      const result = await cancel.canCancel('org-123');
      expect(result).toBe(true);
    });

    it('returns false for free plan', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          status: 'active'
        }]
      });

      const result = await cancel.canCancel('org-123');
      expect(result).toBe(false);
    });

    it('returns false when no subscription exists', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const result = await cancel.canCancel('org-123');
      expect(result).toBe(false);
    });

    it('returns false for already cancelled subscription', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          status: 'canceled'
        }]
      });

      const result = await cancel.canCancel('org-123');
      expect(result).toBe(false);
    });

    it('returns false for canceling subscription', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          status: 'canceling'
        }]
      });

      const result = await cancel.canCancel('org-123');
      expect(result).toBe(false);
    });
  });

  describe('previewCancel', () => {
    it('returns preview for standard plan with registrations under free limit', async () => {
      // Given: standard plan with 50 registrations (under 100 free limit)
      // Use a date 15 days in the future
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          current_registration_count: 50,
          current_period_end: futureDate,
          status: 'active'
        }]
      });

      const preview = await cancel.previewCancel('org-123');

      expect(preview.currentPlan).toBe('standard');
      expect(preview.currentPlanName).toBe('Standard');
      expect(preview.currentLimit).toBe(5000);
      expect(preview.currentRegistrationCount).toBe(50);
      expect(preview.willExceedFreeLimit).toBe(false);
      expect(preview.registrationsOverFreeLimit).toBe(0);
      expect(preview.accessUntil).toBe(futureDate);
      expect(preview.daysRemaining).toBeGreaterThanOrEqual(14); // Allow for timing variance
      expect(preview.refundAmount).toBe(0);
    });

    it('returns preview for standard plan with registrations over free limit', async () => {
      // Given: standard plan with 500 registrations (over 100 free limit)
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          current_registration_count: 500,
          current_period_end: futureDate,
          status: 'active'
        }]
      });

      const preview = await cancel.previewCancel('org-123');

      expect(preview.currentRegistrationCount).toBe(500);
      expect(preview.willExceedFreeLimit).toBe(true);
      expect(preview.registrationsOverFreeLimit).toBe(400); // 500 - 100
      expect(preview.summary).toContain('exceed');
    });

    it('returns preview for enterprise plan', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'enterprise',
          registration_limit: 50000,
          current_registration_count: 10000,
          current_period_end: futureDate,
          status: 'active'
        }]
      });

      const preview = await cancel.previewCancel('org-123');

      expect(preview.currentPlan).toBe('enterprise');
      expect(preview.currentLimit).toBe(50000);
      expect(preview.willExceedFreeLimit).toBe(true);
      expect(preview.registrationsOverFreeLimit).toBe(9900); // 10000 - 100
    });

    it('throws error for free plan', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          status: 'active'
        }]
      });

      await expect(cancel.previewCancel('org-123'))
        .rejects.toThrow('Cannot cancel free plan');
    });

    it('throws error when no subscription exists', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      await expect(cancel.previewCancel('org-123'))
        .rejects.toThrow('No active subscription');
    });

    it('calculates days remaining correctly', async () => {
      // Period ends in 15 days from now
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          registration_limit: 5000,
          current_registration_count: 50,
          current_period_end: futureDate,
          status: 'active'
        }]
      });

      const preview = await cancel.previewCancel('org-123');

      // Allow for small timing variance (14-16 days)
      expect(preview.daysRemaining).toBeGreaterThanOrEqual(14);
      expect(preview.daysRemaining).toBeLessThanOrEqual(16);
    });
  });

  describe('executeCancel', () => {
    it('cancels standard subscription successfully', async () => {
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'sub-123',
            plan_type: 'standard',
            current_period_end: futureDate,
            status: 'active'
          }]
        })
        // Update subscription
        .mockResolvedValueOnce({ rowsAffected: 1 });

      const result = await cancel.executeCancel('org-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('cancelled');
      expect(result.accessUntil).toBe(futureDate);
    });

    it('stores cancellation reason', async () => {
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'sub-123',
            plan_type: 'standard',
            current_period_end: futureDate,
            status: 'active'
          }]
        })
        .mockResolvedValueOnce({ rowsAffected: 1 });

      await cancel.executeCancel('org-123', 'too_expensive');

      // Verify UPDATE was called with reason
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('cancellation_reason')
        })
      );
    });

    it('returns error for free plan', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'free',
          status: 'active'
        }]
      });

      const result = await cancel.executeCancel('org-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot cancel free plan');
    });

    it('returns error when no subscription exists', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const result = await cancel.executeCancel('org-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active subscription');
    });

    it('returns error for already cancelled subscription', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          plan_type: 'standard',
          status: 'canceled'
        }]
      });

      const result = await cancel.executeCancel('org-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already');
    });

    it('sets status to canceling (not canceled)', async () => {
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'sub-123',
            plan_type: 'standard',
            current_period_end: futureDate,
            status: 'active'
          }]
        })
        .mockResolvedValueOnce({ rowsAffected: 1 });

      await cancel.executeCancel('org-123');

      // Verify UPDATE sets status to 'canceling' (keeps access until period end)
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining("status = 'canceling'")
        })
      );
    });
  });
});
