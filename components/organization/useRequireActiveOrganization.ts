'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

type OrgListResponse = {
  organizations: Array<{ id: string; name: string; contactEmail: string; role: string }>;
  activeOrganizationId: string | null;
};

export function useRequireActiveOrganization(): { ready: boolean; activeOrganizationId: string | null } {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const sessionOrgId = useMemo(() => ((session?.user as any)?.organizationId as string | undefined) || null, [session]);
  const [ready, setReady] = useState(false);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(sessionOrgId);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // If we aren't authenticated, don't block rendering (pages will handle 401).
      if (status !== 'authenticated') {
        if (!cancelled) {
          setActiveOrganizationId(sessionOrgId);
          setReady(true);
        }
        return;
      }

      // Already have an active org in the session.
      if (sessionOrgId) {
        if (!cancelled) {
          setActiveOrganizationId(sessionOrgId);
          setReady(true);
        }
        return;
      }

      // Otherwise: check memberships.
      try {
        const res = await fetch('/api/me/organizations', { method: 'GET' });
        if (!res.ok) {
          if (!cancelled) setReady(true);
          return;
        }

        const data = (await res.json()) as OrgListResponse;
        const orgs = Array.isArray(data.organizations) ? data.organizations : [];

        if (orgs.length <= 1) {
          if (orgs.length === 1) {
            // Auto-select the only org.
            const setRes = await fetch('/api/me/active-organization', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ organizationId: orgs[0].id }),
            });
            if (setRes.ok && !cancelled) {
              setActiveOrganizationId(orgs[0].id);
            }
          }

          if (!cancelled) setReady(true);
          return;
        }

        // Multiple orgs → must choose.
        const next = encodeURIComponent(pathname || '/dashboard');
        router.replace(`/select-organization?next=${next}`);
      } finally {
        // If we redirected, we don't set ready; otherwise allow page to render.
        if (!cancelled && (pathname || '') === '/select-organization') {
          setReady(true);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, sessionOrgId, status]);

  return { ready, activeOrganizationId };
}

