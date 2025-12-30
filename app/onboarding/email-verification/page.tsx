/**
 * Email Verification Page
 * 
 * Second step of onboarding. Users verify their email with a 6-digit code.
 * After verification:
 * 1. Create organization (with data from localStorage)
 * 2. Create user account
 * 3. Create membership (user -> org)
 * 4. Create session
 * 5. Navigate to form builder
 */

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useAuth } from '@/lib/hooks/useAuth';
import { onboardingSession } from '@/lib/services/OnboardingSessionService';

export default function EmailVerificationPage() {
  const router = useRouter();
  const { sendCode, verifyCode, status } = useAuth();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Load email from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedEmail = window.localStorage.getItem('onboarding_contactEmail');
    if (!storedEmail) {
      // No email saved - redirect back to org setup
      router.replace('/onboarding/organization-setup');
      return;
    }
    
    setEmail(storedEmail);
  }, [router]);

  // Auto-send code when email is set
  useEffect(() => {
    if (email && !codeSent && !sending) {
      handleSendCode();
    }
  }, [email]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // If already authenticated, redirect to form builder
  useEffect(() => {
    if (status === 'authenticated') {
      const orgId = typeof window !== 'undefined' 
        ? window.localStorage.getItem('onboarding_organizationId') 
        : null;
      if (orgId) {
        router.replace('/onboarding/form-builder');
      }
    }
  }, [status, router]);

  const handleSendCode = async () => {
    if (!email || sending) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    const result = await sendCode(email);
    
    setSending(false);

    if (!result.success) {
      setError(result.error || 'Failed to send verification code');
      return;
    }

    setCodeSent(true);
    setCountdown(60);
    setSuccess('Verification code sent! Check your email.');
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, create the organization
      const orgData = {
        name: window.localStorage.getItem('onboarding_orgName') || '',
        eventName: window.localStorage.getItem('onboarding_eventName') || '',
        contactEmail: email,
        contactPhone: window.localStorage.getItem('onboarding_contactPhone') || '',
        contactAddress: window.localStorage.getItem('onboarding_contactAddress') || '',
        contactCity: window.localStorage.getItem('onboarding_contactCity') || '',
        contactState: window.localStorage.getItem('onboarding_contactState') || '',
        contactZip: window.localStorage.getItem('onboarding_contactZip') || '',
      };

      const orgResponse = await fetch('/api/onboarding/create-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData),
      });

      const orgResult = await orgResponse.json();

      if (!orgResponse.ok || !orgResult.success) {
        throw new Error(orgResult.error || 'Failed to create organization');
      }

      const organizationId = orgResult.organization.id;

      // Now verify the code and create session with organization context
      const verifyResult = await verifyCode(email, code, organizationId);

      if (!verifyResult.success) {
        // If verification fails, we should clean up the org (or let it be orphaned for retry)
        throw new Error(verifyResult.error || 'Invalid verification code');
      }

      setVerified(true);
      setSuccess('Email verified successfully!');

      // Store organization ID for subsequent steps
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('onboarding_organizationId', organizationId);
        onboardingSession.setOrganizationId(organizationId);
        onboardingSession.setEmailVerified(true);
        onboardingSession.setCurrentStep(3);
      }

      // Navigate to form builder
      setTimeout(() => {
        router.push('/onboarding/form-builder');
      }, 500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToOrgSetup = () => {
    router.push('/onboarding/organization-setup');
  };

  const verificationForm = (
    <div className="space-y-6" data-testid="form-email-verification" data-loading={loading || sending}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          We're sending a 6-digit verification code to: <strong>{email}</strong>
        </p>
        <button
          type="button"
          onClick={handleBackToOrgSetup}
          className="text-sm text-blue-600 hover:text-blue-800 mt-1"
        >
          Change email
        </button>
      </div>

      {!codeSent && sending && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Sending verification code...</span>
        </div>
      )}

      {codeSent && (
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <div className="space-y-4">
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              data-testid="input-verification-code"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError(null);
              }}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="000000"
              maxLength={6}
              autoFocus
              aria-label="Verification code"
            />
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                data-testid="btn-resend-code"
                onClick={handleSendCode}
                disabled={countdown > 0 || sending}
                className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                aria-label="Resend verification code"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
              <span className="text-gray-500">Code expires in 15 minutes</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="error-email-verification" role="alert">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && !verified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="success-email-verification" role="status">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {codeSent && (
        <button
          type="button"
          data-testid="btn-verify-code"
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          data-loading={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Verify email with code"
        >
          {loading ? 'Verifying...' : verified ? '✓ Verified' : 'Verify & Continue'}
        </button>
      )}
    </div>
  );

  const steps = [
    {
      id: 'organization',
      title: 'Organization Setup',
      description: 'Tell us about your organization',
      component: <div />,
      isCompleted: true, // Already completed
      isOptional: false,
    },
    {
      id: 'email-verification',
      title: 'Email Verification',
      description: 'Verify your email address',
      component: verificationForm,
      isCompleted: verified,
      isOptional: false,
    },
    {
      id: 'form-builder',
      title: 'Form Builder',
      description: 'Customize your registration form',
      component: <div />,
      isCompleted: false,
      isOptional: false,
    },
    {
      id: 'qr-config',
      title: 'QR Configuration',
      description: 'Generate QR codes',
      component: <div />,
      isCompleted: false,
      isOptional: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" data-testid="page-onboarding-email">
      <div className="max-w-2xl mx-auto">
        <OnboardingWizard
          steps={steps}
          currentStep={1}
          onStepChange={(step) => {
            const paths = ['/onboarding/organization-setup', '/onboarding/email-verification', '/onboarding/form-builder', '/onboarding/qr-configuration'];
            router.push(paths[step]);
          }}
          onComplete={() => handleVerify({} as any)}
          onSkip={() => router.push('/onboarding/form-builder')}
        />
      </div>
    </div>
  );
}
