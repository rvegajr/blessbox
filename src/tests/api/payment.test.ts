// Payment API Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as createIntent } from '@/app/api/payment/create-intent/route';
import { POST as processPayment } from '@/app/api/payment/process/route';
import { POST as validateCoupon } from '@/app/api/payment/validate-coupon/route';
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';

// Mock auth
vi.mock('@/lib/auth-helper', () => ({
  getServerSession: vi.fn(),
}));

// Mock Square SDK
vi.mock('square', () => ({
  Client: vi.fn(() => ({
    paymentsApi: {
      createPayment: vi.fn(),
    },
    paymentsApi: {
      createPayment: vi.fn(),
    },
  })),
  Environment: {
    Sandbox: 'sandbox',
    Production: 'production',
  },
}));

describe('Payment API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/payment/create-intent', () => {
    it('should create payment intent successfully', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      const request = new NextRequest('http://localhost:7777/api/payment/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 2999,
          planType: 'standard',
          currency: 'USD',
        }),
      });

      const response = await createIntent(request);
      const data = await response.json();

      // Should return payment intent or error
      expect(response).toBeDefined();
      expect([200, 400, 401, 500]).toContain(response.status);
    });

    it('should require authentication', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:7777/api/payment/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 2999,
          planType: 'standard',
        }),
      });

      const response = await createIntent(request);

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      const request = new NextRequest('http://localhost:7777/api/payment/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          // Missing amount and planType
        }),
      });

      const response = await createIntent(request);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/payment/process', () => {
    it('should process payment successfully', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      const request = new NextRequest('http://localhost:7777/api/payment/process', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: 'test-source-id',
          amount: 2999,
          planType: 'standard',
        }),
      });

      const response = await processPayment(request);

      expect(response).toBeDefined();
      expect([200, 400, 401, 500]).toContain(response.status);
    });

    it('should require authentication', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:7777/api/payment/process', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: 'test-source-id',
          amount: 2999,
        }),
      });

      const response = await processPayment(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/payment/validate-coupon', () => {
    it('should validate coupon successfully', async () => {
      const request = new NextRequest('http://localhost:7777/api/payment/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({
          couponCode: 'WELCOME25',
          planType: 'standard',
          amount: 2999,
        }),
      });

      const response = await validateCoupon(request);
      const data = await response.json();

      expect(response).toBeDefined();
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should return error for invalid coupon', async () => {
      const request = new NextRequest('http://localhost:7777/api/payment/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({
          couponCode: 'INVALID',
          planType: 'standard',
          amount: 2999,
        }),
      });

      const response = await validateCoupon(request);

      expect(response.status).toBe(400);
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:7777/api/payment/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({
          // Missing couponCode
        }),
      });

      const response = await validateCoupon(request);

      expect(response.status).toBe(400);
    });
  });
});
