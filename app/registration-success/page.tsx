'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface RegistrationData {
  id: string;
  checkInToken: string;
  registrationData: any;
  registeredAt: string;
  organizationName?: string;
  eventName?: string;
}

function RegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!registrationId) {
      setError('No registration ID provided');
      setLoading(false);
      return;
    }

    async function loadRegistration() {
      try {
        // Fetch registration details
        const response = await fetch(`/api/registrations/${registrationId}`);
        const data = await response.json();

        if (!response.ok || !data.registration) {
          throw new Error(data.error || 'Registration not found');
        }

        const reg = data.registration;
        
        if (!reg.checkInToken) {
          throw new Error('Check-in token not available for this registration');
        }

        setRegistration({
          id: reg.id,
          checkInToken: reg.checkInToken,
          registrationData: JSON.parse(reg.registrationData || '{}'),
          registeredAt: reg.registeredAt,
          organizationName: data.organizationName,
          eventName: data.eventName
        });

        // Generate QR code from check-in token
        const checkInUrl = `${window.location.origin}/check-in/${reg.checkInToken}`;
        const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 300,
          color: {
            dark: '#1e40af', // blue-800
            light: '#ffffff',
          },
        });

        setQrCodeDataUrl(qrDataUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error loading registration:', err);
        setError(err instanceof Error ? err.message : 'Failed to load registration');
        setLoading(false);
      }
    }

    loadRegistration();
  }, [registrationId]);

  const handleEmailQRCode = async () => {
    if (!registration) return;

    setSendingEmail(true);
    try {
      // Send email with QR code
      const response = await fetch('/api/registrations/send-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: registration.id,
          checkInToken: registration.checkInToken,
          qrCodeDataUrl
        })
      });

      if (response.ok) {
        setEmailSent(true);
      } else {
        alert('Failed to send email. Please take a screenshot of this QR code.');
      }
    } catch (err) {
      alert('Failed to send email. Please take a screenshot of this QR code.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveQRCode = () => {
    if (!qrCodeDataUrl) return;

    // Create download link
    const link = document.createElement('a');
    link.download = `checkin-qr-${registration?.id.substring(0, 8)}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" data-testid="page-registration-success">
        <div className="text-center" data-testid="loading-registration-success" data-loading="true">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading your registration...</p>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4" data-testid="page-registration-success">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Not Found</h1>
            <p className="text-gray-600 mb-6" data-testid="error-registration-success" role="alert">
              {error || 'Could not load registration details'}
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

  const registrantName = registration.registrationData.name || registration.registrationData.firstName || 'Registrant';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4" data-testid="page-registration-success">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
            <p className="text-gray-600">
              {registrantName}, you're all set!
            </p>
          </div>

          {/* Event Details */}
          {(registration.organizationName || registration.eventName) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Event Details</h2>
              {registration.organizationName && (
                <p className="text-gray-700">Organization: {registration.organizationName}</p>
              )}
              {registration.eventName && (
                <p className="text-gray-700">Event: {registration.eventName}</p>
              )}
              <p className="text-gray-600 text-sm mt-2">
                Registered: {new Date(registration.registeredAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Check-In QR Code - THE MAGIC! */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-6 mb-6" data-testid="checkin-qr-container">
            <h2 className="text-xl font-bold text-center text-gray-900 mb-3">
              🎫 Your Check-In QR Code
            </h2>
            
            <div className="bg-white rounded-xl p-6 mb-4 text-center">
              {qrCodeDataUrl && (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Check-in QR Code" 
                  className="mx-auto mb-4"
                  data-testid="img-checkin-qr"
                  style={{ width: '300px', height: '300px' }}
                />
              )}
              
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold text-yellow-900 mb-2">
                  ⚠️ IMPORTANT: Save this QR code!
                </p>
                <p className="text-sm text-yellow-800">
                  Show this QR code to staff when you arrive at the event for instant check-in.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSaveQRCode}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                data-testid="btn-save-qr"
                aria-label="Save QR code to device"
              >
                <span>💾</span>
                Save to Phone
              </button>
              
              <button
                onClick={handleEmailQRCode}
                disabled={sendingEmail || emailSent}
                className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="btn-email-qr"
                aria-label="Email QR code to me"
              >
                <span>📧</span>
                {emailSent ? 'Email Sent!' : sendingEmail ? 'Sending...' : 'Email Me'}
              </button>
            </div>
          </div>

          {/* Registration Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Your Registration Details</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(registration.registrationData).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-gray-900 font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">1.</span>
                <span>Save this QR code to your phone or email it to yourself</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">2.</span>
                <span>Bring your phone to the event</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">3.</span>
                <span>Show this QR code to staff for instant check-in</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">4.</span>
                <span>Receive your service or product - that's it!</span>
              </li>
            </ul>
          </div>

          {/* Close Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => window.close()}
              className="text-gray-600 hover:text-gray-800 text-sm underline"
              data-testid="btn-close-success-page"
            >
              Close this page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RegistrationSuccessContent />
    </Suspense>
  );
}

