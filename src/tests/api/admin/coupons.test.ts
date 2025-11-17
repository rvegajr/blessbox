import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/coupons/route';
import { db } from '@/lib/db';
import { coupons } from '@/lib/schema';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value, operator: 'eq' })),
  desc: vi.fn((field) => ({ field, direction: 'desc' })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  gte: vi.fn((field, value) => ({ field, value, operator: 'gte' })),
  lte: vi.fn((field, value) => ({ field, value, operator: 'lte' })),
  like: vi.fn((field, value) => ({ field, value, operator: 'like' })),
  or: vi.fn((...conditions) => ({ type: 'or', conditions })),
  sql: vi.fn((template) => template)
}));

const mockDb = db as any;

describe('Admin Coupons API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/coupons', () => {
    it('should return 401 when not authenticated', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/coupons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return coupons with OData support', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue({
        user: { email: 'admin@example.com' }
      });

      const mockCoupons = [
        {
          id: 1,
          code: 'WELCOME25',
          description: 'Welcome discount',
          discountType: 'percentage',
          discountValue: 25,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 2,
          code: 'SAVE50',
          description: 'Save 50%',
          discountType: 'fixed',
          discountValue: 5000,
          isActive: false,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02')
        }
      ];

      // Mock database chain
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue(mockCoupons);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit
      });

      mockFrom.mockReturnValue({
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit
      });

      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
        limit: mockLimit
      });

      mockOrderBy.mockReturnValue({
        limit: mockLimit
      });

      // Mock redemption count queries
      const mockRedemptionSelect = vi.fn().mockReturnThis();
      const mockRedemptionFrom = vi.fn().mockReturnThis();
      const mockRedemptionWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValueOnce({
        from: mockFrom,
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit
      }).mockReturnValueOnce({
        from: mockRedemptionFrom,
        where: mockRedemptionWhere
      });

      mockRedemptionFrom.mockReturnValue({
        where: mockRedemptionWhere
      });

      const request = new NextRequest('http://localhost:3000/api/admin/coupons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].code).toBe('WELCOME25');
    });

    it('should support OData filtering', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue({
        user: { email: 'admin@example.com' }
      });

      const mockCoupons = [
        {
          id: 1,
          code: 'WELCOME25',
          description: 'Welcome discount',
          discountType: 'percentage',
          discountValue: 25,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      // Mock database chain
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue(mockCoupons);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit
      });

      mockFrom.mockReturnValue({
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit
      });

      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
        limit: mockLimit
      });

      mockOrderBy.mockReturnValue({
        limit: mockLimit
      });

      // Mock redemption count queries
      const mockRedemptionSelect = vi.fn().mockReturnThis();
      const mockRedemptionFrom = vi.fn().mockReturnThis();
      const mockRedemptionWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValueOnce({
        from: mockFrom,
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit
      }).mockReturnValueOnce({
        from: mockRedemptionFrom,
        where: mockRedemptionWhere
      });

      mockRedemptionFrom.mockReturnValue({
        where: mockRedemptionWhere
      });

      const request = new NextRequest('http://localhost:3000/api/admin/coupons?$filter=isActive eq true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should support OData pagination', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue({
        user: { email: 'admin@example.com' }
      });

      const mockCoupons = [];

      // Mock database chain
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue(mockCoupons);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit
      });

      mockFrom.mockReturnValue({
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit
      });

      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
        limit: mockLimit
      });

      mockOrderBy.mockReturnValue({
        limit: mockLimit
      });

      // Mock redemption count queries
      const mockRedemptionSelect = vi.fn().mockReturnThis();
      const mockRedemptionFrom = vi.fn().mockReturnThis();
      const mockRedemptionWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValueOnce({
        from: mockFrom,
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit
      }).mockReturnValueOnce({
        from: mockRedemptionFrom,
        where: mockRedemptionWhere
      });

      mockRedemptionFrom.mockReturnValue({
        where: mockRedemptionWhere
      });

      const request = new NextRequest('http://localhost:3000/api/admin/coupons?$top=10&$skip=5');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/admin/coupons', () => {
    it('should return 401 when not authenticated', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST25',
          discountType: 'percentage',
          discountValue: 25
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should create a new coupon', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue({
        user: { email: 'admin@example.com' }
      });

      const newCoupon = {
        id: 1,
        code: 'TEST25',
        description: 'Test coupon',
        discountType: 'percentage',
        discountValue: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock database operations
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue([]); // No existing coupon

      const mockInsert = vi.fn().mockReturnThis();
      const mockValues = vi.fn().mockReturnThis();
      const mockReturning = vi.fn().mockResolvedValue([newCoupon]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
        limit: mockLimit
      });

      mockFrom.mockReturnValue({
        where: mockWhere,
        limit: mockLimit
      });

      mockWhere.mockReturnValue({
        limit: mockLimit
      });

      mockDb.insert.mockReturnValue({
        values: mockValues,
        returning: mockReturning
      });

      const request = new NextRequest('http://localhost:3000/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST25',
          description: 'Test coupon',
          discountType: 'percentage',
          discountValue: 25
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.coupon.code).toBe('TEST25');
    });

    it('should return 400 for missing required fields', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue({
        user: { email: 'admin@example.com' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST25'
          // Missing discountType and discountValue
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid discount type', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue({
        user: { email: 'admin@example.com' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST25',
          discountType: 'invalid',
          discountValue: 25
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid discountType');
    });

    it('should return 400 for invalid percentage discount', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue({
        user: { email: 'admin@example.com' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST25',
          discountType: 'percentage',
          discountValue: 150 // Invalid: > 100
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Percentage discount must be between 0 and 100');
    });

    it('should return 409 for duplicate coupon code', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue({
        user: { email: 'admin@example.com' }
      });

      // Mock existing coupon
      const existingCoupon = {
        id: 1,
        code: 'TEST25',
        description: 'Existing coupon',
        discountType: 'percentage',
        discountValue: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue([existingCoupon]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
        limit: mockLimit
      });

      mockFrom.mockReturnValue({
        where: mockWhere,
        limit: mockLimit
      });

      mockWhere.mockReturnValue({
        limit: mockLimit
      });

      const request = new NextRequest('http://localhost:3000/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST25',
          discountType: 'percentage',
          discountValue: 25
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Coupon code already exists');
    });
  });
});
