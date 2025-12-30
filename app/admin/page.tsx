'use client';

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/hooks/useAuth';
import Link from 'next/link';

interface SystemStats {
  organizations: {
    total: number;
    verified: number;
    active: number;
  };
  registrations: {
    total: number;
    today: number;
    thisWeek: number;
  };
  qrCodes: {
    total: number;
  };
  subscriptions: {
    total: number;
    active: number;
  };
  coupons: {
    total: number;
  };
}

interface Subscription {
  id: string;
  organization_name: string;
  contact_email: string;
  plan_type: string;
  status: string;
  billing_cycle: string;
  amount: number;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  contact_email: string;
  email_verified: boolean;
  created_at: string;
  registrationCount: number;
  qrCodeSetCount: number;
}

export default function AdminPage() {
  const { user } = useSession();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'organizations' | 'coupons'>('overview');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadStats(),
        loadSubscriptions(),
        loadOrganizations()
      ]);
    } catch (e) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }

  async function loadSubscriptions() {
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (res.status === 403) {
        setError('Forbidden (super admin only)');
        setSubs([]);
      } else if (res.ok) {
        const data = await res.json();
        setSubs(data.subscriptions || []);
      }
    } catch (e) {
      console.error('Failed to load subscriptions:', e);
    }
  }

  async function loadOrganizations() {
    try {
      const res = await fetch('/api/admin/organizations?limit=20');
      if (res.ok) {
        const data = await res.json();
        setOrgs(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load organizations:', e);
    }
  }

  async function cancelSubscription(subscriptionId: string) {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      const res = await fetch('/api/admin/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });
      if (res.ok) {
        await loadSubscriptions();
        await loadStats();
      }
    } catch (e) {
      alert('Failed to cancel subscription');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading admin panel...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && error.includes('Forbidden')) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p>You must be a super admin to access this page.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">System administration and monitoring</p>
            </div>
            <div className="text-sm text-gray-500">
              Logged in as: {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'subscriptions', label: 'Subscriptions', icon: '💳' },
                { id: 'organizations', label: 'Organizations', icon: '🏢' },
                { id: 'coupons', label: 'Coupons', icon: '🎟️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">🏢</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.organizations.total}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.organizations.active} active, {stats.organizations.verified} verified
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📋</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Registrations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.registrations.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.registrations.today} today, {stats.registrations.thisWeek} this week
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">💳</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.subscriptions.active}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.subscriptions.total} total
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">🎟️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Coupons</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.coupons.total}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Active coupons
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/admin/coupons/new"
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  ➕ Create Coupon
                </Link>
                <Link
                  href="/admin/coupons"
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
                >
                  🎟️ Manage Coupons
                </Link>
                <Link
                  href="/admin/analytics"
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
                >
                  📊 View Analytics
                </Link>
              </div>
            </div>

            {/* Recent Organizations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Organizations</h2>
              {orgs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No organizations yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrations</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Codes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orgs.slice(0, 10).map(org => (
                        <tr key={org.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{org.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{org.contact_email}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{org.registrationCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{org.qrCodeSetCount}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              org.email_verified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {org.email_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">All Subscriptions</h2>
              <button
                onClick={loadSubscriptions}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                🔄 Refresh
              </button>
            </div>
            {subs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No subscriptions found</p>
        ) : (
          <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subs.map(s => (
                  <tr key={s.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.organization_name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{s.contact_email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                            {s.plan_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            s.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 capitalize">{s.billing_cycle}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${((s.amount || 0) / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                      {s.status === 'active' ? (
                            <button
                              onClick={() => cancelSubscription(String(s.id))}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
                            >
                          Cancel
                        </button>
                      ) : (
                            <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            )}
          </div>
        )}

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">All Organizations</h2>
              <button
                onClick={loadOrganizations}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                🔄 Refresh
              </button>
            </div>
            {orgs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No organizations found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrations</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Codes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orgs.map(org => (
                      <tr key={org.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{org.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{org.contact_email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{org.registrationCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{org.qrCodeSetCount}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            org.email_verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {org.email_verified ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(org.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Coupon Management</h2>
              <Link
                href="/admin/coupons/new"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                ➕ Create Coupon
              </Link>
            </div>
            <p className="text-gray-600 mb-4">
              Manage coupons from the dedicated coupons page for full functionality.
            </p>
            <Link
              href="/admin/coupons"
              className="inline-block px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Go to Coupons Management →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
