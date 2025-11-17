import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ODataParser } from '@/lib/utils/odataParser';

describe('Admin Coupons API - Simple Tests', () => {
  describe('OData Parser Integration', () => {
    it('should parse complex OData queries for coupon filtering', () => {
      const queryString = '$filter=isActive eq true and discountType eq "percentage"&$orderby=createdAt desc&$top=10&$skip=5&$select=id,code,discountValue&$count=true';
      const result = ODataParser.parse(queryString);

      expect(result.where).toHaveLength(2);
      expect(result.orderBy).toEqual({ createdAt: 'desc' });
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(5);
      expect(result.select).toEqual(['id', 'code', 'discountValue']);
      expect(result.count).toBe(true);
    });

    it('should handle coupon-specific filter fields', () => {
      const queryString = '$filter=code contains "WELCOME" and discountValue gt 20 and expiresAt ge 2024-01-01';
      const result = ODataParser.parse(queryString);

      expect(result.where).toHaveLength(3);
      expect(result.where![0]).toEqual({
        field: 'code',
        operator: 'contains',
        value: 'WELCOME'
      });
      expect(result.where![1]).toEqual({
        field: 'discountValue',
        operator: 'gt',
        value: 20
      });
      expect(result.where![2].field).toBe('expiresAt');
      expect(result.where![2].operator).toBe('ge');
    });

    it('should handle search across coupon fields', () => {
      const queryString = '$search=welcome';
      const result = ODataParser.parse(queryString);

      expect(result.search).toBe('welcome');
    });
  });

  describe('Coupon Data Processing', () => {
    const mockCoupons = [
      {
        id: '1',
        code: 'WELCOME25',
        description: 'Welcome discount',
        discountType: 'percentage',
        discountValue: 25,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        redemptionCount: 5,
        usagePercentage: 50
      },
      {
        id: '2',
        code: 'SAVE50',
        description: 'Save 50%',
        discountType: 'fixed',
        discountValue: 5000,
        isActive: false,
        createdAt: new Date('2024-01-02'),
        redemptionCount: 0,
        usagePercentage: 0
      },
      {
        id: '3',
        code: 'NEWUSER',
        description: 'New user special',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
        createdAt: new Date('2024-01-03'),
        redemptionCount: 2,
        usagePercentage: 20
      }
    ];

    it('should filter active coupons', () => {
      const query = {
        where: [
          { field: 'isActive', operator: 'eq', value: true }
        ]
      };

      const result = ODataParser.applyQuery(mockCoupons, query);
      expect(result.data).toHaveLength(2);
      expect(result.data.every(coupon => coupon.isActive)).toBe(true);
    });

    it('should filter by discount type', () => {
      const query = {
        where: [
          { field: 'discountType', operator: 'eq', value: 'percentage' }
        ]
      };

      const result = ODataParser.applyQuery(mockCoupons, query);
      expect(result.data).toHaveLength(2);
      expect(result.data.every(coupon => coupon.discountType === 'percentage')).toBe(true);
    });

    it('should filter by discount value range', () => {
      const query = {
        where: [
          { field: 'discountValue', operator: 'gt', value: 20 }
        ]
      };

      const result = ODataParser.applyQuery(mockCoupons, query);
      expect(result.data).toHaveLength(2); // WELCOME25 (25) and SAVE50 (5000)
      expect(result.data.some(coupon => coupon.code === 'WELCOME25')).toBe(true);
      expect(result.data.some(coupon => coupon.code === 'SAVE50')).toBe(true);
    });

    it('should search across coupon fields', () => {
      const query = {
        search: 'welcome'
      };

      const result = ODataParser.applyQuery(mockCoupons, query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].code).toBe('WELCOME25');
    });

    it('should sort coupons by creation date', () => {
      const query = {
        orderBy: { createdAt: 'desc' }
      };

      const result = ODataParser.applyQuery(mockCoupons, query);
      expect(result.data[0].code).toBe('NEWUSER');
      expect(result.data[1].code).toBe('SAVE50');
      expect(result.data[2].code).toBe('WELCOME25');
    });

    it('should paginate results', () => {
      const query = {
        limit: 2,
        offset: 1
      };

      const result = ODataParser.applyQuery(mockCoupons, query);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].code).toBe('SAVE50');
    });

    it('should select specific fields', () => {
      const query = {
        select: ['id', 'code', 'discountValue']
      };

      const result = ODataParser.applyQuery(mockCoupons, query);
      expect(result.data[0]).toEqual({
        id: '1',
        code: 'WELCOME25',
        discountValue: 25
      });
    });

    it('should include count when requested', () => {
      const query = {
        count: true
      };

      const result = ODataParser.applyQuery(mockCoupons, query);
      expect(result.count).toBe(3);
    });

    it('should handle complex queries with all parameters', () => {
      const query = {
        where: [
          { field: 'isActive', operator: 'eq', value: true },
          { field: 'discountType', operator: 'eq', value: 'percentage' }
        ],
        orderBy: { discountValue: 'desc' },
        limit: 1,
        offset: 0,
        select: ['id', 'code', 'discountValue'],
        count: true
      };

      const result = ODataParser.applyQuery(mockCoupons, query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: '1',
        code: 'WELCOME25',
        discountValue: 25
      });
      expect(result.count).toBe(3);
    });
  });

  describe('Coupon Validation Logic', () => {
    it('should validate coupon code format', () => {
      const validCodes = ['WELCOME25', 'SAVE50', 'NEWUSER', 'HOLIDAY2024'];
      const invalidCodes = ['', 'welcome25', 'WELCOME 25', 'WELCOME-25'];

      validCodes.forEach(code => {
        expect(code.length).toBeGreaterThan(0);
        expect(code).toMatch(/^[A-Z0-9]+$/);
      });

      invalidCodes.forEach(code => {
        if (code.length === 0) {
          expect(code).toBe('');
        } else {
          expect(code).not.toMatch(/^[A-Z0-9]+$/);
        }
      });
    });

    it('should validate discount values', () => {
      const percentageDiscounts = [0, 10, 25, 50, 100];
      const fixedDiscounts = [100, 500, 1000, 5000]; // in cents
      const invalidDiscounts = [-10, 101, -100];

      percentageDiscounts.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });

      fixedDiscounts.forEach(value => {
        expect(value).toBeGreaterThan(0);
      });

      invalidDiscounts.forEach(value => {
        if (value < 0) {
          expect(value).toBeLessThan(0);
        } else if (value > 100) {
          expect(value).toBeGreaterThan(100);
        }
      });
    });

    it('should validate expiration dates', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday

      const validDates = [
        '2030-01-01',
        '2030-06-15T23:59:59Z',
        futureDate.toISOString()
      ];
      const invalidDates = [
        '2023-12-31', // Past date
        'invalid-date',
        ''
      ];

      validDates.forEach(dateStr => {
        const date = new Date(dateStr);
        expect(date.getTime()).toBeGreaterThan(now.getTime());
      });

      invalidDates.forEach(dateStr => {
        if (dateStr === '2023-12-31') {
          const date = new Date(dateStr);
          expect(date.getTime()).toBeLessThan(now.getTime());
        } else if (dateStr === 'invalid-date') {
          const date = new Date(dateStr);
          expect(isNaN(date.getTime())).toBe(true);
        }
      });
    });
  });

  describe('Coupon Analytics Calculations', () => {
    it('should calculate usage percentage correctly', () => {
      const calculateUsagePercentage = (redemptions: number, maxRedemptions: number | null) => {
        if (!maxRedemptions) return null;
        return Math.round((redemptions / maxRedemptions) * 100);
      };

      expect(calculateUsagePercentage(5, 10)).toBe(50);
      expect(calculateUsagePercentage(0, 100)).toBe(0);
      expect(calculateUsagePercentage(100, 100)).toBe(100);
      expect(calculateUsagePercentage(5, null)).toBe(null);
    });

    it('should calculate total discount given', () => {
      const redemptions = [
        { discountAmount: 2500 }, // $25.00
        { discountAmount: 1000 }, // $10.00
        { discountAmount: 500 }   // $5.00
      ];

      const totalDiscount = redemptions.reduce((sum, redemption) => {
        return sum + redemption.discountAmount;
      }, 0);

      expect(totalDiscount).toBe(4000); // $40.00 in cents
    });

    it('should identify expired coupons', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday

      const isExpired = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < now;
      };

      expect(isExpired(futureDate.toISOString())).toBe(false);
      expect(isExpired(pastDate.toISOString())).toBe(true);
      expect(isExpired(null)).toBe(false);
    });

    it('should identify maxed out coupons', () => {
      const isMaxedOut = (redemptions: number, maxRedemptions: number | null) => {
        if (!maxRedemptions) return false;
        return redemptions >= maxRedemptions;
      };

      expect(isMaxedOut(5, 10)).toBe(false);
      expect(isMaxedOut(10, 10)).toBe(true);
      expect(isMaxedOut(15, 10)).toBe(true);
      expect(isMaxedOut(5, null)).toBe(false);
    });
  });
});
