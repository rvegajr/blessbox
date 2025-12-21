'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import Link from 'next/link';

interface AnalyticsSummaryProps {
  className?: string;
}

export function AnalyticsSummary({ className = '' }: AnalyticsSummaryProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await fetch('/api/admin/coupons/analytics');
      if (response.ok) {
        const analytics = await response.json();
        setData(analytics.overview);
      }
    } catch (err) {
      // Silently fail - summary is optional
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${className} p-4`}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Coupon Analytics</h3>
        <Link
          href="/admin/analytics"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View Full Report →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Coupons"
          value={data.totalCoupons || 0}
          className="p-4"
        />
        <MetricCard
          title="Active"
          value={data.activeCoupons || 0}
          className="p-4"
        />
        <MetricCard
          title="Redemptions"
          value={data.totalRedemptions || 0}
          className="p-4"
        />
        <MetricCard
          title="Total Discount"
          value={formatCurrency(data.totalDiscountGiven || 0)}
          className="p-4"
        />
      </div>
    </div>
  );
}
