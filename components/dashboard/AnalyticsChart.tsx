'use client';

import { useEffect, useState } from 'react';

interface Trend {
  date: string;
  count: number;
}

interface AnalyticsData {
  trends: Trend[];
  statusBreakdown: Record<string, number>;
  qrPerformance: Array<{
    id: string;
    label: string;
    scans: number;
    registrations: number;
    conversionRate: string;
  }>;
  checkInRate: number;
  checkInStats: {
    total: number;
    checkedIn: number;
  };
}

export function AnalyticsChart() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await fetch(`/api/dashboard/analytics?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-sm">Analytics data unavailable</p>
      </div>
    );
  }

  // Simple bar chart visualization
  const maxCount = Math.max(...data.trends.map(t => t.count), 1);
  
  return (
    <div id="event-analytics" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-tutorial-target="event-analytics">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Registration Trends</h3>
        <div className="flex space-x-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="mt-6">
        <div className="flex items-end justify-between space-x-1 h-64">
          {data.trends.map((trend, index) => {
            const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end justify-center" style={{ height: '200px' }}>
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer group relative"
                    style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                    title={`${trend.date}: ${trend.count} registrations`}
                  >
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                      {trend.count} on {new Date(trend.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap" style={{ height: '60px' }}>
                  {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Breakdown */}
      {Object.keys(data.statusBreakdown).length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Status Breakdown</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Stats */}
      {data.checkInStats.total > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Check-in Rate</h4>
              <p className="text-2xl font-bold text-green-600">{data.checkInRate}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{data.checkInStats.checkedIn} of {data.checkInStats.total}</p>
              <p className="text-xs text-gray-500">checked in</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




