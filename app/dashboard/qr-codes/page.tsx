'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface QRCode {
  id: string;
  qrCodeSetId: string;
  label: string;
  slug: string;
  url: string;
  dataUrl: string;
  description?: string;
  isActive: boolean;
  scanCount: number;
  registrationCount: number;
  createdAt: string;
  updatedAt?: string;
}

interface QRCodeSet {
  id: string;
  organizationId: string;
  name: string;
  language: string;
  isActive: boolean;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function QRCodesPage() {
  const { data: session } = useSession();
  const { ready } = useRequireActiveOrganization();
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [qrCodeSets, setQRCodeSets] = useState<QRCodeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<string>('all');
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
  });
  const [editingQR, setEditingQR] = useState<{ id: string; qrCodeSetId: string; label: string; description: string } | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newQrLabel, setNewQrLabel] = useState('');
  const [generatingNew, setGeneratingNew] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }
    if (!ready) return;

    const fetchData = async () => {
      try {
        setError(null); // Clear previous errors
        // Fetch QR codes for the current user's organization
        const response = await fetch('/api/qr-codes');
        const result = await response.json();

        if (result.success) {
          setQRCodes(result.data);
        } else {
          // Only set error if it's not an auth issue (auth issues will redirect)
          if (response.status !== 401 && response.status !== 403) {
            setError(result.error || 'Failed to load QR codes');
          }
        }

        // Also fetch QR code sets for filtering
        const setsResponse = await fetch('/api/qr-code-sets');
        if (setsResponse.ok) {
          const setsResult = await setsResponse.json();
          if (setsResult.success) {
            setQRCodeSets(setsResult.data);
          }
        }
      } catch (err) {
        console.error('Error fetching QR codes:', err);
        // Only set error if we don't already have QR codes (avoid clearing on refresh failures)
        if (qrCodes.length === 0) {
          setError('Failed to load QR codes');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ready, session?.user?.email]); // Only re-fetch if email changes, not entire session object

  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = !filters.search || 
      qr.label.toLowerCase().includes(filters.search.toLowerCase()) ||
      qr.url.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.isActive || 
      (filters.isActive === 'true' && qr.isActive) ||
      (filters.isActive === 'false' && !qr.isActive);
    const matchesSet = selectedSet === 'all' || qr.qrCodeSetId === selectedSet;
    
    return matchesSearch && matchesStatus && matchesSet;
  });

  const handleDownload = async (qrCode: QRCode) => {
    try {
      const response = await fetch(`/api/qr-codes/${qrCode.id}/download?qrCodeSetId=${qrCode.qrCodeSetId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${qrCode.label}-${qrCode.id}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download QR code');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download QR code');
    }
  };

  const handleEdit = (qrCode: QRCode) => {
    setEditingQR({
      id: qrCode.id,
      qrCodeSetId: qrCode.qrCodeSetId,
      // label is the immutable URL segment; keep it for display only
      label: qrCode.label,
      description: qrCode.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQR) return;

    try {
      const response = await fetch(`/api/qr-codes/${editingQR.id}?qrCodeSetId=${editingQR.qrCodeSetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // SAFETY: only edit the human-friendly display name
        body: JSON.stringify({ description: editingQR.description }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setQRCodes(qrCodes.map(qr => 
            qr.id === editingQR.id ? { ...qr, description: editingQR.description } : qr
          ));
          setEditingQR(null);
        }
      } else {
        alert('Failed to update QR code');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update QR code');
    }
  };

  const handleDelete = async (qrCode: QRCode) => {
    const name = qrCode.description || qrCode.label;
    if (!confirm(`Are you sure you want to deactivate "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/qr-codes/${qrCode.id}?qrCodeSetId=${qrCode.qrCodeSetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update local state - mark as inactive
        setQRCodes(qrCodes.map(qr => 
          qr.id === qrCode.id ? { ...qr, isActive: false } : qr
        ));
      } else {
        alert('Failed to delete QR code');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete QR code');
    }
  };

  const handleGenerateNew = async () => {
    const label = newQrLabel.trim();
    if (!label) {
      alert('Please enter a label for the new QR code');
      return;
    }

    setGeneratingNew(true);
    try {
      // Get organization ID from session
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      const organizationId = sessionData?.activeOrganizationId || sessionData?.user?.organizationId;

      if (!organizationId) {
        alert('Organization ID not found');
        return;
      }

      // Slugify the label
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Generate new QR code(s)
      const response = await fetch('/api/onboarding/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          entryPoints: [{ label, slug }],
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        alert(result.error || 'Failed to generate QR code');
        return;
      }

      // Refresh QR codes list
      const fetchResponse = await fetch('/api/qr-codes');
      const fetchResult = await fetchResponse.json();
      if (fetchResult.success) {
        setQRCodes(fetchResult.data);
      }

      // Reset form
      setNewQrLabel('');
      setAddingNew(false);
      alert(`Successfully generated QR code for "${label}"!`);
    } catch (err) {
      console.error('Generate new QR error:', err);
      alert('Failed to generate new QR code');
    } finally {
      setGeneratingNew(false);
    }
  };

  const totalQRCodes = qrCodes.length;
  const activeQRCodes = qrCodes.filter(qr => qr.isActive).length;
  const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0);
  const totalRegistrations = qrCodes.reduce((sum, qr) => sum + qr.registrationCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8" data-testid="page-dashboard-qr-codes">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center p-8" data-testid="loading-qr-codes" data-loading="true">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading QR codes...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8" data-testid="page-dashboard-qr-codes">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" data-testid="error-qr-codes" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" data-testid="page-dashboard-qr-codes" data-loading={loading}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Codes</h1>
            <p className="text-gray-600">Manage and view all your QR codes</p>
          </div>
          <button
            data-testid="btn-add-qr-code"
            onClick={() => setAddingNew(!addingNew)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
            aria-label="Add new QR code"
          >
            <span>{addingNew ? '✕' : '+'}</span>
            <span>{addingNew ? 'Cancel' : 'Add QR Code'}</span>
          </button>
        </div>

        {/* Add New QR Code Form */}
        {addingNew && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6" data-testid="form-add-qr-code">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New QR Code</h2>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="new-qr-label" className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Point Label
                </label>
                <input
                  id="new-qr-label"
                  type="text"
                  data-testid="input-new-qr-label"
                  value={newQrLabel}
                  onChange={(e) => setNewQrLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !generatingNew) handleGenerateNew();
                    if (e.key === 'Escape') setAddingNew(false);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g., Main Entrance, Side Door, Event Hall"
                  disabled={generatingNew}
                  aria-label="New QR code label"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will create a new QR code entry point without affecting existing ones.
                </p>
              </div>
              <div className="flex items-end">
                <button
                  data-testid="btn-generate-new-qr"
                  onClick={handleGenerateNew}
                  disabled={generatingNew || !newQrLabel.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  aria-label="Generate new QR code"
                >
                  {generatingNew ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div id="qr-stats" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6" data-tutorial-target="qr-stats">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl text-blue-600 mr-3">📱</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total QR Codes</p>
                <p className="text-2xl font-bold text-gray-900">{totalQRCodes}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl text-green-600 mr-3">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{activeQRCodes}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl text-purple-600 mr-3">👁️</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900">{totalScans}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl text-indigo-600 mr-3">📋</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{totalRegistrations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                data-testid="input-qr-search"
                placeholder="Search by label or URL..."
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Search QR codes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                data-testid="dropdown-qr-status"
                value={filters.isActive}
                onChange={e => setFilters({...filters, isActive: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Set
              </label>
              <select
                data-testid="dropdown-qr-set"
                value={selectedSet}
                onChange={e => setSelectedSet(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter by QR code set"
              >
                <option value="all">All Sets</option>
                {qrCodeSets.map(set => (
                  <option key={set.id} value={set.id}>{set.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                data-testid="btn-clear-filters"
                onClick={() => {
                  setFilters({ search: '', isActive: '' });
                  setSelectedSet('all');
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                aria-label="Clear filters"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* QR Codes Grid */}
        {filteredQRCodes.length === 0 ? (
          <div id="qr-codes-empty" className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12" data-tutorial-target="qr-codes-empty" data-testid="empty-qr-codes">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.isActive || selectedSet !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'QR codes will appear here once you generate them during onboarding.'
              }
            </p>
            {filters.search || filters.isActive || selectedSet !== 'all' ? (
              <button
                onClick={() => {
                  setFilters({ search: '', isActive: '' });
                  setSelectedSet('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            ) : (
              <Link
                href="/onboarding/qr-configuration"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Generate QR Codes →
              </Link>
            )}
          </div>
        ) : (
          <div id="qr-codes-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tutorial-target="qr-codes-list">
            {filteredQRCodes.map((qrCode) => (
              <div
                key={qrCode.id}
                data-testid={`card-qr-${qrCode.id}`}
                className={`bg-white rounded-lg shadow-sm border-2 ${
                  qrCode.isActive ? 'border-green-200' : 'border-gray-200'
                } p-6 hover:shadow-md transition-shadow`}
              >
                {/* QR Code Image */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 aspect-square flex items-center justify-center">
                  {qrCode.dataUrl ? (
                    <img
                      src={qrCode.dataUrl}
                      alt={`QR Code for ${qrCode.label}`}
                      className="w-full h-full object-contain max-w-[200px] max-h-[200px]"
                    />
                  ) : (
                    <span className="text-4xl">📱</span>
                  )}
                </div>

                {/* QR Code Info */}
                <div className="mb-4">
                  {editingQR && editingQR.id === qrCode.id ? (
                    <div className="mb-2">
                      <div className="mb-2 text-xs text-gray-500">
                        <div>
                          <span className="font-medium text-gray-700">URL slug (immutable):</span>{' '}
                          <span className="font-mono" data-testid={`text-qr-slug-${qrCode.id}`}>{qrCode.slug || qrCode.label}</span>
                        </div>
                        <div className="break-all">
                          <span className="font-medium text-gray-700">URL:</span> {qrCode.url}
                        </div>
                      </div>
                      <input
                        type="text"
                        data-testid={`input-qr-description-${qrCode.id}`}
                        value={editingQR.description}
                        onChange={e => setEditingQR({...editingQR, description: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingQR(null);
                        }}
                        autoFocus
                        aria-label="Edit QR code description"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Edit the <span className="font-medium">display name</span> only. The URL slug is kept stable to avoid breaking scanned QR codes.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          data-testid={`btn-save-qr-${qrCode.id}`}
                          onClick={handleSaveEdit}
                          className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          aria-label="Save QR code changes"
                        >
                          Save
                        </button>
                        <button
                          data-testid={`btn-cancel-qr-${qrCode.id}`}
                          onClick={() => setEditingQR(null)}
                          className="flex-1 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          aria-label="Cancel editing"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{qrCode.description || qrCode.label}</h3>
                      {qrCode.description && (
                        <p className="text-xs text-gray-500 mb-1">
                          URL slug: <span className="font-mono">{qrCode.slug || qrCode.label}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mb-2 break-all">{qrCode.url}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          qrCode.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {qrCode.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Scans</p>
                    <p className="font-semibold text-gray-900">{qrCode.scanCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Registrations</p>
                    <p className="font-semibold text-gray-900">{qrCode.registrationCount}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    data-testid={`btn-download-qr-${qrCode.id}`}
                    onClick={() => handleDownload(qrCode)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    aria-label={`Download QR code ${qrCode.label}`}
                  >
                    Download
                  </button>
                  <Link
                    href={`/dashboard/qr-codes/${qrCode.id}?qrCodeSetId=${qrCode.qrCodeSetId}`}
                    data-testid={`btn-view-analytics-${qrCode.id}`}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                    aria-label={`View analytics for ${qrCode.label}`}
                  >
                    Analytics
                  </Link>
                  <button
                    data-testid={`btn-edit-qr-${qrCode.id}`}
                    onClick={() => handleEdit(qrCode)}
                    className="px-3 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    title="Edit"
                    aria-label={`Edit QR code ${qrCode.label}`}
                  >
                    ✏️
                  </button>
                  <button
                    data-testid={`btn-deactivate-qr-${qrCode.id}`}
                    onClick={() => handleDelete(qrCode)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    title="Delete"
                    aria-label={`Deactivate QR code ${qrCode.label}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

