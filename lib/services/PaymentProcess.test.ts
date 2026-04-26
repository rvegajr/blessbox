/**
 * Payment Process Tests (TDD)
 *
 * Covers the security-hardened /api/payment/process route:
 *   - requires an authenticated session (no body-email fallback)
 *   - derives amount server-side from planType (price-tampering defense)
 *   - re-validates coupons server-side
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/auth-helper', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/subscriptions', () => ({
  createSubscription: vi.fn().mockResolvedValue({
    id: 'sub_123',
    organization_id: 'org_123',
    plan_type: 'enterprise',
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
  planPricingCents: { free: 0, standard: 1900, enterprise: 9900 },
  planRegistrationLimits: { free: 100, standard: 5000, enterprise: 50000 },
  PlanType: { FREE: 'free', STANDARD: 'standard', ENTERPRISE: 'enterprise' },
}));

const processPaymentMock = vi.fn().mockResolvedValue({ success: true, paymentId: 'pay_123' });
vi.mock('@/lib/services/SquarePaymentService', () => ({
  SquarePaymentService: vi.fn().mockImplementation(() => ({
    processPayment: processPaymentMock,
  })),
}));

vi.mock('@/lib/coupons', () => ({
  CouponService: vi.fn().mockImplementation(() => ({
    validateCoupon: vi.fn().mockResolvedValue({ valid: false, error: 'Coupon not found' }),
    applyCoupon: vi.fn(),
  })),
}));

// Force mock-payment branch so we don't actually call Square in tests.
const ORIG_ENV = { ...process.env };

describe('Payment Process API', () => {
  beforeEach(() => {
    vi.resetModules();
    processPaymentMock.mockClear();
    process.env = { ...ORIG_ENV, NODE_ENV: 'test', TEST_ENV: 'local', FORCE_REAL_SQUARE: '' };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    process.env = ORIG_ENV;
  });

  describe('Authentication', () => {
    it('rejects unauthenticated requests (no session)', async () => {
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue(null);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ planType: 'standard', amount: 1900 }),
      };
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('IGNORES body.email fallback (no email-based provisioning)', async () => {
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue(null);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'enterprise',
          email: 'attacker@example.com',
          amount: 1,
        }),
      };
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      expect(response.status).toBe(401);
    });

    it('accepts authenticated session and resolves org from session', async () => {
      const { getServerSession } = await import('@/lib/auth-helper');
      const { resolveOrganizationForSession } = await import('@/lib/subscriptions');
      (getServerSession as any).mockResolvedValue({ user: { email: 'user@example.com' } });

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'standard',
          paymentToken: 'cnon:test-token',
        }),
      };
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(resolveOrganizationForSession).toHaveBeenCalled();
    });
  });

  describe('Price tampering defense', () => {
    it('IGNORES client amount=1 for enterprise; charges canonical 9900 cents', async () => {
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue({ user: { email: 'user@example.com' } });

      // Force the real Square path so we can inspect the amount it would charge.
      vi.stubEnv('NODE_ENV', 'production');
      process.env.SQUARE_ACCESS_TOKEN = 'test-tok';
      process.env.SQUARE_APPLICATION_ID = 'test-app';
      process.env.SQUARE_LOCATION_ID = 'test-loc';
      process.env.FORCE_REAL_SQUARE = 'true';

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'enterprise',
          paymentToken: 'cnon:test-token',
          amount: 1, // <-- tampering attempt
        }),
      };
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.chargedAmountCents).toBe(9900);
      // SquarePaymentService.processPayment(token, amountCents, currency, orgId)
      expect(processPaymentMock).toHaveBeenCalledWith(
        'cnon:test-token',
        9900,
        'USD',
        'org_123',
      );
    });

    it('rejects unknown planType', async () => {
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue({ user: { email: 'user@example.com' } });

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ planType: 'platinum', amount: 1 }),
      };
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      expect(response.status).toBe(400);
    });

    it('requires paymentToken for paid plans', async () => {
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue({ user: { email: 'user@example.com' } });

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ planType: 'enterprise' }),
      };
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toMatch(/paymentToken/i);
    });
  });

  describe('Coupon re-validation', () => {
    it('rejects an invalid coupon code server-side', async () => {
      const { getServerSession } = await import('@/lib/auth-helper');
      (getServerSession as any).mockResolvedValue({ user: { email: 'user@example.com' } });

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          planType: 'enterprise',
          paymentToken: 'cnon:test-token',
          couponCode: 'FAKE100',
        }),
      };
      const { POST } = await import('@/app/api/payment/process/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toMatch(/Coupon not found|Invalid coupon/);
    });
  });
});
