'use client';

import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
