'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminOrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadOrganization();
  }, [orgId]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/organizations/${orgId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setOrg(data.organization);
      } else {
        setError(data.error || 'Failed to load organization');
      }
    } catch (err) {
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!org) return;

    const confirmed = confirm(
      action === 'suspend'
        ? 'Are you sure you want to suspend this organization?'
        : 'Are you sure you want to unsuspend this organization?'
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message);
        loadOrganization();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading organization details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/admin"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" data-testid="page-org-detail">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="org-name">{org.name}</h1>
          <p className="text-gray-600 mt-1">{org.event_name || 'No event name'}</p>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Management Actions</h2>
          <div className="flex gap-3">
            {org.email_verified ? (
              <button
                onClick={() => handleAction('suspend')}
                disabled={actionLoading}
                data-testid="btn-suspend"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : '🚫 Suspend Organization'}
              </button>
            ) : (
              <button
                onClick={() => handleAction('unsuspend')}
                disabled={actionLoading}
                data-testid="btn-unsuspend"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : '✅ Unsuspend Organization'}
              </button>
            )}
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-600">Organization ID</dt>
              <dd className="text-sm font-mono text-gray-900 mt-1">{org.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Contact Email</dt>
              <dd className="text-sm text-gray-900 mt-1">{org.contact_email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Contact Phone</dt>
              <dd className="text-sm text-gray-900 mt-1">{org.contact_phone || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Custom Domain</dt>
              <dd className="text-sm text-gray-900 mt-1">{org.custom_domain || 'None'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Email Verified</dt>
              <dd className="text-sm text-gray-900 mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  org.email_verified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {org.email_verified ? 'Yes' : 'No (Suspended)'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Timezone</dt>
              <dd className="text-sm text-gray-900 mt-1">{org.timezone || 'UTC'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Created</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {new Date(org.created_at).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Last Login</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {org.last_login_at ? new Date(org.last_login_at).toLocaleString() : 'Never'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <dt className="text-sm text-gray-600 mb-2">Total Registrations</dt>
              <dd className="text-3xl font-bold text-blue-600">{org.registrationsCount}</dd>
            </div>
            <div className="text-center">
              <dt className="text-sm text-gray-600 mb-2">QR Code Sets</dt>
              <dd className="text-3xl font-bold text-green-600">{org.qrCodeSetsCount}</dd>
            </div>
            <div className="text-center">
              <dt className="text-sm text-gray-600 mb-2">Subscription Plan</dt>
              <dd className="text-xl font-semibold text-gray-900 mt-2">
                {org.subscription?.plan_type || 'Free'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Address Info */}
        {(org.contact_address || org.contact_city || org.contact_state) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
            <p className="text-sm text-gray-900">
              {org.contact_address && <span>{org.contact_address}<br /></span>}
              {org.contact_city && <span>{org.contact_city}, </span>}
              {org.contact_state && <span>{org.contact_state} </span>}
              {org.contact_zip && <span>{org.contact_zip}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
