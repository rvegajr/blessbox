"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SquarePaymentForm from '@/components/payment/SquarePaymentForm';

interface SquareConfig {
  applicationId: string;
  locationId: string;
  environment: string;
}

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null);
  const plan = (params.get('plan') || 'standard').toLowerCase();

  // Plan pricing (in cents)
  const planPricing = {
    free: 0,
    standard: 2999, // $29.99
    enterprise: 9999, // $99.99
  };

  const amount = planPricing[plan as keyof typeof planPricing] || planPricing.standard;

  useEffect(() => {
    async function loadSquareConfig() {
      try {
        const res = await fetch('/api/square/config');
        const config = await res.json();
        
        if (config.error) {
          setStatus(`Square configuration error: ${config.message}`);
          return;
        }
        
        setSquareConfig(config);
        setStatus('Square payment form loaded');
      } catch (e) {
        setStatus('Failed to load Square configuration');
        console.error('Square config error:', e);
      }
    }
    
    loadSquareConfig();
  }, []);

  const handlePaymentSuccess = (paymentResult: any) => {
    setStatus('Payment successful! Redirecting to dashboard...');
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setStatus(`Payment failed: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600 mb-8">
            Complete your subscription to the <strong className="uppercase text-blue-600">{plan}</strong> plan
          </p>

          {squareConfig ? (
            <SquarePaymentForm
              amount={amount}
              currency="USD"
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              applicationId={squareConfig.applicationId}
              locationId={squareConfig.locationId}
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading payment form...</span>
            </div>
          )}

          {status && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">{status}</p>
            </div>
          )}

          <div className="mt-8 text-xs text-gray-500 text-center">
            <p>🔒 Your payment information is secure and encrypted</p>
            <p>Powered by Square • PCI DSS Compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading checkout...</span>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
