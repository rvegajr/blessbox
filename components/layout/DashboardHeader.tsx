'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export function DashboardHeader() {
  const { user, organizations, activeOrganizationId, logout, setActiveOrganization, refresh } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);

  // Close org menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setOrgMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOrg = organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0];
  const isMainDashboard = pathname === '/dashboard';

  const handleSignOut = async () => {
    setSigningOut(true);
    await logout();
    router.push('/login');
  };

  const handleSwitchOrg = async (orgId: string) => {
    setOrgMenuOpen(false);
    await setActiveOrganization(orgId);
    await refresh();
    router.push('/dashboard');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Logo + back button */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="text-indigo-600 font-bold text-lg tracking-tight whitespace-nowrap hover:text-indigo-800 transition-colors"
        >
          BlessBox
        </Link>

        {!isMainDashboard && (
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Back to Dashboard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        )}
      </div>

      {/* Right: Org switcher + sign out */}
      <div className="flex items-center gap-3">
        {/* Org switcher — only shown when user belongs to multiple orgs */}
        {organizations.length > 1 ? (
          <div className="relative" ref={orgMenuRef}>
            <button
              onClick={() => setOrgMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors max-w-[180px]"
              aria-haspopup="listbox"
              aria-expanded={orgMenuOpen}
            >
              <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="truncate">{activeOrg?.name ?? 'Select org'}</span>
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {orgMenuOpen && (
              <div
                role="listbox"
                className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50"
              >
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    role="option"
                    aria-selected={org.id === activeOrganizationId}
                    onClick={() => handleSwitchOrg(org.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2 ${
                      org.id === activeOrganizationId ? 'text-indigo-700 font-semibold bg-indigo-50' : 'text-gray-700'
                    }`}
                  >
                    {org.id === activeOrganizationId && (
                      <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="truncate">{org.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Single org — just show the name, no dropdown needed */
          activeOrg && (
            <span className="text-sm text-gray-500 font-medium truncate max-w-[160px]" title={activeOrg.name}>
              {activeOrg.name}
            </span>
          )
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
          aria-label="Sign out"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">{signingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </header>
  );
}
