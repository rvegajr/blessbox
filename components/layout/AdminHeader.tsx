'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export function AdminHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const isMainAdmin = pathname === '/admin';

  const handleSignOut = async () => {
    setSigningOut(true);
    await logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-30" data-testid="header-admin">
      {/* Left: Logo + back button */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/admin"
          className="text-indigo-600 font-bold text-lg tracking-tight whitespace-nowrap hover:text-indigo-800 transition-colors"
          data-testid="link-admin-home"
        >
          BlessBox <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-1">Admin</span>
        </Link>

        {!isMainAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Back to Admin"
            data-testid="btn-back-admin"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Admin
          </Link>
        )}
      </div>

      {/* Right: User info + dashboard link + sign out */}
      <div className="flex items-center gap-3">
        {/* User email indicator */}
        {user?.email && (
          <span className="text-xs text-gray-500 font-medium hidden sm:inline truncate max-w-[160px]" title={user.email}>
            {user.email}
          </span>
        )}

        {/* Dashboard link */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          aria-label="Go to Dashboard"
          data-testid="link-dashboard"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
          aria-label="Sign out"
          data-testid="btn-signout"
          data-loading={signingOut}
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
