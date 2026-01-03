/**
 * Organization Setup Page
 * 
 * First step of onboarding. Users can fill out organization details
 * WITHOUT being authenticated. Email verification happens in the next step.
 */

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { onboardingSession } from '@/lib/services/OnboardingSessionService';

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
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
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
  const [errors, setErrors] = useState<Partial<Record<keyof OrganizationFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Load any saved form data from localStorage (resume support)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedName = window.localStorage.getItem('onboarding_orgName');
    const savedEmail = window.localStorage.getItem('onboarding_contactEmail');
    const savedOrgId = window.localStorage.getItem('onboarding_organizationId');
    
    if (savedOrgId) {
      setOrganizationId(savedOrgId);
    }
    
    if (savedName || savedEmail) {
      setFormData(prev => ({
        ...prev,
        name: savedName || prev.name,
        contactEmail: savedEmail || prev.contactEmail,
      }));
    }
  }, []);

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
      // Save form data to localStorage for email verification step
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('onboarding_orgName', formData.name);
        window.localStorage.setItem('onboarding_contactEmail', formData.contactEmail);
        window.localStorage.setItem('onboarding_eventName', formData.eventName || '');
        window.localStorage.setItem('onboarding_contactPhone', formData.contactPhone || '');
        window.localStorage.setItem('onboarding_contactAddress', formData.contactAddress || '');
        window.localStorage.setItem('onboarding_contactCity', formData.contactCity || '');
        window.localStorage.setItem('onboarding_contactState', formData.contactState || '');
        window.localStorage.setItem('onboarding_contactZip', formData.contactZip || '');
        onboardingSession.setCurrentStep(2); // Move to email verification
      }

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
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-org-setup" data-loading={loading}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Organization Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          data-testid="input-org-name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Hope Community Food Bank"
          required
          autoComplete="organization"
          aria-describedby={errors.name ? "org-name-error" : undefined}
          aria-label="Organization name"
        />
        {errors.name && (
          <p id="org-name-error" className="mt-1 text-sm text-red-600" data-testid="error-org-name" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
          Event Name (Optional)
        </label>
        <input
          id="eventName"
          name="eventName"
          type="text"
          data-testid="input-event-name"
          value={formData.eventName}
          onChange={(e) => handleInputChange('eventName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Weekly Food Distribution"
          autoComplete="off"
          aria-label="Event name"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Contact Email <span className="text-red-500">*</span>
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          data-testid="input-contact-email"
          value={formData.contactEmail}
          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.contactEmail ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="contact@example.com"
          required
          autoComplete="email"
          aria-describedby={errors.contactEmail ? "contact-email-error" : undefined}
          aria-label="Contact email"
        />
        {errors.contactEmail && (
          <p id="contact-email-error" className="mt-1 text-sm text-red-600" data-testid="error-contact-email" role="alert">
            {errors.contactEmail}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">We'll send a verification code to this email.</p>
      </div>

      <div>
        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
          Contact Phone (Optional)
        </label>
        <input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          data-testid="input-contact-phone"
          value={formData.contactPhone}
          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="(555) 123-4567"
          autoComplete="tel"
          aria-label="Contact phone"
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
            name="contactAddress"
            type="text"
            data-testid="input-contact-address"
            value={formData.contactAddress}
            onChange={(e) => handleInputChange('contactAddress', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Main Street"
            autoComplete="street-address"
            aria-label="Street address"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactCity" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              id="contactCity"
              name="contactCity"
              type="text"
              data-testid="input-contact-city"
              value={formData.contactCity}
              onChange={(e) => handleInputChange('contactCity', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="City"
              autoComplete="address-level2"
              aria-label="City"
            />
          </div>

          <div>
            <label htmlFor="contactState" className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              id="contactState"
              name="contactState"
              type="text"
              data-testid="input-contact-state"
              value={formData.contactState}
              onChange={(e) => handleInputChange('contactState', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ST"
              autoComplete="address-level1"
              aria-label="State"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="contactZip" className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code
          </label>
          <input
            id="contactZip"
            name="contactZip"
            type="text"
            data-testid="input-contact-zip"
            value={formData.contactZip}
            onChange={(e) => handleInputChange('contactZip', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="12345"
            autoComplete="postal-code"
            aria-label="ZIP code"
          />
        </div>
      </div>

      <button
        type="submit"
        data-testid="btn-continue-org-setup"
        disabled={loading}
        data-loading={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Continue to email verification"
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
    <div className="min-h-screen bg-gray-50 py-12 px-4" data-testid="page-onboarding-org-setup">
      <div className="max-w-3xl mx-auto">
        <OnboardingWizard
          steps={steps}
          currentStep={0}
          onStepChange={(step) => {
            // Prevent navigation from wizard - form must be submitted first
            if (step > 0 && !organizationId) {
              // Trigger form submission by clicking the Continue button
              const continueBtn = document.querySelector('[data-testid="btn-continue-org-setup"]') as HTMLButtonElement;
              if (continueBtn) continueBtn.click();
              return;
            }
            // Allow navigation to email verification only after org is created
            if (step === 0) return;
            router.push(['/onboarding/organization-setup', '/onboarding/email-verification', '/onboarding/form-builder', '/onboarding/qr-configuration'][step]);
          }}
          onComplete={() => handleSubmit({} as any)}
          onSkip={() => {}}
        />
      </div>
    </div>
  );
}
