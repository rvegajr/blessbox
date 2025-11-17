import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

// Mock fetch
global.fetch = vi.fn();

const mockAnalyticsData = {
  overview: {
    totalCoupons: 25,
    activeCoupons: 15,
    expiredCoupons: 3,
    totalRedemptions: 150,
    totalDiscountGiven: 500000,
    conversionRate: 75
  },
  topCoupons: [
    {
      id: '1',
      code: 'WELCOME25',
      description: 'Welcome discount',
      discountType: 'percentage',
      discountValue: 25,
      redemptionCount: 50,
      totalDiscount: 250000
    },
    {
      id: '2',
      code: 'SAVE50',
      description: 'Save 50%',
      discountType: 'fixed',
      discountValue: 5000,
      redemptionCount: 30,
      totalDiscount: 150000
    }
  ],
  redemptionTrends: [
    { date: '2024-01-01', count: 10, totalDiscount: 50000 },
    { date: '2024-01-02', count: 15, totalDiscount: 75000 }
  ],
  performanceByType: [
    { discountType: 'percentage', count: 15, redemptions: 100, totalDiscount: 300000 },
    { discountType: 'fixed', count: 10, redemptions: 50, totalDiscount: 200000 }
  ],
  recentActivity: [
    {
      id: '1',
      couponCode: 'WELCOME25',
      organizationId: 'org1',
      discountAmount: 2500,
      redeemedAt: '2024-01-15T10:00:00Z',
      orderId: 'order1'
    }
  ]
};

describe('AnalyticsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve(mockAnalyticsData)
    });
  });

  describe('Rendering', () => {
    it('should render analytics dashboard', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Coupon Analytics')).toBeInTheDocument();
      });
    });

    it('should display loading state', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display overview stats', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Coupons')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('Active Coupons')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
      });
    });

    it('should display top performing coupons', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Top Performing Coupons')).toBeInTheDocument();
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
        expect(screen.getByText('SAVE50')).toBeInTheDocument();
      });
    });

    it('should display recent activity', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
