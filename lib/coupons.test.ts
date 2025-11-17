// CouponService Unit Tests - TDD First!
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CouponService } from './coupons';
import { ICouponService, CouponValidationResult, CouponCreate } from './interfaces/ICouponService';

// Mock database client
const mockDb = {
  execute: vi.fn(),
};

// Mock the database module
vi.mock('./db', () => ({
  getDbClient: () => mockDb,
  ensureSubscriptionSchema: vi.fn(),
  nowIso: () => '2024-01-01T00:00:00Z',
}));

describe('CouponService', () => {
  let couponService: ICouponService;

  beforeEach(() => {
    vi.clearAllMocks();
    couponService = new CouponService();
  });

  describe('validateCoupon', () => {
    it('should return valid=true for active coupon', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'WELCOME25',
        discount_type: 'percentage',
        discount_value: 25,
        currency: 'USD',
        active: 1,
        max_uses: 100,
        current_uses: 0,
        expires_at: '2025-12-31T23:59:59Z',
        applicable_plans: JSON.stringify(['standard', 'enterprise']),
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute.mockResolvedValue({
        rows: [mockCoupon]
      });

      // Act
      const result = await couponService.validateCoupon('WELCOME25');

      // Assert
      expect(result.valid).toBe(true);
      expect(result.discount).toEqual({
        type: 'percentage',
        value: 25,
        currency: 'USD'
      });
    });

    it('should return valid=false for non-existent coupon', async () => {
      // Arrange
      mockDb.execute.mockResolvedValue({ rows: [] });

      // Act
      const result = await couponService.validateCoupon('INVALID');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon not found');
    });

    it('should return valid=false for inactive coupon', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'INACTIVE',
        active: 0
      };

      mockDb.execute.mockResolvedValue({ rows: [mockCoupon] });

      // Act
      const result = await couponService.validateCoupon('INACTIVE');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon is inactive');
    });

    it('should return valid=false for expired coupon', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'EXPIRED',
        active: 1,
        expires_at: '2023-01-01T00:00:00Z'
      };

      mockDb.execute.mockResolvedValue({ rows: [mockCoupon] });

      // Act
      const result = await couponService.validateCoupon('EXPIRED');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon has expired');
    });

    it('should return valid=false for exhausted coupon', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'EXHAUSTED',
        active: 1,
        max_uses: 10,
        current_uses: 10,
        expires_at: '2025-12-31T23:59:59Z',
        applicable_plans: null,
        discount_type: 'percentage',
        discount_value: 10,
        currency: 'USD',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute.mockResolvedValue({ rows: [mockCoupon] });

      // Act
      const result = await couponService.validateCoupon('EXHAUSTED');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon has reached maximum uses');
    });

    it('should return valid=true for unlimited use coupon', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'UNLIMITED',
        active: 1,
        max_uses: null,
        current_uses: 1000,
        expires_at: '2025-12-31T23:59:59Z',
        applicable_plans: null,
        discount_type: 'percentage',
        discount_value: 10,
        currency: 'USD',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute.mockResolvedValue({ rows: [mockCoupon] });

      // Act
      const result = await couponService.validateCoupon('UNLIMITED');

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  describe('applyCoupon', () => {
    it('should calculate percentage discount correctly', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'WELCOME25',
        discount_type: 'percentage',
        discount_value: 25,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['standard']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2025-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // validateCoupon -> getCouponByCode
        .mockResolvedValueOnce({ rows: [mockCoupon] }); // applyCoupon -> getCouponByCode

      // Act
      const result = await couponService.applyCoupon('WELCOME25', 100, 'standard');

      // Assert
      expect(result).toBe(75); // 100 - 25% = 75
    });

    it('should calculate fixed discount correctly', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'FIXED5',
        discount_type: 'fixed',
        discount_value: 5,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['standard']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2025-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // validateCoupon -> getCouponByCode
        .mockResolvedValueOnce({ rows: [mockCoupon] }); // applyCoupon -> getCouponByCode

      // Act
      const result = await couponService.applyCoupon('FIXED5', 20, 'standard');

      // Assert
      expect(result).toBe(15); // 20 - 5 = 15
    });

    it('should not discount below minimum amount', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'BIGDISCOUNT',
        discount_type: 'fixed',
        discount_value: 50,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['standard']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2025-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // validateCoupon -> getCouponByCode
        .mockResolvedValueOnce({ rows: [mockCoupon] }); // applyCoupon -> getCouponByCode

      // Act
      const result = await couponService.applyCoupon('BIGDISCOUNT', 30, 'standard');

      // Assert
      expect(result).toBe(100); // Minimum $1.00 (100 cents)
    });

    it('should allow 100% discount (free)', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'FREE100',
        discount_type: 'percentage',
        discount_value: 100,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['standard']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2025-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // validateCoupon -> getCouponByCode
        .mockResolvedValueOnce({ rows: [mockCoupon] }); // applyCoupon -> getCouponByCode

      // Act
      const result = await couponService.applyCoupon('FREE100', 50, 'standard');

      // Assert
      expect(result).toBe(0); // 100% off = free
    });

    it('should throw error for invalid coupon', async () => {
      // Arrange
      mockDb.execute.mockResolvedValue({ rows: [] });

      // Act & Assert
      await expect(couponService.applyCoupon('INVALID', 100, 'standard'))
        .rejects.toThrow('Coupon not found');
    });

    it('should throw error for inapplicable plan', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'ENTERPRISEONLY',
        discount_type: 'percentage',
        discount_value: 25,
        currency: 'USD',
        active: 1,
        applicable_plans: JSON.stringify(['enterprise']),
        max_uses: 100,
        current_uses: 0,
        expires_at: '2025-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // validateCoupon -> getCouponByCode
        .mockResolvedValueOnce({ rows: [mockCoupon] }); // applyCoupon -> getCouponByCode

      // Act & Assert
      await expect(couponService.applyCoupon('ENTERPRISEONLY', 100, 'standard'))
        .rejects.toThrow('Coupon not applicable to this plan');
    });
  });

  describe('createCoupon', () => {
    it('should create coupon with all fields', async () => {
      // Arrange
      const couponData: CouponCreate = {
        code: 'NEWCOUPON',
        discountType: 'percentage',
        discountValue: 20,
        currency: 'USD',
        maxUses: 50,
        expiresAt: '2024-12-31T23:59:59Z',
        applicablePlans: ['standard', 'enterprise'],
        createdBy: 'admin-123'
      };

      const mockCreatedCoupon = {
        id: 'coupon-123',
        code: 'NEWCOUPON',
        discount_type: 'percentage',
        discount_value: 20,
        currency: 'USD',
        active: 1,
        max_uses: 50,
        current_uses: 0,
        expires_at: '2025-12-31T23:59:59Z',
        applicable_plans: JSON.stringify(['standard', 'enterprise']),
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin-123',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [] }) // INSERT
        .mockResolvedValueOnce({ rows: [mockCreatedCoupon] }); // getCoupon SELECT

      // Act
      const result = await couponService.createCoupon(couponData);

      // Assert
      expect(result.code).toBe('NEWCOUPON');
      expect(result.discountType).toBe('percentage');
      expect(result.discountValue).toBe(20);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('INSERT INTO coupons')
        })
      );
    });

    it('should throw error for duplicate code', async () => {
      // Arrange
      const couponData: CouponCreate = {
        code: 'DUPLICATE',
        discountType: 'percentage',
        discountValue: 10,
        createdBy: 'admin-123'
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // getCouponByCode
        .mockResolvedValueOnce({ rows: [] }) // insert redemption
        .mockResolvedValueOnce({ rows: [] }); // update usage counter

      // Act
      await couponService.trackCouponUsage('WELCOME25', 'user-123', 'org-456', 'sub-789', 100, 25);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledTimes(15); // 6 for schema + 3 for actual calls
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('INSERT INTO coupon_redemptions')
        })
      );
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('UPDATE coupons SET current_uses = current_uses + 1')
        })
      );
    });
  });

  describe('trackCouponUsage', () => {
    it('should record coupon usage and increment counter', async () => {
      // Arrange
      const mockCoupon = {
        id: '1',
        code: 'WELCOME25',
        current_uses: 5,
        discount_type: 'percentage',
        discount_value: 25,
        currency: 'USD',
        active: 1,
        max_uses: 100,
        expires_at: '2025-12-31T23:59:59Z',
        applicable_plans: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // getCouponByCode
        .mockResolvedValueOnce({ rows: [] }) // insert redemption
        .mockResolvedValueOnce({ rows: [] }); // update usage counter

      // Act
      await couponService.trackCouponUsage('WELCOME25', 'user-123', 'org-456', 'sub-789', 100, 25);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledTimes(15); // 6 for schema + 3 for actual calls
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('INSERT INTO coupon_redemptions')
        })
      );
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('UPDATE coupons SET current_uses')
        })
      );
    });

    it('should throw error if coupon not found', async () => {
      // Arrange
      mockDb.execute.mockResolvedValue({ rows: [] });

      // Act & Assert
      await expect(couponService.trackCouponUsage('INVALID', 'user-123', 'org-456', 'sub-789', 100, 25))
        .rejects.toThrow('Coupon not found');
    });
  });

  describe('deactivateCoupon', () => {
    it('should set active to false', async () => {
      // Arrange
      mockDb.execute.mockResolvedValue({ rows: [] });

      // Act
      await couponService.deactivateCoupon('coupon-123');

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('UPDATE coupons SET active = ?')
        })
      );
    });
  });

  describe('getCouponAnalytics', () => {
    it('should return analytics for specific coupon', async () => {
      // Arrange
      const mockAnalytics = {
        totalRedemptions: 25,
        totalDiscountGiven: 500,
        averageDiscount: 20,
        redemptionRate: 0.75
      };

      mockDb.execute.mockResolvedValue({ rows: [mockAnalytics] });

      // Act
      const result = await couponService.getCouponAnalytics('coupon-123');

      // Assert
      expect(result.totalRedemptions).toBe(25);
      expect(result.totalDiscountGiven).toBe(500);
      expect(result.averageDiscount).toBe(20);
      expect(result.redemptionRate).toBe(0.75);
    });
  });
});
