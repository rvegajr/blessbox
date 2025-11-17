'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Activity {
  type: 'registration';
  id: string;
  timestamp: string;
  data: {
    registrantName: string;
    registrantEmail: string | null;
    qrCodeLabel: string;
    checkedIn: boolean;
  };
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/dashboard/recent-activity?limit=10');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setActivities(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to load recent activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-600">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Link
          href="/dashboard/registrations"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All →
        </Link>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
              activity.data.checkedIn ? 'bg-green-500' : 'bg-blue-500'
            }`}></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.data.registrantName}
                </p>
                <span className="text-xs text-gray-500 ml-2">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                Registered via <span className="font-medium">{activity.data.qrCodeLabel}</span>
                {activity.data.checkedIn && (
                  <span className="ml-2 text-green-600">✓ Checked in</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}








