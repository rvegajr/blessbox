'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { FormBuilderWizard } from '@/components/onboarding/FormBuilderWizard';
import type { FormBuilderData, FormField } from '@/components/OnboardingWizard.interface';
import { onboardingSession } from '@/lib/services/OnboardingSessionService';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Form Preview Modal Component
function FormPreviewModal({ 
  isOpen, 
  onClose, 
  formData 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  formData: FormBuilderData;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      data-testid="form-preview-modal"
      onClick={(e) => {
        // Click outside the modal closes it
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Form Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close preview"
            data-testid="form-preview-close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
            <h1 className="text-2xl font-bold">{formData.title || 'Registration Form'}</h1>
            {formData.description && (
              <p className="mt-2 text-blue-100">{formData.description}</p>
            )}
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-lg p-6 space-y-4">
            {formData.fields.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No fields added yet. Add fields from the sidebar to see them here.
              </p>
            ) : (
              formData.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label || `Untitled ${field.type} field`}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'text' && (
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}
                  {field.type === 'email' && (
                    <input
                      type="email"
                      placeholder={field.placeholder}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}
                  {field.type === 'phone' && (
                    <input
                      type="tel"
                      placeholder={field.placeholder}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}
                  {field.type === 'textarea' && (
                    <textarea
                      placeholder={field.placeholder}
                      disabled
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    >
                      <option value="">Select an option...</option>
                      {field.options?.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled
                        className="w-4 h-4 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">{field.placeholder || 'Check this box'}</span>
                    </div>
                  )}
                </div>
              ))
            )}
            {formData.fields.length > 0 && (
              <div className="pt-4 border-t">
                <button
                  disabled
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium opacity-75 cursor-not-allowed"
                >
                  Submit Registration
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-sm text-gray-500 text-center">
            This is a preview of how your form will appear to users.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FormBuilderPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [formData, setFormData] = useState<FormBuilderData>(() => {
    if (typeof window === 'undefined') {
      return {
        fields: [],
        title: 'Registration Form',
        description: '',
      };
    }

    const savedFormData = window.localStorage.getItem('onboarding_formData');
    if (!savedFormData) {
      return {
        fields: [],
        title: 'Registration Form',
        description: '',
      };
    }

    try {
      const parsed = JSON.parse(savedFormData) as FormBuilderData;
      return {
        fields: Array.isArray(parsed.fields) ? parsed.fields : [],
        title: typeof parsed.title === 'string' ? parsed.title : 'Registration Form',
        description: typeof parsed.description === 'string' ? parsed.description : '',
      };
    } catch {
      return {
        fields: [],
        title: 'Registration Form',
        description: '',
      };
    }
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Require auth for onboarding steps
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?next=/onboarding/form-builder');
    }
  }, [router, status]);

  // Ensure org onboarding session exists; redirect otherwise
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const orgId = window.localStorage.getItem('onboarding_organizationId');
    if (!orgId) {
      router.push('/onboarding/organization-setup');
      return;
    }
    setOrganizationId(orgId);
  }, [router]);

  // Save form data to localStorage whenever it changes
  const handleFormChange = useCallback((newData: FormBuilderData) => {
    setFormData(newData);
    setSaved(false);
    // Persist to localStorage to prevent data loss across sessions
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('onboarding_formData', JSON.stringify(newData));
    }
  }, []);

  const handleSave = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/save-form-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          // Backend expects an explicit `order` field; derive it from current UI ordering.
          formFields: (formData.fields || []).map((f, idx) => ({
            ...f,
            order: idx,
          })),
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
        onboardingSession.setFormSaved(true);
        onboardingSession.setCurrentStep(4); // Move to step 4
      }

      // Navigate immediately after saving
      router.push('/onboarding/qr-configuration');
    } catch (error) {
      console.error('Save form config error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const formBuilder = (
    <FormBuilderWizard
      data={formData}
      onChange={handleFormChange}
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
      isCompleted: typeof window !== 'undefined' ? !!window.localStorage.getItem('onboarding_organizationId') : false,
      isOptional: false,
    },
    {
      id: 'email-verification',
      title: 'Email Verification',
      description: 'Verify your email address',
      component: <div />,
      isCompleted: typeof window !== 'undefined' ? window.localStorage.getItem('onboarding_emailVerified') === 'true' : false,
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
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4" data-testid="page-onboarding-form-builder">
        <div className="max-w-7xl mx-auto">
          <OnboardingWizard
            steps={steps}
            currentStep={2}
            onStepChange={(step) => {
              const paths = ['/onboarding/organization-setup', '/onboarding/email-verification', '/onboarding/form-builder', '/onboarding/qr-configuration'];
              // When the user clicks Next to proceed to QR configuration, persist the form config first.
              if (step === 3) {
                void handleSave();
                return;
              }
              router.push(paths[step]);
            }}
            onComplete={handleSave}
            onSkip={() => {
              // Skip should still persist so the registration form works.
              void handleSave();
            }}
          />
        </div>
      </div>
      <FormPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        formData={formData}
      />
    </>
  );
}
