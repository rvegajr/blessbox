'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Registration {
  id: string;
  qrCodeSetId: string;
  qrCodeId: string;
  registrationData: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  deliveryStatus: 'pending' | 'delivered' | 'cancelled';
  deliveredAt?: string;
  registeredAt: string;
  checkedInAt?: string;
  checkedInBy?: string;
  tokenStatus?: string;
}

export default function RegistrationsPage() {
  const { data: session } = useSession();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    deliveryStatus: '',
    search: ''
  });

  useEffect(() => {
    if (!session?.user) return;
    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return;
    
    const fetchRegistrations = async () => {
      try {
        const response = await fetch(`/api/registrations?organizationId=${organizationId}`);
        const result = await response.json();
        
        if (result.success) {
          setRegistrations(result.data);
        } else {
          setError(result.error || 'Failed to load registrations');
        }
      } catch (err) {
        setError('Failed to load registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [session]);

  const filteredRegistrations = registrations.filter(reg => {
    const data = JSON.parse(reg.registrationData);
    const matchesStatus = !filters.deliveryStatus || reg.deliveryStatus === filters.deliveryStatus;
    const matchesSearch = !filters.search || 
      data.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      data.email?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
    
    switch (status) {
      case 'delivered':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading registrations...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrations</h1>
            <p className="text-gray-600">Manage and view all registration submissions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="export-csv"
              data-tutorial-target="export-data"
              onClick={async () => {
                try {
                  const response = await fetch('/api/export/registrations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      format: 'csv',
                      filters: {
                        deliveryStatus: filters.deliveryStatus || undefined,
                      },
                    }),
                  });

                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } else {
                    alert('Failed to export registrations');
                  }
                } catch (err) {
                  alert('Error exporting registrations');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Export CSV</span>
            </button>
            <button
              id="export-pdf"
              onClick={async () => {
                try {
                  const response = await fetch('/api/export/registrations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      format: 'pdf',
                      filters: {
                        deliveryStatus: filters.deliveryStatus || undefined,
                      },
                    }),
                  });

                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `registrations-${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } else {
                    alert('Failed to export registrations');
                  }
                } catch (err) {
                  alert('Error exporting registrations');
                }
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center space-x-2"
            >
              <span>🧾</span>
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.deliveryStatus}
                onChange={e => setFilters({...filters, deliveryStatus: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ deliveryStatus: '', search: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl text-blue-600 mr-3">📋</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl text-yellow-600 mr-3">⏳</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => r.deliveryStatus === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl text-green-600 mr-3">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => r.deliveryStatus === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl text-red-600 mr-3">❌</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => r.deliveryStatus === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.deliveryStatus 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Registrations will appear here once people start registering.'
                }
              </p>
              {filters.search || filters.deliveryStatus ? (
                <button
                  onClick={() => setFilters({ deliveryStatus: '', search: '' })}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map((reg) => {
                    const data = JSON.parse(reg.registrationData);
                    return (
                      <tr key={reg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {data.name || data.firstName + ' ' + data.lastName || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {data.email || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {reg.qrCodeId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(reg.deliveryStatus)}>
                            {reg.deliveryStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(reg.registeredAt).toLocaleDateString()} {new Date(reg.registeredAt).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {!reg.checkedInAt && (
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/registrations/${reg.id}/check-in`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ checkedInBy: session?.user?.email })
                                    });
                                    if (response.ok) {
                                      // Refresh the page to show updated status
                                      window.location.reload();
                                    } else {
                                      alert('Failed to check in registration');
                                    }
                                  } catch (err) {
                                    alert('Error checking in registration');
                                  }
                                }}
                                className="text-green-600 hover:text-green-900 font-medium"
                                title="Check in this registration"
                              >
                                ✓ Check In
                              </button>
                            )}
                            {reg.checkedInAt && (
                              <span className="text-green-600 text-xs" title={`Checked in at ${new Date(reg.checkedInAt).toLocaleString()}`}>
                                ✓ Checked In
                              </span>
                            )}
                            <Link
                              href={`/dashboard/registrations/${reg.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination would go here */}
        {filteredRegistrations.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {filteredRegistrations.length} of {registrations.length} registrations
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
