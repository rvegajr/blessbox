import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CouponService } from './coupons';

const mockDb = {
  execute: vi.fn(),
};

vi.mock('./db', () => ({
  getDbClient: () => mockDb,
  ensureSubscriptionSchema: vi.fn(),
  nowIso: () => '2024-01-01T00:00:00Z',
}));

describe('CouponService', () => {
  let service: CouponService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.execute.mockReset(); // Reset all mocks
    service = new CouponService();
    // Avoid schema DDL noise in unit tests
    (service as any).ensureSchema = vi.fn().mockResolvedValue(undefined);
  });

  describe('validateCoupon', () => {
    it('returns valid=true for active coupon', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'c1',
          code: 'WELCOME25',
          discount_type: 'percentage',
          discount_value: 25,
          currency: 'USD',
          active: 1,
          max_uses: 100,
          current_uses: 0,
          expires_at: '2026-12-31T23:59:59Z',
          applicable_plans: JSON.stringify(['standard', 'enterprise']),
          created_at: '2024-01-01T00:00:00Z',
          created_by: 'admin',
          updated_at: '2024-01-01T00:00:00Z',
        }]
      });

      const result = await service.validateCoupon('WELCOME25');
      expect(result.valid).toBe(true);
      expect(result.discount).toEqual({ type: 'percentage', value: 25, currency: 'USD' });
    });

    it('returns valid=false for non-existent coupon', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      const result = await service.validateCoupon('INVALID');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon not found');
    });

    it('returns valid=false for inactive coupon', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ code: 'INACTIVE', active: 0 }] });
      const result = await service.validateCoupon('INACTIVE');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon is inactive');
    });

    it('returns valid=false for expired coupon', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ code: 'EXPIRED', active: 1, expires_at: '2023-01-01T00:00:00Z' }] });
      const result = await service.validateCoupon('EXPIRED');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon has expired');
    });

    it('returns valid=false for exhausted coupon', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ code: 'EXH', active: 1, max_uses: 10, current_uses: 10 }] });
      const result = await service.validateCoupon('EXH');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon has reached maximum uses');
    });
  });

  describe('applyCoupon', () => {
    it('calculates percentage discount correctly (cents)', async () => {
      const row = {
        id: 'c1',
        code: 'WELCOME25',
        discount_type: 'percentage',
        discount_value: 25,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['standard']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2026-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [row] }) // validateCoupon SELECT
        .mockResolvedValueOnce({ rows: [row] }); // getCouponByCode SELECT

      const result = await service.applyCoupon('WELCOME25', 10000, 'standard');
      expect(result).toBe(7500);
    });

    it('calculates fixed discount correctly (cents)', async () => {
      const row = {
        id: 'c1',
        code: 'FIXED500',
        discount_type: 'fixed',
        discount_value: 500,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['standard']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2026-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [row] })
        .mockResolvedValueOnce({ rows: [row] });

      const result = await service.applyCoupon('FIXED500', 2000, 'standard');
      expect(result).toBe(1500);
    });

    it('does not discount below minimum amount (100 cents)', async () => {
      const row = {
        id: 'c1',
        code: 'BIGDISCOUNT',
        discount_type: 'fixed',
        discount_value: 5000,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['standard']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2026-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [row] })
        .mockResolvedValueOnce({ rows: [row] });

      const result = await service.applyCoupon('BIGDISCOUNT', 3000, 'standard');
      expect(result).toBe(100);
    });

    it('allows 100% discount (free)', async () => {
      const row = {
        id: 'c1',
        code: 'FREE100',
        discount_type: 'percentage',
        discount_value: 100,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['standard']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2026-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [row] })
        .mockResolvedValueOnce({ rows: [row] });

      const result = await service.applyCoupon('FREE100', 2999, 'standard');
      expect(result).toBe(0);
    });

    it('throws error for invalid coupon', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      await expect(service.applyCoupon('INVALID', 1000, 'standard')).rejects.toThrow('Coupon not found');
    });

    it('throws error for inapplicable plan', async () => {
      const row = {
        id: 'c1',
        code: 'ENTERPRISEONLY',
        discount_type: 'percentage',
        discount_value: 25,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['enterprise']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2026-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [row] })
        .mockResolvedValueOnce({ rows: [row] });

      await expect(service.applyCoupon('ENTERPRISEONLY', 10000, 'standard')).rejects.toThrow('Coupon not applicable to this plan');
    });
  });

  describe('createCoupon', () => {
    it('creates coupon and returns it', async () => {
      const couponData = {
        code: 'NEWCOUPON',
        discountType: 'percentage',
        discountValue: 20,
        currency: 'USD',
        maxUses: 50,
        expiresAt: '2024-12-31T23:59:59Z',
        applicablePlans: ['standard', 'enterprise'],
        createdBy: 'admin-123',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [] }) // INSERT
        .mockResolvedValueOnce({
          rows: [{
            id: 'coupon-123',
            code: 'NEWCOUPON',
            discount_type: 'percentage',
            discount_value: 20,
            currency: 'USD',
            active: 1,
            max_uses: 50,
            current_uses: 0,
            expires_at: couponData.expiresAt,
            applicable_plans: JSON.stringify(couponData.applicablePlans),
            created_at: '2024-01-01T00:00:00Z',
            created_by: 'admin-123',
            updated_at: '2024-01-01T00:00:00Z',
          }]
        }); // getCoupon SELECT

      const result = await service.createCoupon(couponData as any);
      expect(result.code).toBe('NEWCOUPON');
      expect(result.discountType).toBe('percentage');
      expect(mockDb.execute).toHaveBeenCalledWith(expect.objectContaining({ sql: expect.stringContaining('INSERT INTO coupons') }));
    });

    it('throws for duplicate code', async () => {
      mockDb.execute
        .mockRejectedValueOnce(new Error('UNIQUE constraint failed: coupons.code')); // INSERT fails
      await expect(service.createCoupon({ code: 'DUPLICATE', discountType: 'percentage', discountValue: 10, createdBy: 'admin' } as any)).rejects.toThrow('UNIQUE constraint');
    });
  });

  describe('trackCouponUsage', () => {
    it('records redemption and increments usage', async () => {
      const row = { id: 'c1', code: 'WELCOME25', discount_type: 'percentage', discount_value: 25, currency: 'USD', active: 1, current_uses: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' };
      mockDb.execute
        .mockResolvedValueOnce({ rows: [row] }) // getCouponByCode
        .mockResolvedValueOnce({ rows: [] }) // insert redemption
        .mockResolvedValueOnce({ rows: [] }); // increment usage

      await service.trackCouponUsage('WELCOME25', 'user-1', 'org-1', 'sub-1', 10000, 2500);
      expect(mockDb.execute).toHaveBeenCalledTimes(3);
      expect(mockDb.execute).toHaveBeenCalledWith(expect.objectContaining({ sql: expect.stringContaining('INSERT INTO coupon_redemptions') }));
      expect(mockDb.execute).toHaveBeenCalledWith(expect.objectContaining({ sql: expect.stringContaining('UPDATE coupons SET current_uses = current_uses + 1') }));
    });
  });
});
