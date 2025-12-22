'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { clearOnboardingSession } from '@/lib/services/OnboardingSessionService';

interface OrganizationFormData {
  name: string;
  eventName: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactCity: string;
  contactState: string;
  contactZip: string;
}

export default function OrganizationSetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    eventName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    contactCity: '',
    contactState: '',
    contactZip: '',
  });

  // Clear previous onboarding session when starting fresh
  useEffect(() => {
    clearOnboardingSession();
  }, []);
  const [errors, setErrors] = useState<Partial<Record<keyof OrganizationFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof OrganizationFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/save-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save organization');
      }

      setOrganizationId(data.organization.id);
      
      // Store organization ID in sessionStorage for next steps
      if (typeof window !== "undefined") sessionStorage.setItem('onboarding_organizationId', data.organization.id);
      if (typeof window !== "undefined") sessionStorage.setItem('onboarding_contactEmail', formData.contactEmail);
      if (typeof window !== "undefined") sessionStorage.setItem('onboarding_step', '2'); // Move to step 2

      // Navigate to email verification
      router.push('/onboarding/email-verification');
    } catch (error) {
      setErrors({ contactEmail: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof OrganizationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const organizationForm = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Organization Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Hope Community Food Bank"
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
          Event Name (Optional)
        </label>
        <input
          id="eventName"
          type="text"
          value={formData.eventName}
          onChange={(e) => handleInputChange('eventName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Weekly Food Distribution"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Contact Email <span className="text-red-500">*</span>
        </label>
        <input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.contactEmail ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="contact@example.com"
          required
        />
        {errors.contactEmail && <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>}
        <p className="mt-1 text-xs text-gray-500">We'll send a verification code to this email</p>
      </div>

      <div>
        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
          Contact Phone (Optional)
        </label>
        <input
          id="contactPhone"
          type="tel"
          value={formData.contactPhone}
          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Address (Optional)</h3>
        
        <div className="mb-4">
          <label htmlFor="contactAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Street Address
          </label>
          <input
            id="contactAddress"
            type="text"
            value={formData.contactAddress}
            onChange={(e) => handleInputChange('contactAddress', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactCity" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              id="contactCity"
              type="text"
              value={formData.contactCity}
              onChange={(e) => handleInputChange('contactCity', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="City"
            />
          </div>

          <div>
            <label htmlFor="contactState" className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              id="contactState"
              type="text"
              value={formData.contactState}
              onChange={(e) => handleInputChange('contactState', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ST"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="contactZip" className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code
          </label>
          <input
            id="contactZip"
            type="text"
            value={formData.contactZip}
            onChange={(e) => handleInputChange('contactZip', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="12345"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </form>
  );

  const steps = [
    {
      id: 'organization',
      title: 'Organization Setup',
      description: 'Tell us about your organization',
      component: organizationForm,
      isCompleted: !!organizationId,
      isOptional: false,
    },
    {
      id: 'email-verification',
      title: 'Email Verification',
      description: 'Verify your email address',
      component: <div />,
      isCompleted: false,
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
      <div className="max-w-3xl mx-auto">
        <OnboardingWizard
          steps={steps}
          currentStep={0}
          onStepChange={(step) => {
            if (step === 0) return; // Can't go to other steps from here yet
            router.push(['/onboarding/organization-setup', '/onboarding/email-verification', '/onboarding/form-builder', '/onboarding/qr-configuration'][step]);
          }}
          onComplete={() => handleSubmit({} as any)}
          onSkip={() => {}}
        />
      </div>
    </div>
  );
}
