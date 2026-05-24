'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';
import { RegistrationRoleService } from '@/lib/services/RegistrationRoleService';

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

interface Event {
  id: string;
  name: string;
  /** Issue #24: organization-level event name (preferred display label). */
  eventName?: string;
  eventType: string | null;
}

export default function RegistrationsPage() {
  const { user, status: sessionStatus } = useAuth();
  const router = useRouter();
  const { ready, activeOrganizationId } = useRequireActiveOrganization();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    deliveryStatus: string;
    search: string;
    eventId: string;
    /** Issue #24: filter by check-in state. '' = all, 'in' = checked in, 'out' = not checked in. */
    checkedIn: '' | 'in' | 'out';
  }>({
    deliveryStatus: '',
    search: '',
    eventId: '',
    checkedIn: '',
  });
  const roleService = useMemo(() => new RegistrationRoleService(), []);

  // Handle unauthenticated state - redirect to login
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login?next=/dashboard/registrations');
      return;
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    // Don't fetch if not authenticated or still loading auth
    if (sessionStatus === 'loading' || sessionStatus === 'unauthenticated') {
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
    if (!ready) {
      // Still waiting for active org context
      return;
    }
    const organizationId = activeOrganizationId || (user.organizationId as string | undefined);
    if (!organizationId) {
      setLoading(false);
      setError('No active organization found');
      return;
    }
    
    const fetchData = async () => {
      try {
        const [registrationsResponse, eventsResponse] = await Promise.all([
          fetch(`/api/registrations?organizationId=${organizationId}`),
          fetch(`/api/events?organizationId=${organizationId}`),
        ]);
        
        const registrationsResult = await registrationsResponse.json();
        if (registrationsResult.success) {
          setRegistrations(registrationsResult.data || []);
          if (registrationsResult.data && registrationsResult.data.length === 0) {
            console.log(`No registrations found for organization ${organizationId}`);
          }
        } else {
          console.error('Failed to load registrations:', registrationsResult.error);
          setError(registrationsResult.error || 'Failed to load registrations');
        }
        
        const eventsResult = await eventsResponse.json();
        if (eventsResult.events) {
          setEvents(eventsResult.events);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeOrganizationId, ready, user, sessionStatus]);

  const filteredRegistrations = registrations.filter(reg => {
    const data = JSON.parse(reg.registrationData);
    const matchesStatus = !filters.deliveryStatus || reg.deliveryStatus === filters.deliveryStatus;
    const matchesEvent = !filters.eventId || reg.qrCodeSetId === filters.eventId;

    // Issue #24: checked-in filter
    let matchesCheckedIn = true;
    if (filters.checkedIn === 'in') {
      matchesCheckedIn = !!reg.checkedInAt;
    } else if (filters.checkedIn === 'out') {
      matchesCheckedIn = !reg.checkedInAt;
    }

    // Search through all registration data fields (handles both field IDs and semantic keys)
    const matchesSearch = !filters.search || Object.values(data).some(value => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(filters.search.toLowerCase());
      }
      return false;
    });
    
    return matchesStatus && matchesSearch && matchesEvent && matchesCheckedIn;
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

  // Show loading only if authenticated and waiting for data
  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && loading && ready)) {
    return (
      <div className="min-h-screen bg-gray-50 p-8" data-testid="page-dashboard-registrations">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center p-8" data-testid="loading-registrations" data-loading="true">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading registrations...</span>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirect is happening (show nothing or brief loading)
  if (sessionStatus === 'unauthenticated') {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8" data-testid="page-dashboard-registrations">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" data-testid="error-registrations" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" data-testid="page-dashboard-registrations" data-loading={loading}>
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
              data-testid="btn-export-csv"
              onClick={async () => {
                try {
                  setExportError(null);
                  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  const params = new URLSearchParams({ format: 'csv', timezone });
                  if (filters.deliveryStatus) params.set('deliveryStatus', filters.deliveryStatus);
                  const response = await fetch(`/api/registrations/export?${params}`);

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
                    const msg = await response.text().catch(() => 'Unknown error');
                    setExportError(`Export failed (${response.status}): ${msg}`);
                    console.error('CSV export failed:', response.status, msg);
                  }
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Unknown error';
                  setExportError(`Export error: ${msg}`);
                  console.error('CSV export error:', err);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Export CSV</span>
            </button>
            <button
              id="export-pdf"
              data-testid="btn-export-pdf"
              onClick={async () => {
                try {
                  setExportError(null);
                  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  const params = new URLSearchParams({ format: 'pdf', timezone });
                  if (filters.deliveryStatus) params.set('deliveryStatus', filters.deliveryStatus);
                  const response = await fetch(`/api/registrations/export?${params}`);

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
                    const msg = await response.text().catch(() => 'Unknown error');
                    setExportError(`Export failed (${response.status}): ${msg}`);
                    console.error('PDF export failed:', response.status, msg);
                  }
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Unknown error';
                  setExportError(`Export error: ${msg}`);
                  console.error('PDF export error:', err);
                }
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center space-x-2"
            >
              <span>🧾</span>
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Export Error */}
        {exportError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
            <div className="flex items-start">
              <span className="text-red-600 mr-2">⚠️</span>
              <div>
                <p className="text-red-800 font-medium">Export Failed</p>
                <p className="text-red-700 text-sm mt-1">{exportError}</p>
              </div>
              <button
                onClick={() => setExportError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                data-testid="input-registration-search"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Search registrations"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event
              </label>
              <select
                data-testid="select-event-filter"
                value={filters.eventId}
                onChange={e => setFilters({...filters, eventId: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter by event"
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.eventName || event.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                data-testid="dropdown-registration-status"
                value={filters.deliveryStatus}
                onChange={e => setFilters({...filters, deliveryStatus: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in
              </label>
              <select
                data-testid="dropdown-checked-in-filter"
                value={filters.checkedIn}
                onChange={e => setFilters({...filters, checkedIn: e.target.value as '' | 'in' | 'out'})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter by check-in state"
              >
                <option value="">All</option>
                <option value="in">Checked In</option>
                <option value="out">Not Checked In</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                data-testid="btn-clear-registration-filters"
                onClick={() => setFilters({ deliveryStatus: '', search: '', eventId: '', checkedIn: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                aria-label="Clear filters"
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
            <div className="text-center py-12" data-testid="empty-registrations">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.deliveryStatus 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Registrations will appear here once people start registering.'
                }
              </p>
              {filters.search || filters.deliveryStatus || filters.eventId || filters.checkedIn ? (
                <button
                  onClick={() => setFilters({ deliveryStatus: '', search: '', eventId: '', checkedIn: '' })}
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
              <table className="min-w-full divide-y divide-gray-200" data-testid="table-registrations">
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
                      Role
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
                    
                    // Extract name - try multiple strategies
                    let name = '-';
                    if (data.name) {
                      name = data.name;
                    } else if (data.firstName || data.lastName) {
                      name = [data.firstName, data.lastName].filter(Boolean).join(' ');
                    } else {
                      // Find any field that looks like a name (contains "name" in key or is first non-email text field)
                      for (const [key, value] of Object.entries(data)) {
                        if (typeof value === 'string' && value.trim() && !value.includes('@')) {
                          name = value;
                          break;
                        }
                      }
                    }
                    
                    // Extract email - try multiple strategies
                    let email = '-';
                    if (data.email) {
                      email = data.email;
                    } else {
                      // Find any field that looks like an email (contains @)
                      for (const value of Object.values(data)) {
                        if (typeof value === 'string' && value.includes('@')) {
                          email = value;
                          break;
                        }
                      }
                    }
                    
                    return (
                      <tr key={reg.id} className="hover:bg-gray-50" data-testid={`row-registration-${reg.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {reg.qrCodeId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const role = roleService.extractRole(data);
                            if (!role) {
                              return <span className="text-xs text-gray-400">—</span>;
                            }
                            return (
                              <span
                                className="px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200"
                                data-testid={`role-${reg.id}`}
                              >
                                {role}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={getStatusBadge(reg.deliveryStatus)}
                            title={reg.deliveryStatus === 'pending' ? 'Registration received, awaiting processing or delivery' : undefined}
                          >
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
                                data-testid={`btn-check-in-${reg.id}`}
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/registrations/${reg.id}/check-in`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ checkedInBy: user?.email })
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
                                aria-label={`Check in registration ${reg.id}`}
                              >
                                ✓ Check In
                              </button>
                            )}
                            {reg.checkedInAt && (
                              <span className="text-green-600 text-xs" title={`Checked in at ${new Date(reg.checkedInAt).toLocaleString()}`}>
                                ✓ Checked In
                              </span>
                            )}

                            {/* Issue #24: delivery-status action buttons */}
                            {reg.deliveryStatus === 'pending' && (
                              <button
                                type="button"
                                data-testid={`btn-resend-${reg.id}`}
                                onClick={async () => {
                                  try {
                                    const r = await fetch('/api/registrations/send-qr', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ registrationId: reg.id }),
                                    });
                                    if (r.ok) window.location.reload();
                                    else alert('Resend failed');
                                  } catch {
                                    alert('Resend error');
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                                aria-label={`Resend confirmation for ${reg.id}`}
                                title="Resend confirmation email"
                              >
                                ↻ Resend
                              </button>
                            )}
                            {reg.deliveryStatus !== 'cancelled' && (
                              <button
                                type="button"
                                data-testid={`btn-cancel-${reg.id}`}
                                onClick={async () => {
                                  if (!confirm('Cancel this registration?')) return;
                                  try {
                                    const r = await fetch(`/api/registrations/${reg.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ deliveryStatus: 'cancelled' }),
                                    });
                                    if (r.ok) window.location.reload();
                                    else alert('Cancel failed');
                                  } catch {
                                    alert('Cancel error');
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 font-medium"
                                aria-label={`Cancel registration ${reg.id}`}
                                title="Cancel registration"
                              >
                                ✕ Cancel
                              </button>
                            )}
                            {reg.deliveryStatus === 'cancelled' && (
                              <button
                                type="button"
                                data-testid={`btn-restore-${reg.id}`}
                                onClick={async () => {
                                  try {
                                    const r = await fetch(`/api/registrations/${reg.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ deliveryStatus: 'pending' }),
                                    });
                                    if (r.ok) window.location.reload();
                                    else alert('Restore failed');
                                  } catch {
                                    alert('Restore error');
                                  }
                                }}
                                className="text-amber-600 hover:text-amber-900 font-medium"
                                aria-label={`Restore registration ${reg.id}`}
                                title="Restore cancelled registration"
                              >
                                ↺ Restore
                              </button>
                            )}

                            <Link
                              href={`/dashboard/registrations/${reg.id}`}
                              data-testid={`link-view-registration-${reg.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              aria-label={`View registration ${reg.id}`}
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
