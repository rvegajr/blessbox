'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CheckoutSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const planType = params.get('plan') || 'single-org';

  const [state, setState] = useState<'activating' | 'success' | 'error'>('activating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function activate() {
      try {
        const res = await fetch('/api/payment/activate-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planType }),
        });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok || !data?.success) {
          setErrorMessage(data?.error || 'Subscription activation failed');
          setState('error');
          return;
        }

        setState('success');
        setTimeout(() => {
          if (!cancelled) router.replace('/dashboard');
        }, 1500);
      } catch {
        if (!cancelled) {
          setErrorMessage('Network error — please contact support.');
          setState('error');
        }
      }
    }

    activate();
    return () => { cancelled = true; };
  }, [planType, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" data-testid="page-checkout-success">
      <div className="bg-white rounded-lg shadow-lg p-10 max-w-md w-full text-center">
        {state === 'activating' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Activating your subscription...</h1>
            <p className="text-gray-500 mt-2 text-sm">This will only take a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Subscription activated!</h1>
            <p className="text-gray-500 mt-2 text-sm">Redirecting to your dashboard...</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Something went wrong</h1>
            <p className="text-gray-500 mt-2 text-sm">{errorMessage}</p>
            <p className="text-gray-400 mt-4 text-xs">
              Your payment may have gone through. Please contact{' '}
              <a href="mailto:support@blessbox.org" className="text-blue-600 underline">
                support@blessbox.org
              </a>{' '}
              if you were charged.
            </p>
            <button
              type="button"
              onClick={() => router.replace('/dashboard')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
