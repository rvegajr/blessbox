'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ClassForm from '@/components/classes/ClassForm';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';

export default function NewClassPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { ready } = useRequireActiveOrganization();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }
    
    if (!ready) return;
    setLoading(false);
  }, [ready, session, status, router]);

  if (loading || status === 'loading' || !ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClassForm />
      </div>
    </div>
  );
}

