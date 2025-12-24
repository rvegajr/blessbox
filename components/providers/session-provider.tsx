'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import type { Session } from 'next-auth';

export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [testSession, setTestSession] = useState<Session | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const cookie = typeof document !== 'undefined' ? document.cookie : '';
    const has = (name: string) => cookie.split(';').some(p => p.trim().startsWith(`${name}=`));
    if (!has('bb_test_auth')) return;

    const read = (name: string): string | null => {
      const part = cookie.split(';').map(p => p.trim()).find(p => p.startsWith(`${name}=`));
      if (!part) return null;
      return decodeURIComponent(part.split('=').slice(1).join('='));
    };

    const email = read('bb_test_email') || 'seed-local@example.com';
    const orgId = read('bb_test_org_id');
    const isAdmin = read('bb_test_admin') === '1';

    setTestSession({
      user: {
        email,
        name: isAdmin ? 'Test Admin' : 'Test User',
        id: 'test-user',
        ...(orgId ? { organizationId: orgId } : {}),
        ...(isAdmin ? { role: 'super_admin' } : {}),
      } as any,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }, []);

  const providerProps = useMemo(() => {
    if (testSession) {
      // Lock session for deterministic tests
      return { session: testSession, refetchInterval: 0, refetchOnWindowFocus: false };
    }
    return {};
  }, [testSession]);

  return <SessionProvider {...providerProps}>{children}</SessionProvider>;
}


