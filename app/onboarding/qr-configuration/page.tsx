'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { QRConfigWizard } from '@/components/onboarding/QRConfigWizard';
import type { QRConfigData } from '@/components/OnboardingWizard.interface';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function QRConfigurationPage() {
  const router = useRouter();
  const [configData, setConfigData] = useState<QRConfigData>({
    qrCodes: [],
    settings: {
      size: 256,
      format: 'png',
      includeLogo: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [qrCodesGenerated, setQrCodesGenerated] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const orgId = sessionStorage.getItem('onboarding_organizationId');
    if (!orgId) {
      router.push('/onboarding/organization-setup');
      return;
    }
    setOrganizationId(orgId);
  }, [router]);

  const handleGenerate = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const entryPoints = configData.qrCodes.map(qr => ({
        label: qr.label,
        slug: qr.url.split('/').pop() || qr.label.toLowerCase().replace(/\s+/g, '-'),
      }));

      if (entryPoints.length === 0) {
        alert('Please add at least one entry point');
        return;
      }

      const response = await fetch('/api/onboarding/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          entryPoints,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate QR codes');
      }

      // Update config with generated QR codes (preserving existing config structure)
      const existingQrCodes = configData.qrCodes;
      const updatedQrCodes = data.qrCodes.map((qc: any) => {
        // Find existing QR code to preserve description
        const existing = existingQrCodes.find(eq => eq.label === qc.label);
        return {
          id: qc.id,
          label: qc.label,
          description: existing?.description || '',
          url: qc.url,
          dataUrl: qc.dataUrl, // Store for display
        };
      });

      setConfigData({
        ...configData,
        qrCodes: updatedQrCodes,
      });

      setQrCodesGenerated(true);
      
      // Mark QR configuration as complete
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('onboarding_qrGenerated', 'true');
      }
    } catch (error) {
      console.error('Generate QR error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Implement download functionality
    console.log('Download QR codes:', configData.qrCodes);
    alert('Download feature coming soon!');
  };

  const handleComplete = async () => {
    if (!qrCodesGenerated) {
      alert('Please generate QR codes first');
      return;
    }

    // Clear onboarding session data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('onboarding_step');
    }
    
    // Navigate to dashboard
    router.push('/dashboard');
  };

  const qrConfig = (
    <QRConfigWizard
      data={configData}
      onChange={setConfigData}
      onGenerate={handleGenerate}
      onDownload={handleDownload}
      isLoading={loading}
    />
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
      description: 'Verify your email address',
      component: <div />,
      isCompleted: typeof window !== 'undefined' ? sessionStorage.getItem('onboarding_emailVerified') === 'true' : false,
      isOptional: false,
    },
    {
      id: 'form-builder',
      title: 'Form Builder',
      description: 'Customize your registration form',
      component: <div />,
      isCompleted: typeof window !== 'undefined' ? sessionStorage.getItem('onboarding_formSaved') === 'true' : false,
      isOptional: false,
    },
    {
      id: 'qr-config',
      title: 'Generate QR Codes',
      description: 'Create QR codes for your entry points',
      component: qrConfig,
      isCompleted: qrCodesGenerated,
      isOptional: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <OnboardingWizard
          steps={steps}
          currentStep={3}
          onStepChange={(step) => {
            const paths = ['/onboarding/organization-setup', '/onboarding/email-verification', '/onboarding/form-builder', '/onboarding/qr-configuration'];
            router.push(paths[step]);
          }}
          onComplete={handleComplete}
          onSkip={() => router.push('/dashboard')}
        />
      </div>
    </div>
  );
}
