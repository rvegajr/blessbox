"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
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
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null);
  const rawPlan = (params.get('plan') || 'standard').toLowerCase();
  const plan = (['free', 'standard', 'enterprise'] as const).includes(rawPlan as any)
    ? (rawPlan as 'free' | 'standard' | 'enterprise')
    : 'standard';

  // Plan pricing (in cents)
  const planPricing = {
    free: 0,
    standard: 1900, // $19.00
    enterprise: 9900, // $99.00
  };

  const baseAmountCents = planPricing[plan] ?? planPricing.standard;

  const [couponCode, setCouponCode] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    discountedAmountCents: number;
    discountAppliedCents: number;
  } | null>(null);

  const amountCents = useMemo(() => couponApplied?.discountedAmountCents ?? baseAmountCents, [couponApplied, baseAmountCents]);
  const discountCents = useMemo(() => couponApplied?.discountAppliedCents ?? 0, [couponApplied]);

  useEffect(() => {
    async function loadSquareConfig() {
      try {
        const res = await fetch('/api/square/config');
        const config = await res.json();
        
        if (config.error || !config.enabled) {
          // Local/dev may not have Square configured; checkout can still proceed via mock payment.
          setStatus(`Payment provider not configured (using test checkout)`);
          return;
        }
        
        setSquareConfig(config);
        setStatus('Square payment form loaded');
      } catch (e) {
        setStatus('Payment provider not configured (using test checkout)');
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

  const applyCoupon = async () => {
    const code = couponCode.trim();
    setCouponApplying(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, planType: plan, amountCents: baseAmountCents }),
      });
      const data = await res.json();
      if (!data?.success || !data?.valid) {
        setCouponApplied(null);
        setCouponError(data?.error || 'Invalid coupon code');
        return;
      }
      setCouponApplied({
        code: data.code,
        discountedAmountCents: Number(data.discountedAmountCents),
        discountAppliedCents: Number(data.discountAppliedCents),
      });
      setCouponError(null);
    } catch (e) {
      setCouponApplied(null);
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponApplying(false);
    }
  };

  const clearCoupon = () => {
    setCouponApplied(null);
    setCouponError(null);
    setCouponCode('');
  };

  const completeTestCheckout = async () => {
    try {
      setStatus('Processing payment...');
      const res = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: plan,
          billingCycle: 'monthly',
          currency: 'USD',
          amount: amountCents,
          ...(amountCents > 0 ? { paymentToken: 'test-token' } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setStatus(`Payment failed: ${data?.error || 'Payment failed'}`);
        return;
      }
      handlePaymentSuccess(data);
    } catch (e) {
      handlePaymentError('Payment processing failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600 mb-8">
            Complete your subscription to the <strong className="uppercase text-blue-600">{plan}</strong> plan
          </p>

          {/* Coupon */}
          <div className="mb-6">
            <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter coupon code (e.g., FREE100)"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponApplying}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {couponApplying ? 'Applying...' : 'Apply'}
              </button>
              {couponApplied && (
                <button
                  type="button"
                  onClick={clearCoupon}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
            {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
            {couponApplied && (
              <p className="mt-2 text-sm text-green-700">
                Applied <strong>{couponApplied.code}</strong> (saved ${(discountCents / 100).toFixed(2)})
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Plan price</span>
              <span>${(baseAmountCents / 100).toFixed(2)} USD</span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-sm text-gray-700 mt-2">
                <span>Discount</span>
                <span>- ${(discountCents / 100).toFixed(2)} USD</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-lg font-semibold text-gray-900">${(amountCents / 100).toFixed(2)} USD</span>
            </div>
          </div>

          {/* Payment */}
          {amountCents === 0 ? (
            <button
              type="button"
              onClick={completeTestCheckout}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Complete Checkout
            </button>
          ) : squareConfig ? (
            <SquarePaymentForm
              amount={amountCents}
              currency="USD"
              planType={(plan as any) || 'standard'}
              billingCycle="monthly"
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              applicationId={squareConfig.applicationId}
              locationId={squareConfig.locationId}
            />
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information (Test Checkout)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="4111 1111 1111 1111"
                      defaultValue="4111 1111 1111 1111"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="123" defaultValue="123" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="12/25" defaultValue="12/25" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP</label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="12345" defaultValue="12345" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={completeTestCheckout}
                  className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Complete Payment
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Local/dev checkout uses a mock payment flow when Square isn’t configured.
              </p>
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
