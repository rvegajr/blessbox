'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect /dashboard/diagnostics to /system/diagnostics
 * 
 * Aracela (Issue #31) expects /dashboard/diagnostics to either:
 * - Redirect to /system/diagnostics, or
 * - Render diagnostics content
 * 
 * This page implements the redirect approach.
 */
export default function DashboardDiagnosticsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/system/diagnostics');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to diagnostics...</p>
      </div>
    </div>
  );
}
