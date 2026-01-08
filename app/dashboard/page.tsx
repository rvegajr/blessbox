"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { UsageBar } from '@/components/dashboard/UsageBar';
import { CancelModal } from '@/components/subscription/CancelModal';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';
import type { UsageDisplayData } from '@/lib/interfaces/IUsageDisplay';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { status } = useAuth();
  const { ready } = useRequireActiveOrganization();
  const [subscription, setSubscription] = useState<any | null>(null);
  const [usage, setUsage] = useState<UsageDisplayData | null>(null);
  // Classes and Participants features hidden for MVP
  // const [classes, setClasses] = useState<any[]>([]);
  // const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ready || status === 'loading') return;
      try {
        const [subscriptionRes, usageRes] = await Promise.all([
          fetch('/api/subscriptions'),
          fetch('/api/usage'),
          // Classes and Participants APIs hidden for MVP
          // fetch('/api/classes'),
          // fetch('/api/participants')
        ]);
        
        if (!ignore) {
          const subscriptionData = await subscriptionRes.json();
          setSubscription(subscriptionData.subscription || null);
          
          const usageData = await usageRes.json();
          if (usageData.success && usageData.data) {
            setUsage(usageData.data);
          }
          
          // Classes and Participants data fetching hidden for MVP
          // const classesData = await classesRes.json();
          // setClasses(classesData);
          
          // const participantsData = await participantsRes.json();
          // setParticipants(participantsData);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [ready, status]);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        {loading ? (
          <div className="flex items-center justify-center p-8" data-testid="loading-dashboard" data-loading="true">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dashboard Stats */}
            <div id="stats-cards" data-tutorial-target="stats-cards">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              <DashboardStats />
            </div>

            {/* Usage Bar - Consolidated with Subscription Info */}
            {usage && (
              <div id="usage-bar" data-tutorial-target="usage-bar">
                <UsageBar 
                  usage={usage} 
                  subscription={subscription ? {
                    status: subscription.status as 'active' | 'canceling' | 'canceled' | 'none',
                    currentPeriodEnd: subscription.current_period_end,
                  } : null}
                  showUpgradeLink={usage.planType !== 'enterprise'} 
                  onCancelClick={() => setShowCancelModal(true)}
                />
              </div>
            )}
            
            {/* Cancel Modal */}
            <CancelModal
              isOpen={showCancelModal}
              onClose={() => setShowCancelModal(false)}
              onSuccess={() => {
                setShowCancelModal(false);
                window.location.reload();
              }}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Analytics */}
              <div className="lg:col-span-2 space-y-8">
                {/* Analytics Chart */}
                <AnalyticsChart />

                {/* Quick Stats Cards - Classes and Participants hidden for MVP */}
                {/* TODO: Re-enable when features are ready */}
              </div>

              {/* Right Column - Recent Activity */}
              <div id="recent-activity" className="lg:col-span-1" data-tutorial-target="recent-activity">
                <RecentActivityFeed />
              </div>
            </div>

            {/* Quick Actions */}
            <div id="quick-actions" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-tutorial-target="quick-actions">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/registrations"
                  data-testid="link-view-registrations"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  aria-label="View registrations"
                >
                  <div className="text-2xl mr-3">📋</div>
                  <div>
                    <div className="font-medium text-gray-900">Registrations</div>
                    <div className="text-sm text-gray-600">View all</div>
                  </div>
                </Link>
                
                <Link
                  id="create-qr-btn"
                  href="/dashboard/qr-codes"
                  data-testid="link-manage-qr-codes"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors"
                  data-tutorial-target="create-qr-btn"
                  aria-label="Manage QR codes"
                >
                  <div className="text-2xl mr-3">📱</div>
                  <div>
                    <div className="font-medium text-gray-900">QR Codes</div>
                    <div className="text-sm text-gray-600">Manage</div>
                  </div>
                </Link>
                
                {/* Create Class link hidden for MVP - feature not ready */}
                {/*
                <Link
                  href="/classes/new"
                  data-testid="link-create-class"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  aria-label="Create new class"
                >
                  <div className="text-2xl mr-3">➕</div>
                  <div>
                    <div className="font-medium text-gray-900">Create Class</div>
                    <div className="text-sm text-gray-600">Add new</div>
                  </div>
                </Link>
                */}
                
                <Link
                  href="/pricing"
                  data-testid="link-upgrade-plan"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-colors"
                  aria-label="Upgrade plan"
                >
                  <div className="text-2xl mr-3">💳</div>
                  <div>
                    <div className="font-medium text-gray-900">Upgrade Plan</div>
                    <div className="text-sm text-gray-600">View plans</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
