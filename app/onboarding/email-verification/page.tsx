'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function EmailVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Get email from sessionStorage (only on client)
    if (typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('onboarding_contactEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        // Auto-send verification code (use storedEmail directly to avoid state timing issues)
        void handleSendCode(storedEmail);
      }
    }
  }, []);

  const handleSendCode = async (emailOverride?: string) => {
    const targetEmail = (emailOverride ?? email).trim();
    if (!targetEmail) {
      setError('Please enter your email address');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/onboarding/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setCodeSent(true);
      setSuccess('Verification code sent! Please check your email.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send code');
    } finally {
      setSending(false);
    }
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
      const orgId =
        typeof window !== 'undefined' ? sessionStorage.getItem('onboarding_organizationId') : null;

      const response = await fetch('/api/onboarding/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, organizationId: orgId }),
      });

      const data = await response.json();

      if (!response.ok || !data.verified) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setVerified(true);
      setSuccess('Email verified successfully!');
      
      // Mark email verification as complete
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('onboarding_emailVerified', 'true');
        if (data.userId) sessionStorage.setItem('onboarding_userId', String(data.userId));
        sessionStorage.setItem('onboarding_step', '3'); // Move to step 3
      }
      
      // Navigate to form builder after a short delay
      setTimeout(() => {
        router.push('/onboarding/form-builder');
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const verificationForm = (
    <div className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="flex gap-2">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
            disabled={codeSent}
          />
          {!codeSent && (
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Code'}
            </button>
          )}
        </div>
      </div>

      {codeSent && (
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <div className="space-y-4">
            <input
              id="code"
              type="text"
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
            />
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sending}
                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                Resend Code
              </button>
              <span className="text-gray-500">Code expires in 15 minutes</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {codeSent && (
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : verified ? '✓ Verified' : 'Verify Email'}
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
      isCompleted: typeof window !== 'undefined' ? !!sessionStorage.getItem('onboarding_organizationId') : false,
      isOptional: false,
    },
    {
      id: 'email-verification',
      title: 'Email Verification',
      description: 'We sent a verification code to your email',
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
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
