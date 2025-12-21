'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CouponForm } from '@/components/admin/CouponForm';

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;

  const [coupon, setCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadCoupon();
  }, [couponId]);

  const loadCoupon = async () => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load coupon');
      }

      const data = await response.json();
      setCoupon(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setSubmitted(true);
    setTimeout(() => {
      router.push('/admin/coupons');
    }, 1500);
  };

  const handleCancel = () => {
    router.push('/admin/coupons');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => router.push('/admin/coupons')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              ← Back to Coupons
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">Coupon not found</p>
            <button
              onClick={() => router.push('/admin/coupons')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              ← Back to Coupons
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Coupon</h1>
          <p className="text-gray-600 mt-2">Update coupon details</p>
        </div>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <p className="text-green-700 text-lg font-semibold">Coupon updated successfully!</p>
            <p className="text-green-600 mt-2">Redirecting to coupon list...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <CouponForm coupon={coupon} onSuccess={handleSuccess} onCancel={handleCancel} />
          </div>
        )}
      </div>
    </div>
  );
}
