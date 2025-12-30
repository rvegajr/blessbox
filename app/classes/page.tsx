'use client';

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import ClassList from '@/components/classes/ClassList';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';

export default function ClassesPage() {
  const { user, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { ready } = useRequireActiveOrganization();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/classes')}`);
      return;
    }
    
    if (!ready) return;
    setLoading(false);
  }, [ready, user, status, router, pathname]);

  if (loading || status === 'loading' || !ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClassList />
      </div>
    </div>
  );
}

