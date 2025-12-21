'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CouponForm } from '@/components/admin/CouponForm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NewCouponPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const handleSuccess = () => {
    setSubmitted(true);
    setTimeout(() => {
      router.push('/admin/coupons');
    }, 1500);
  };

  const handleCancel = () => {
    router.push('/admin/coupons');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Coupon</h1>
          <p className="text-gray-600 mt-2">Create a new discount coupon for your customers</p>
        </div>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <p className="text-green-700 text-lg font-semibold">Coupon created successfully!</p>
            <p className="text-green-600 mt-2">Redirecting to coupon list...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <CouponForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </div>
        )}
      </div>
    </div>
  );
}
