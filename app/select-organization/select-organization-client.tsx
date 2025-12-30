'use client';

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/hooks/useAuth';

type Org = { id: string; name: string; contactEmail: string; role: string };

export default function SelectOrganizationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const nextPath = useMemo(() => {
    const next = searchParams.get('next');
    return next && next.startsWith('/') ? next : '/dashboard';
  }, [searchParams]);

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/me/organizations');
        if (!res.ok) throw new Error('Failed to load organizations');
        const data = await res.json();
        const list = Array.isArray(data.organizations) ? (data.organizations as Org[]) : [];
        if (!cancelled) {
          setOrgs(list);
          const active = typeof data.activeOrganizationId === 'string' ? data.activeOrganizationId : '';
          setSelected(active || (list[0]?.id ?? ''));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load organizations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirm() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/me/active-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to set active organization');
      router.replace(nextPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set active organization');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900">Select an organization</h1>
          <p className="text-gray-600 mt-2">
            Your email is associated with multiple organizations. Choose which one you want to manage right now.
          </p>

          {status !== 'authenticated' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm">
              You must be signed in to select an organization.
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}

          {loading ? (
            <div className="mt-8 text-gray-600">Loading organizations…</div>
          ) : orgs.length === 0 ? (
            <div className="mt-8 text-gray-600">No organizations found for your account.</div>
          ) : (
            <div className="mt-6 space-y-3">
              {orgs.map((o) => (
                <label
                  key={o.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    selected === o.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="org"
                    value={o.id}
                    checked={selected === o.id}
                    onChange={() => setSelected(o.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{o.name || 'Unnamed organization'}</div>
                    <div className="text-sm text-gray-600 truncate">{o.contactEmail}</div>
                    <div className="text-xs text-gray-500 mt-1">Role: {o.role}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push('/onboarding/organization-setup')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Register another organization
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={saving || !selected || status !== 'authenticated'}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

