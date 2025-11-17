'use client';

import { CouponListTable } from '@/components/admin/CouponListTable';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminCouponsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <CouponListTable />
      </div>
    </div>
  );
}
