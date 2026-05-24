'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { FormBuilderWizard } from '@/components/onboarding/FormBuilderWizard';
import type { FormBuilderData } from '@/components/OnboardingWizard.interface';
import { onboardingSession } from '@/lib/services/OnboardingSessionService';
import { EventTypeService } from '@/lib/services/EventTypeService';
import { EventTypeFormApplier } from '@/lib/services/EventTypeFormApplier';
import type { EventType } from '@/lib/interfaces/IEventTypeService';
import { FormPreviewModal } from '@/components/forms/FormPreviewModal';

const ONBOARDING_EVENT_TYPE_KEY = 'onboarding_eventType';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  food_distribution: 'Food Distribution',
  seminar: 'Seminar Registration',
  volunteer: 'Volunteer Sign-up',
  custom: 'Custom Event',
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
  const eventTypeService = useMemo(() => new EventTypeService(), []);
  const formApplier = useMemo(
    () => new EventTypeFormApplier(eventTypeService),
    [eventTypeService]
  );
  const [eventType, setEventType] = useState<EventType>(() => {
    if (typeof window === 'undefined') return 'custom';
    const stored = window.localStorage.getItem(ONBOARDING_EVENT_TYPE_KEY);
    const validValues: EventType[] = ['food_distribution', 'seminar', 'volunteer', 'custom'];
    return validValues.includes(stored as EventType) ? (stored as EventType) : 'custom';
  });

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

  const handleEventTypeChange = useCallback(
    (next: EventType) => {
      const prev: EventType | null =
        typeof window !== 'undefined'
          ? ((window.localStorage.getItem(ONBOARDING_EVENT_TYPE_KEY) as EventType | null) ?? null)
          : null;
      setEventType(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ONBOARDING_EVENT_TYPE_KEY, next);
      }
      // Delegate decision to EventTypeFormApplier (ISP service):
      //   - swaps fields when current ones are pristine (Bug #1 fix)
      //   - replaces legacy "Registration Form" / previous template name
      //     with the new template default (Bug #2 fix)
      //   - preserves the user's typed-in event name + customized fields
      setFormData((current) => {
        const nextData = formApplier.applyTemplate(current, prev, next);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('onboarding_formData', JSON.stringify(nextData));
        }
        return nextData;
      });
    },
    [formApplier]
  );

  const handleEventNameChange = useCallback((name: string) => {
    setFormData((current) => {
      const nextData: FormBuilderData = { ...current, title: name };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('onboarding_formData', JSON.stringify(nextData));
      }
      return nextData;
    });
    setSaved(false);
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
          name: formData.title || 'Registration Form',
          eventType,
          description: formData.description ?? null,
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
    <div className="space-y-4">
      <div
        className="bg-white rounded-lg p-4 border border-gray-200 space-y-4"
        data-testid="event-type-selector"
      >
        <div>
          <label
            htmlFor="event-type"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Event Type
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Pick a template — we&apos;ll pre-fill the form fields below. You can always
            customize them.
          </p>
          <select
            id="event-type"
            data-testid="select-event-type"
            value={eventType}
            onChange={(e) => handleEventTypeChange(e.target.value as EventType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Event type"
          >
            {eventTypeService.listEventTypes().map((t) => (
              <option key={t} value={t} data-testid={`option-event-type-${t}`}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="event-name"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Event Name
          </label>
          <p className="text-xs text-gray-500 mb-2">
            This is the name organizers and attendees will see — it appears on
            the dashboard, in event filters, and in confirmation emails.
          </p>
          <input
            id="event-name"
            data-testid="input-event-name"
            type="text"
            value={formData.title}
            onChange={(e) => handleEventNameChange(e.target.value)}
            placeholder="e.g. Saturday Morning Food Bank — Q4"
            aria-label="Event name shown on the dashboard"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <FormBuilderWizard
        data={formData}
        onChange={handleFormChange}
        onPreview={handlePreview}
        isLoading={loading}
      />
    </div>
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
