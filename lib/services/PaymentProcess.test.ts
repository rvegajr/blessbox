/**
 * Payment Process Tests (TDD)
 * 
 * Tests the payment/process API endpoint behavior:
 * - Email requirement for authentication
 * - Session-based authentication
 * - Payment flow with email
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the auth helper
vi.mock('@/lib/auth-helper', () => ({
  getServerSession: vi.fn(),
}));

// Mock the subscriptions module
vi.mock('@/lib/subscriptions', () => ({
  createSubscription: vi.fn().mockResolvedValue({
    id: 'sub_123',
    organization_id: 'org_123',
    plan_type: 'standard',
    status: 'active',
  }),
  getOrCreateOrganizationForEmail: vi.fn().mockResolvedValue({
    id: 'org_123',
    name: 'Test Org',
  }),
  resolveOrganizationForSession: vi.fn().mockResolvedValue({
    id: 'org_123',
    name: 'Test Org',
  }),
  PlanType: {
    FREE: 'free',
    STANDARD: 'standard',
    ENTERPRISE: 'enterprise',
  },
}));

// Mock Square Payment Service
vi.mock('@/lib/services/SquarePaymentService', () => ({
  SquarePaymentService: vi.fn().mockImplementation(() => ({
    processPayment: vi.fn().mockResolvedValue({
      success: true,
      paymentId: 'pay_123',
    }),
  })),
}));

describe('Payment Process - Email Authentication', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Requirements', () => {
    it('should require email when no session exists', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue(null);

      // Create mock request without email
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'standard',
          billingCycle: 'monthly',
          currency: 'USD',
          amount: 1900,
        }),
      };

      // Act
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });

    it('should accept email in request body when no session exists', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue(null);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'standard',
          billingCycle: 'monthly',
          currency: 'USD',
          amount: 0,
          email: 'test@example.com',
        }),
      };

      // Act
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should use session email when available', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue({
        user: { email: 'session@example.com' },
      });

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'standard',
          billingCycle: 'monthly',
          currency: 'USD',
          amount: 0,
          // No email in body - should use session email
        }),
      };

      // Act
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should prioritize session email over body email', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/auth-helper');
      const { getOrCreateOrganizationForEmail, resolveOrganizationForSession } = await import('@/lib/subscriptions');
      
      (getServerSession as any).mockResolvedValue({
        user: { email: 'session@example.com' },
      });

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'standard',
          billingCycle: 'monthly',
          currency: 'USD',
          amount: 0,
          email: 'body@example.com',
        }),
      };

      // Act
      const { POST } = await import('@/app/api/payment/process/route');
      await POST(mockRequest as any);

      // Assert - session resolver should be called (not email-based)
      expect(resolveOrganizationForSession).toHaveBeenCalled();
    });
  });

  describe('Email Validation', () => {
    it('should reject empty email string', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue(null);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'standard',
          billingCycle: 'monthly',
          currency: 'USD',
          amount: 0,
          email: '',
        }),
      };

      // Act
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should reject whitespace-only email', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue(null);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'standard',
          billingCycle: 'monthly',
          currency: 'USD',
          amount: 0,
          email: '   ',
        }),
      };

      // Act
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });
  });
});
