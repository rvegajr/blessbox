/**
 * CouponUsageEnforcer Tests (TDD — Issue #27)
 *
 * Covers:
 *   - per-org redemption uniqueness (the security fix)
 *   - recordRedemption increments current_uses + writes redemption row
 *   - assertEligible delegates to CouponService for validity
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => ({
  getDbClient: () => mockDb,
  nowIso: () => '2026-01-01T00:00:00.000Z',
}));

const couponMock = {
  id: 'coupon-uuid',
  code: 'FREE100',
  discountType: 'percentage' as const,
  discountValue: 100,
  currency: 'USD',
  active: true,
  maxUses: null,
  currentUses: 0,
};

const validateCouponMock = vi.fn();
const getCouponByCodeMock = vi.fn();
vi.mock('../coupons', () => ({
  CouponService: vi.fn().mockImplementation(() => ({
    validateCoupon: validateCouponMock,
    getCouponByCode: getCouponByCodeMock,
  })),
}));

const mockDb = {
  execute: vi.fn(),
};

import { CouponUsageEnforcer } from './CouponUsageEnforcer';

describe('CouponUsageEnforcer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCouponMock.mockResolvedValue({ valid: true });
    getCouponByCodeMock.mockResolvedValue(couponMock);
    mockDb.execute.mockReset();
  });

  describe('assertEligible', () => {
    it('returns ineligible when CouponService says invalid', async () => {
      validateCouponMock.mockResolvedValueOnce({ valid: false, error: 'Coupon not found' });
      const enforcer = new CouponUsageEnforcer();
      const result = await enforcer.assertEligible('NOPE', 'org-1');
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Coupon not found');
    });

    it('returns ineligible when org has already redeemed this coupon', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      const enforcer = new CouponUsageEnforcer();
      const result = await enforcer.assertEligible('FREE100', 'org-1');
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/already been used by your organization/i);
    });

    it('returns eligible for fresh org redemption', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      const enforcer = new CouponUsageEnforcer();
      const result = await enforcer.assertEligible('FREE100', 'org-1');
      expect(result.eligible).toBe(true);
    });
  });

  describe('hasOrganizationRedeemed', () => {
    it('returns false when coupon does not exist', async () => {
      getCouponByCodeMock.mockResolvedValueOnce(null);
      const enforcer = new CouponUsageEnforcer();
      expect(await enforcer.hasOrganizationRedeemed('NOPE', 'org-1')).toBe(false);
    });

    it('returns true when count > 0', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ count: 2 }] });
      const enforcer = new CouponUsageEnforcer();
      expect(await enforcer.hasOrganizationRedeemed('FREE100', 'org-1')).toBe(true);
    });

    it('returns false when count = 0', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      const enforcer = new CouponUsageEnforcer();
      expect(await enforcer.hasOrganizationRedeemed('FREE100', 'org-1')).toBe(false);
    });
  });

  describe('recordRedemption', () => {
    it('inserts redemption row + bumps current_uses', async () => {
      mockDb.execute.mockResolvedValue({ rows: [] });
      const enforcer = new CouponUsageEnforcer();
      await enforcer.recordRedemption({
        code: 'FREE100',
        userId: 'user-1',
        organizationId: 'org-1',
        subscriptionId: 'sub-1',
        originalAmountCents: 9900,
        discountAppliedCents: 9900,
      });

      expect(mockDb.execute).toHaveBeenCalledTimes(2);

      const insertCall = mockDb.execute.mock.calls[0][0];
      expect(insertCall.sql).toMatch(/INSERT INTO coupon_redemptions/i);
      expect(insertCall.args).toContain('coupon-uuid');
      expect(insertCall.args).toContain('org-1');
      expect(insertCall.args).toContain('sub-1');
      expect(insertCall.args).toContain(9900);
      expect(insertCall.args).toContain(0);

      const updateCall = mockDb.execute.mock.calls[1][0];
      expect(updateCall.sql).toMatch(/UPDATE coupons.*current_uses = current_uses \+ 1/i);
      expect(updateCall.args).toContain('coupon-uuid');
    });

    it('throws when coupon not found', async () => {
      getCouponByCodeMock.mockResolvedValueOnce(null);
      const enforcer = new CouponUsageEnforcer();
      await expect(
        enforcer.recordRedemption({
          code: 'NOPE',
          userId: 'u',
          organizationId: 'o',
          subscriptionId: 's',
          originalAmountCents: 100,
          discountAppliedCents: 100,
        })
      ).rejects.toThrow('Coupon not found');
    });
  });
});
