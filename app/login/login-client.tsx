/**
 * Login Client Component
 * 
 * Authentication via 6-digit email verification codes.
 * Email is the source of truth for identity.
 */

'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export function LoginClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { status, sendCode, verifyCode, organizations, activeOrganizationId, refresh } = useAuth();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('[Login] Authenticated, checking organizations:', {
        orgsCount: organizations?.length,
        activeOrgId: activeOrganizationId,
        orgNames: organizations?.map(o => o.name)
      });
      
      // If user has multiple organizations but none selected, redirect to org selection
      if (organizations && organizations.length > 1 && !activeOrganizationId) {
        console.log('[Login] Multiple orgs, no active org -> redirecting to select-organization');
        router.push(`/select-organization?next=${encodeURIComponent(nextPath)}`);
      } 
      // If user has exactly ONE organization, auto-select it if not already selected
      else if (organizations && organizations.length === 1 && !activeOrganizationId) {
        console.log('[Login] Single org, auto-selecting:', organizations[0].name);
        // Auto-select the only organization
        const singleOrg = organizations[0];
        fetch('/api/me/active-organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId: singleOrg.id })
        }).then(() => {
          refresh().then(() => {
            console.log('[Login] Auto-selected single org, now redirecting to:', nextPath);
            router.push(nextPath);
          });
        }).catch(err => {
          console.error('[Login] Failed to auto-select organization:', err);
          router.push(nextPath); // Try anyway
        });
      }
      else {
        console.log('[Login] Active org already set, redirecting to:', nextPath);
        router.push(nextPath);
      }
    }
  }, [status, router, nextPath, organizations, activeOrganizationId, refresh]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await sendCode(value);
    
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Failed to send code');
      return;
    }

    setStep('code');
    setCountdown(60); // 60 second cooldown before resend
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await verifyCode(email.trim().toLowerCase(), code);
    
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid code');
      return;
    }

    // Refresh to get updated organizations
    await refresh();
    
    // Success - redirect will happen via the useEffect above
  }

  async function handleResendCode() {
    if (countdown > 0) return;
    
    setLoading(true);
    setError(null);

    const result = await sendCode(email.trim().toLowerCase());
    
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to resend code');
      return;
    }

    setCountdown(60);
  }

  function handleBackToEmail() {
    setStep('email');
    setCode('');
    setError(null);
  }

  // Show loading while checking auth status
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="page-login">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-login">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-gray-600 mt-2">
            {step === 'email' 
              ? "Enter your email to receive a verification code."
              : `We sent a 6-digit code to ${email}`
            }
          </p>

          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="mt-6 space-y-4" data-testid="form-login" data-loading={loading}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                  data-testid="input-email"
                  aria-label="Email address"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm" data-testid="error-login" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="btn-submit-login"
                data-loading={loading}
                disabled={loading}
                aria-label="Send verification code"
              >
                {loading ? 'Sending…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="mt-6 space-y-4" data-testid="form-verify" data-loading={loading}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(value);
                    setError(null);
                  }}
                  className="w-full px-3 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000"
                  data-testid="input-code"
                  aria-label="Verification code"
                  required
                  disabled={loading}
                  autoFocus
                  maxLength={6}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm" data-testid="error-verify" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="btn-verify-code"
                data-loading={loading}
                disabled={loading || code.length !== 6}
                aria-label="Verify code"
              >
                {loading ? 'Verifying…' : 'Sign in'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-blue-600 hover:text-blue-800"
                  data-testid="btn-back-to-email"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || loading}
                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  data-testid="btn-resend-code"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Don't have an account?{' '}
              <a href="/onboarding/organization-setup" className="text-blue-600 hover:text-blue-800 font-medium">
                Get started
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
