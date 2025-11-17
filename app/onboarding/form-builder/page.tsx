'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { FormBuilderWizard } from '@/components/onboarding/FormBuilderWizard';
import type { FormBuilderData, FormField } from '@/components/OnboardingWizard.interface';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function FormBuilderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormBuilderData>({
    fields: [],
    title: 'Registration Form',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const handleSave = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/save-form-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          formFields: formData.fields,
          language: 'en',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save form configuration');
      }

      setSaved(true);
      
      // Mark form builder as complete
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('onboarding_formSaved', 'true');
        sessionStorage.setItem('onboarding_step', '4'); // Move to step 4
      }
      
      // Auto-navigate after saving
      setTimeout(() => {
        router.push('/onboarding/qr-configuration');
      }, 1000);
    } catch (error) {
      console.error('Save form config error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    // Show preview modal or navigate to preview page
    console.log('Form preview:', formData);
    alert('Preview feature coming soon!');
  };

  const formBuilder = (
    <FormBuilderWizard
      data={formData}
      onChange={(newData) => {
        setFormData(newData);
        setSaved(false);
      }}
      onPreview={handlePreview}
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
      title: 'Build Your Registration Form',
      description: 'Add fields to collect the information you need',
      component: formBuilder,
      isCompleted: saved,
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
      <div className="max-w-7xl mx-auto">
        <OnboardingWizard
          steps={steps}
          currentStep={2}
          onStepChange={(step) => {
            const paths = ['/onboarding/organization-setup', '/onboarding/email-verification', '/onboarding/form-builder', '/onboarding/qr-configuration'];
            router.push(paths[step]);
          }}
          onComplete={handleSave}
          onSkip={() => router.push('/onboarding/qr-configuration')}
        />
      </div>
    </div>
  );
}
