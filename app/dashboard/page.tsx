"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { status } = useSession();
  const { ready } = useRequireActiveOrganization();
  const [subscription, setSubscription] = useState<any | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ready || status === 'loading') return;
      try {
        const [subscriptionRes, classesRes, participantsRes] = await Promise.all([
          fetch('/api/subscriptions'),
          fetch('/api/classes'),
          fetch('/api/participants')
        ]);
        
        if (!ignore) {
          const subscriptionData = await subscriptionRes.json();
          setSubscription(subscriptionData.subscription || null);
          
          const classesData = await classesRes.json();
          setClasses(classesData);
          
          const participantsData = await participantsRes.json();
          setParticipants(participantsData);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Analytics */}
              <div className="lg:col-span-2 space-y-8">
                {/* Analytics Chart */}
                <AnalyticsChart />

                {/* Subscription Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription</h2>
                  {subscription ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium text-blue-600 uppercase">{subscription.plan_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Billing:</span>
                        <span className="font-medium">{subscription.billing_cycle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Limit:</span>
                        <span className="font-medium">{subscription.registration_limit} participants</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <p className="mb-4">No active subscription</p>
                      <Link 
                        href="/pricing"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Plans →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Classes Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Classes</h3>
                        <p className="text-3xl font-bold text-blue-600">{classes.length}</p>
                      </div>
                      <div className="text-4xl text-blue-100">📚</div>
                    </div>
                    <div className="mt-4">
                      <Link 
                        href="/classes"
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Manage Classes →
                      </Link>
                    </div>
                  </div>

                  {/* Participants Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
                        <p className="text-3xl font-bold text-green-600">{participants.length}</p>
                      </div>
                      <div className="text-4xl text-green-100">👥</div>
                    </div>
                    <div className="mt-4">
                      <Link 
                        href="/participants"
                        className="text-green-600 hover:text-green-800 font-medium text-sm"
                      >
                        Manage Participants →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Recent Activity */}
              <div id="recent-activity" className="lg:col-span-1" data-tutorial-target="recent-activity">
                <RecentActivityFeed />
              </div>
            </div>

            {/* Quick Actions */}
            <div id="quick-actions" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-tutorial-target="quick-actions">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link
                  href="/dashboard/registrations"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
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
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors"
                  data-tutorial-target="create-qr-btn"
                >
                  <div className="text-2xl mr-3">📱</div>
                  <div>
                    <div className="font-medium text-gray-900">QR Codes</div>
                    <div className="text-sm text-gray-600">Manage</div>
                  </div>
                </Link>
                
                <Link
                  href="/classes/new"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <div className="text-2xl mr-3">➕</div>
                  <div>
                    <div className="font-medium text-gray-900">Create Class</div>
                    <div className="text-sm text-gray-600">Add new</div>
                  </div>
                </Link>
                
                <Link
                  href="/pricing"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-colors"
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
