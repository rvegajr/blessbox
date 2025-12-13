'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
  const [editingQR, setEditingQR] = useState<{ id: string; qrCodeSetId: string; label: string } | null>(null);

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }
    if (!ready) return;

    const fetchData = async () => {
      try {
        // Fetch QR codes for the current user's organization
        const response = await fetch('/api/qr-codes');
        const result = await response.json();

        if (result.success) {
          setQRCodes(result.data);
        } else {
          setError(result.error || 'Failed to load QR codes');
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
        setError('Failed to load QR codes');
        console.error('Error fetching QR codes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ready, session]);

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
      label: qrCode.label,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQR) return;

    try {
      const response = await fetch(`/api/qr-codes/${editingQR.id}?qrCodeSetId=${editingQR.qrCodeSetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editingQR.label }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setQRCodes(qrCodes.map(qr => 
            qr.id === editingQR.id ? { ...qr, label: editingQR.label } : qr
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
    if (!confirm(`Are you sure you want to deactivate "${qrCode.label}"?`)) {
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

  const totalQRCodes = qrCodes.length;
  const activeQRCodes = qrCodes.filter(qr => qr.isActive).length;
  const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0);
  const totalRegistrations = qrCodes.reduce((sum, qr) => sum + qr.registrationCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading QR codes...</span>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Codes</h1>
          <p className="text-gray-600">Manage and view all your QR codes</p>
        </div>

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
                placeholder="Search by label or URL..."
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
                value={filters.isActive}
                onChange={e => setFilters({...filters, isActive: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                value={selectedSet}
                onChange={e => setSelectedSet(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Sets</option>
                {qrCodeSets.map(set => (
                  <option key={set.id} value={set.id}>{set.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ search: '', isActive: '' });
                  setSelectedSet('all');
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* QR Codes Grid */}
        {filteredQRCodes.length === 0 ? (
          <div id="qr-codes-empty" className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12" data-tutorial-target="qr-codes-empty">
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
                      <input
                        type="text"
                        value={editingQR.label}
                        onChange={e => setEditingQR({...editingQR, label: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingQR(null);
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingQR(null)}
                          className="flex-1 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{qrCode.label}</h3>
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
                    onClick={() => handleDownload(qrCode)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    Download
                  </button>
                  <Link
                    href={`/dashboard/qr-codes/${qrCode.id}?qrCodeSetId=${qrCode.qrCodeSetId}`}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                  >
                    Analytics
                  </Link>
                  <button
                    onClick={() => handleEdit(qrCode)}
                    className="px-3 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(qrCode)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    title="Delete"
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

