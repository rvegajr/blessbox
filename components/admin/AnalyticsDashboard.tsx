'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import Link from 'next/link';

interface AnalyticsData {
  overview: {
    totalCoupons: number;
    activeCoupons: number;
    expiredCoupons: number;
    totalRedemptions: number;
    totalDiscountGiven: number;
    conversionRate: number;
  };
  topCoupons: Array<{
    id: string;
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
    redemptionCount: number;
    totalDiscount: number;
  }>;
  redemptionTrends: Array<{
    date: string;
    count: number;
    totalDiscount: number;
  }>;
  performanceByType: Array<{
    discountType: string;
    count: number;
    redemptions: number;
    totalDiscount: number;
  }>;
  recentActivity: Array<{
    id: string;
    couponCode: string;
    organizationId: string;
    discountAmount: number;
    redeemedAt: string;
    orderId?: string;
  }>;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/coupons/analytics');

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`${className} p-6`}>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} p-6`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">Error: {error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`${className} p-6`}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Coupon Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights into coupon performance</p>
        </div>
        <Link
          href="/admin/coupons"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Manage Coupons →
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Coupons"
          value={data.overview.totalCoupons}
          icon="🎫"
          description="All coupons created"
        />
        <MetricCard
          title="Active Coupons"
          value={data.overview.activeCoupons}
          icon="✅"
          description="Currently active"
        />
        <MetricCard
          title="Total Redemptions"
          value={data.overview.totalRedemptions}
          icon="📊"
          description="Times coupons used"
        />
        <MetricCard
          title="Total Discount Given"
          value={formatCurrency(data.overview.totalDiscountGiven)}
          icon="💰"
          description="Total savings applied"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.overview.conversionRate}%`}
          icon="📈"
          description="Coupon usage rate"
        />
        <MetricCard
          title="Expired Coupons"
          value={data.overview.expiredCoupons}
          icon="⏰"
          description="No longer valid"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Coupons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Coupons</h3>
          {data.topCoupons.length > 0 ? (
            <div className="space-y-4">
              {data.topCoupons.map((coupon, index) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 font-mono">{coupon.code}</p>
                      <p className="text-sm text-gray-600">{coupon.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{coupon.redemptionCount}</p>
                    <p className="text-xs text-gray-500">redemptions</p>
                    <p className="text-sm text-green-600 mt-1">
                      {formatCurrency(coupon.totalDiscount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No coupon data available</p>
          )}
        </div>

        {/* Performance by Type */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Discount Type</h3>
          {data.performanceByType.length > 0 ? (
            <div className="space-y-4">
              {data.performanceByType.map((type) => (
                <div
                  key={type.discountType}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900 capitalize">
                      {type.discountType}
                    </span>
                    <span className="text-sm text-gray-600">
                      {type.count} coupons
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Redemptions</p>
                      <p className="text-lg font-semibold text-gray-900">{type.redemptions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Discount</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(type.totalDiscount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No type data available</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Redemption Activity</h3>
          {data.recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Coupon
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Organization
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.recentActivity.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(activity.redeemedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-gray-900">
                          {activity.couponCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(activity.discountAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {activity.organizationId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
