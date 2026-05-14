/**
 * Worker Check-In Dashboard
 * 
 * Three modes:
 * 1. QR Scanner - Scan attendee QR codes with camera
 * 2. Manual Search - Search by name, email, or phone
 * 3. Attendee List - Browse all registrations
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  checkInToken: string;
  tokenStatus: string;
  checkedInAt?: string;
  checkedInBy?: string;
  qrCodeLabel: string;
  registrationData: any;
}

type CheckInMode = 'scanner' | 'search' | 'list';

export default function CheckInDashboard() {
  const router = useRouter();
  const { status } = useAuth();

  const [mode, setMode] = useState<CheckInMode>('list');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'checked-in'>('pending');
  const [manualToken, setManualToken] = useState('');

  // Scanner state
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.reset();
      scannerRef.current = null;
    }
    setScannerActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    setScannerError(null);
    setLastScan(null);
    if (!videoRef.current) return;
    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader();
      scannerRef.current = reader;
      setScannerActive(true);
      await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          const text = result.getText();
          // Extract token from check-in URL or use raw value
          const match = text.match(/\/check-in\/([a-zA-Z0-9_-]+)/);
          const token = match ? match[1] : text;
          setLastScan(token);
          stopScanner();
          router.push(`/check-in/${token}`);
        }
      });
    } catch (e: any) {
      setScannerError(e?.message?.includes('Permission')
        ? 'Camera permission denied. Please allow camera access and try again.'
        : 'Could not start camera. Try manual token entry below.');
      setScannerActive(false);
    }
  }, [router, stopScanner]);

  // Stop scanner when leaving scanner mode
  useEffect(() => {
    if (mode !== 'scanner') stopScanner();
  }, [mode, stopScanner]);

  // Cleanup on unmount
  useEffect(() => () => stopScanner(), [stopScanner]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?next=/dashboard/check-in');
    }
  }, [status, router]);

  // Load registrations
  useEffect(() => {
    if (status !== 'authenticated') return;
    loadRegistrations();
  }, [status, searchQuery, filter]);

  const loadRegistrations = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        filter,
        limit: '100'
      });

      const response = await fetch(`/api/check-in/search?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load registrations');
      }

      setRegistrations(data.registrations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTokenLookup = () => {
    if (manualToken.trim()) {
      router.push(`/check-in/${manualToken.trim()}`);
    }
  };

  const handleCheckIn = async (registration: Registration) => {
    router.push(`/check-in/${registration.checkInToken}`);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="page-check-in-dashboard">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="page-check-in-dashboard">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-In Attendees</h1>
          <p className="text-gray-600">Scan QR codes, search attendees, or browse the list</p>
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-lg shadow-sm mb-6" data-testid="mode-selector">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setMode('list')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                mode === 'list'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              data-testid="btn-mode-list"
            >
              <span className="text-2xl mr-2">📋</span>
              Attendee List
            </button>
            <button
              onClick={() => setMode('search')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                mode === 'search'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              data-testid="btn-mode-search"
            >
              <span className="text-2xl mr-2">🔍</span>
              Manual Search
            </button>
            <button
              onClick={() => setMode('scanner')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                mode === 'scanner'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              data-testid="btn-mode-scanner"
            >
              <span className="text-2xl mr-2">📸</span>
              QR Scanner
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {mode === 'scanner' && (
            <div data-testid="mode-scanner-content">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Scanner</h2>
                <p className="text-gray-600 mb-6">Point the camera at an attendee's check-in QR code</p>

                {/* Camera viewfinder */}
                <div className="max-w-md mx-auto mb-6">
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-square">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      data-testid="scanner-video"
                    />
                    {/* Targeting overlay */}
                    {scannerActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-56 h-56 border-4 border-white rounded-lg opacity-70">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br" />
                        </div>
                      </div>
                    )}
                    {!scannerActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center text-white">
                          <div className="text-5xl mb-3">📸</div>
                          <p className="text-sm text-gray-300">Camera off</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {scannerError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600" data-testid="scanner-error">
                      {scannerError}
                    </div>
                  )}
                  {lastScan && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      ✅ Scanned — redirecting...
                    </div>
                  )}

                  <div className="mt-4 flex gap-3 justify-center">
                    {!scannerActive ? (
                      <button
                        onClick={startScanner}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        data-testid="btn-start-scanner"
                      >
                        Start Camera
                      </button>
                    ) : (
                      <button
                        onClick={stopScanner}
                        className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                        data-testid="btn-stop-scanner"
                      >
                        Stop Camera
                      </button>
                    )}
                  </div>
                </div>

                {/* Manual Token Entry Fallback */}
                <div className="max-w-md mx-auto border-t pt-6">
                  <p className="text-sm text-gray-500 mb-3">Or enter the token manually</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualTokenLookup()}
                      placeholder="Enter check-in token"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      data-testid="input-manual-token"
                    />
                    <button
                      onClick={handleManualTokenLookup}
                      disabled={!manualToken.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="btn-lookup-token"
                    >
                      Lookup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'search' && (
            <div data-testid="mode-search-content">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Search Attendees</h2>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                  data-testid="input-search-query"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Start typing to search across all registration fields
                </p>
              </div>

              {/* Search Results */}
              {searchQuery.trim() && (
                <div data-testid="search-results">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">⏳</div>
                      <p className="text-gray-600">Searching...</p>
                    </div>
                  ) : registrations.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🔍</div>
                      <p className="text-gray-600">No results found for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {registrations.map(reg => (
                        <RegistrationCard key={reg.id} registration={reg} onCheckIn={handleCheckIn} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'list' && (
            <div data-testid="mode-list-content">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">All Registrations</h2>
                
                {/* Filter Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'pending'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    data-testid="filter-pending"
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('checked-in')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'checked-in'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    data-testid="filter-checked-in"
                  >
                    Checked In
                  </button>
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    data-testid="filter-all"
                  >
                    All
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⏳</div>
                  <p className="text-lg text-gray-600">Loading registrations...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">❌</div>
                  <p className="text-lg text-red-600">{error}</p>
                  <button
                    onClick={loadRegistrations}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-lg text-gray-600">
                    {filter === 'pending' ? 'No pending check-ins' : 'No registrations found'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {registrations.length} {filter === 'all' ? '' : filter} registration(s)
                  </div>
                  <div className="space-y-3" data-testid="registration-list">
                    {registrations.map(reg => (
                      <RegistrationCard key={reg.id} registration={reg} onCheckIn={handleCheckIn} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            data-testid="btn-back-to-dashboard"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={loadRegistrations}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            data-testid="btn-refresh"
          >
            🔄 Refresh List
          </button>
        </div>
      </div>
    </div>
  );
}

// Registration Card Component
function RegistrationCard({ 
  registration, 
  onCheckIn 
}: { 
  registration: Registration; 
  onCheckIn: (reg: Registration) => void;
}) {
  const isCheckedIn = registration.tokenStatus === 'used' && registration.checkedInAt;
  const statusColor = isCheckedIn ? 'green' : 'yellow';
  const statusText = isCheckedIn ? 'Checked In' : 'Pending';

  return (
    <div
      className={`border-2 rounded-lg p-4 ${
        isCheckedIn ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
      }`}
      data-testid={`registration-card-${registration.id}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900">{registration.name}</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isCheckedIn
                  ? 'bg-green-200 text-green-800'
                  : 'bg-yellow-200 text-yellow-800'
              }`}
              data-testid={`status-${registration.id}`}
            >
              {statusText}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            {registration.email && (
              <p data-testid={`email-${registration.id}`}>
                <span className="font-medium">Email:</span> {registration.email}
              </p>
            )}
            {registration.phone && (
              <p data-testid={`phone-${registration.id}`}>
                <span className="font-medium">Phone:</span> {registration.phone}
              </p>
            )}
            <p data-testid={`registered-${registration.id}`}>
              <span className="font-medium">Registered:</span>{' '}
              {new Date(registration.registeredAt).toLocaleString()}
            </p>
            {isCheckedIn && registration.checkedInAt && (
              <p className="text-green-700 font-medium" data-testid={`checked-in-${registration.id}`}>
                ✅ Checked in at {new Date(registration.checkedInAt).toLocaleTimeString()}
                {registration.checkedInBy && ` by ${registration.checkedInBy}`}
              </p>
            )}
          </div>
        </div>

        <div className="ml-4">
          {!isCheckedIn ? (
            <button
              onClick={() => onCheckIn(registration)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              data-testid={`btn-check-in-${registration.id}`}
            >
              ✓ Check In
            </button>
          ) : (
            <button
              onClick={() => onCheckIn(registration)}
              className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium transition-colors"
              data-testid={`btn-view-${registration.id}`}
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

