'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

export default function RegistrationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const registrationId = params.id as string;

  useEffect(() => {
    fetchRegistration();
  }, [registrationId]);

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setRegistration(result.data);
      } else {
        setError(result.error || 'Registration not found');
      }
    } catch (err) {
      setError('Failed to load registration');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!registration || registration.checkedInAt) return;
    
    setCheckingIn(true);
    try {
      const response = await fetch(`/api/registrations/${registrationId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedInBy: session?.user?.email })
      });
      
      if (response.ok) {
        await fetchRegistration(); // Refresh data
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to check in registration');
      }
    } catch (err) {
      alert('Error checking in registration');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading registration...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Registration not found'}
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/registrations"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Registrations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formData = JSON.parse(registration.registrationData);
  
  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 text-sm font-semibold rounded-full';
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/registrations"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm mb-2 inline-block"
            >
              ← Back to Registrations
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Registration Details</h1>
          </div>
          {!registration.checkedInAt && (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{checkingIn ? '⏳' : '✓'}</span>
              <span>{checkingIn ? 'Checking In...' : 'Check In'}</span>
            </button>
          )}
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Status</h2>
            <span className={getStatusBadge(registration.deliveryStatus)}>
              {registration.deliveryStatus}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Registered</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(registration.registeredAt).toLocaleString()}
              </p>
            </div>
            {registration.checkedInAt && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Checked In</p>
                  <p className="text-sm font-medium text-green-600">
                    {new Date(registration.checkedInAt).toLocaleString()}
                  </p>
                </div>
                {registration.checkedInBy && (
                  <div>
                    <p className="text-sm text-gray-600">Checked In By</p>
                    <p className="text-sm font-medium text-gray-900">
                      {registration.checkedInBy}
                    </p>
                  </div>
                )}
              </>
            )}
            {registration.deliveredAt && (
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(registration.deliveredAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {registration.checkedInAt && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-green-600">
                <span className="text-xl">✅</span>
                <span className="font-medium">This registration has been checked in</span>
              </div>
            </div>
          )}
        </div>

        {/* Registration Data */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key}>
                <p className="text-sm text-gray-600 capitalize mb-1">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-base font-medium text-gray-900">
                  {String(value || '-')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Details</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Registration ID</p>
              <p className="text-sm font-mono text-gray-900">{registration.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">QR Code Set ID</p>
              <p className="text-sm font-mono text-gray-900">{registration.qrCodeSetId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">QR Code ID</p>
              <p className="text-sm font-mono text-gray-900">{registration.qrCodeId}</p>
            </div>
            {registration.ipAddress && (
              <div>
                <p className="text-sm text-gray-600">IP Address</p>
                <p className="text-sm font-mono text-gray-900">{registration.ipAddress}</p>
              </div>
            )}
            {registration.userAgent && (
              <div>
                <p className="text-sm text-gray-600">User Agent</p>
                <p className="text-sm text-gray-900 break-all">{registration.userAgent}</p>
              </div>
            )}
            {registration.referrer && (
              <div>
                <p className="text-sm text-gray-600">Referrer</p>
                <p className="text-sm text-gray-900 break-all">{registration.referrer}</p>
              </div>
            )}
            {registration.tokenStatus && (
              <div>
                <p className="text-sm text-gray-600">Token Status</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{registration.tokenStatus}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/registrations"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Registrations
          </Link>
          
          {!registration.checkedInAt && (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingIn ? 'Checking In...' : 'Check In Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}








