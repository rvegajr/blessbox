'use client';

import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';

interface DashboardStatsData {
  registrations: {
    total: number;
    pending: number;
    delivered: number;
    cancelled: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    checkedIn: number;
  };
  qrCodes: {
    total: number;
    active: number;
    totalScans: number;
    totalRegistrations: number;
  };
  recentActivity: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to view dashboard statistics');
          return;
        }
        throw new Error('Failed to load stats');
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Registrations"
        value={stats.registrations.total}
        icon={<div className="text-4xl text-blue-100">📋</div>}
        change={stats.registrations.thisWeek > 0 ? {
          value: Math.round((stats.registrations.thisWeek / Math.max(stats.registrations.total - stats.registrations.thisWeek, 1)) * 100),
          type: 'increase',
          period: 'this week'
        } : undefined}
      />
      
      <StatCard
        title="Checked In"
        value={stats.registrations.checkedIn}
        icon={<div className="text-4xl text-green-100">✅</div>}
        change={stats.registrations.checkedIn > 0 ? {
          value: Math.round((stats.registrations.checkedIn / Math.max(stats.registrations.total, 1)) * 100),
          type: 'increase',
          period: 'check-in rate'
        } : undefined}
      />
      
      <StatCard
        title="Active QR Codes"
        value={stats.qrCodes.active}
        icon={<div className="text-4xl text-indigo-100">📱</div>}
      />
      
      <StatCard
        title="Today's Registrations"
        value={stats.registrations.today}
        icon={<div className="text-4xl text-purple-100">📅</div>}
      />
    </div>
  );
}








