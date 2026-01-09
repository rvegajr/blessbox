'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegistrationDetails {
  id: string;
  registrationData: any;
  registeredAt: string;
  checkedInAt?: string;
  checkedInBy?: string;
  tokenStatus: string;
  organizationName?: string;
  eventName?: string;
}

export default function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<RegistrationDetails | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    async function loadRegistration() {
      try {
        // Fetch registration by check-in token
        const response = await fetch(`/api/registrations/by-token/${token}`);
        const data = await response.json();

        if (!response.ok || !data.registration) {
          throw new Error(data.error || 'Registration not found');
        }

        const reg = data.registration;
        setRegistration({
          id: reg.id,
          registrationData: JSON.parse(reg.registrationData || '{}'),
          registeredAt: reg.registeredAt,
          checkedInAt: reg.checkedInAt,
          checkedInBy: reg.checkedInBy,
          tokenStatus: reg.tokenStatus || 'active',
          organizationName: data.organizationName,
          eventName: data.eventName
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading registration:', err);
        setError(err instanceof Error ? err.message : 'Failed to load registration');
        setLoading(false);
      }
    }

    loadRegistration();
  }, [token]);

  const handleCheckIn = async () => {
    if (!registration) return;

    setCheckingIn(true);
    setError(null);

    try {
      const response = await fetch(`/api/registrations/${registration.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkedInBy: 'Staff', // Can be enhanced with staff login
          token // Include token for authentication
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Check-in failed');
      }

      setCheckInSuccess(true);
      
      // Update registration with check-in details
      setRegistration(prev => prev ? {
        ...prev,
        checkedInAt: data.registration?.checkedInAt || new Date().toISOString(),
        checkedInBy: data.registration?.checkedInBy || 'Staff',
        tokenStatus: 'used'
      } : null);

    } catch (err) {
      console.error('Check-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleUndoCheckIn = async () => {
    if (!registration) return;

    try {
      const response = await fetch(`/api/registrations/${registration.id}/undo-check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Undo failed');
      }

      // Update registration
      setRegistration(prev => prev ? {
        ...prev,
        checkedInAt: undefined,
        checkedInBy: undefined,
        tokenStatus: 'active'
      } : null);

      setCheckInSuccess(false);
      setError(null);

    } catch (err) {
      console.error('Undo check-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to undo check-in');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" data-testid="page-checkin">
        <div className="text-center" data-testid="loading-checkin" data-loading="true">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading registration...</p>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4" data-testid="page-checkin">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Check-In Code</h1>
            <p className="text-gray-600 mb-6" data-testid="error-checkin" role="alert">
              {error || 'This check-in code is not valid or has expired.'}
            </p>
            <a 
              href="/" 
              className="inline-block bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const registrantName = registration.registrationData.name || 
                         registration.registrationData.firstName || 
                         'Guest';
  const isAlreadyCheckedIn = !!registration.checkedInAt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4" data-testid="page-checkin">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎫</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isAlreadyCheckedIn ? 'Already Checked In' : 'Check-In Interface'}
            </h1>
          </div>

          {/* Success Message */}
          {checkInSuccess && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6 text-center" data-testid="checkin-success">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Checked In Successfully!</h2>
              <p className="text-green-800">
                {registrantName} has been checked in at {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6" data-testid="error-checkin" role="alert">
              {error}
            </div>
          )}

          {/* Registration Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Registrant Details</h2>
            
            <div className="space-y-3">
              {Object.entries(registration.registrationData).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600 capitalize font-medium">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {String(value)}
                  </span>
                </div>
              ))}
              
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-600 font-medium">Registered At:</span>
                <span className="text-gray-900 font-semibold">
                  {new Date(registration.registeredAt).toLocaleString()}
                </span>
              </div>

              {isAlreadyCheckedIn && (
                <>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600 font-medium">Checked In At:</span>
                    <span className="text-gray-900 font-semibold">
                      {new Date(registration.checkedInAt!).toLocaleString()}
                    </span>
                  </div>
                  {registration.checkedInBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Checked In By:</span>
                      <span className="text-gray-900 font-semibold">
                        {registration.checkedInBy}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Check-In Status Badge */}
          <div className="mb-6">
            {isAlreadyCheckedIn ? (
              <div className="bg-green-100 border border-green-300 rounded-xl p-4 text-center">
                <span className="text-2xl mr-2">✅</span>
                <span className="text-green-800 font-semibold">
                  This person has already been checked in
                </span>
              </div>
            ) : (
              <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 text-center">
                <span className="text-2xl mr-2">⏳</span>
                <span className="text-yellow-800 font-semibold">
                  Ready for check-in
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isAlreadyCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="btn-checkin-confirm"
              data-loading={checkingIn}
              aria-label="Check in this person"
            >
              {checkingIn ? 'Checking In...' : '✅ Check In This Person'}
            </button>
          ) : (
            <button
              onClick={handleUndoCheckIn}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl hover:bg-orange-700 transition-colors font-semibold"
              data-testid="btn-undo-checkin"
              aria-label="Undo check-in"
            >
              ↩️ Undo Check-In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

