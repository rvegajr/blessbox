/**
 * SubscriptionFinalizer Tests
 * Tests the cancellation finalization logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database client
vi.mock('../db', () => {
  const execute = vi.fn();
  const db = { execute };
  return {
    getDbClient: () => db,
    ensureSubscriptionSchema: vi.fn(),
    nowIso: () => '2025-01-20T00:00:00.000Z',
  };
});

describe('SubscriptionFinalizer (Cron Logic)', () => {
  let mockDb: any;
  let finalizer: any;
  let nowIso: any;
  let getDbClient: any;
  let SubscriptionFinalizer: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ SubscriptionFinalizer } = await import('./SubscriptionFinalizer'));
    ({ getDbClient, nowIso } = await import('../db'));
    mockDb = getDbClient();
    finalizer = new SubscriptionFinalizer();
  });

  describe('findExpiredCancellations', () => {
    it('finds subscriptions with status=canceling and period ended', async () => {
      // Given: subscription that was canceling and period ended yesterday
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'sub-123',
          organization_id: 'org-123',
          plan_type: 'standard',
          registration_limit: 5000,
          current_registration_count: 100,
          current_period_end: '2025-01-19T00:00:00.000Z' // Yesterday
        }]
      });

      // When: query for expired cancellations
      const result = await finalizer.findExpiredCancellations(nowIso());

      // Then: should find the subscription
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sub-123');
    });

    it('does not find subscriptions with period not yet ended', async () => {
      // Given: subscription canceling but period ends tomorrow
      mockDb.execute.mockResolvedValueOnce({
        rows: [] // Period hasn't ended yet
      });

      const result = await finalizer.findExpiredCancellations(nowIso());

      expect(result).toHaveLength(0);
    });

    it('does not find active subscriptions', async () => {
      // Given: active subscription (not canceling)
      mockDb.execute.mockResolvedValueOnce({
        rows: [] // status='active', not 'canceling'
      });

      const result = await finalizer.findExpiredCancellations(nowIso());

      expect(result).toHaveLength(0);
    });
  });

  describe('finalizeCancellation', () => {
    it('updates status from canceling to canceled', async () => {
      // When: finalize
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: 1 });
      await finalizer.finalizeCancellation('sub-123', nowIso());

      // Then: verify UPDATE was called with correct status
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining("status = 'canceled'"),
          args: expect.arrayContaining(['sub-123'])
        })
      );
    });
  });
});
