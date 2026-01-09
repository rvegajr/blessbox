'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type FieldType = 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';

type FormField = {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
};

type FormConfig = {
  id: string;
  organizationId: string;
  name: string;
  language: string;
  formFields: FormField[];
  qrCodes?: any[];
};

function RegistrationForm({ orgSlug, qrLabel, sketId }: { orgSlug: string; qrLabel: string; sketId?: string }) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch(`/api/registrations/form-config?orgSlug=${encodeURIComponent(orgSlug)}&qrLabel=${encodeURIComponent(qrLabel)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Form configuration not found');
        }
        if (cancelled) return;
        setConfig(data.config);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : 'Failed to load form');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgSlug, qrLabel]);

  const setValue = (id: string, value: any) => {
    setFormState((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!config) return;
    setSubmitError(null);

    // basic required validation (API will also validate)
    for (const f of config.formFields || []) {
      const v = formState[f.id];
      const missing =
        v === undefined ||
        v === null ||
        v === false ||
        (typeof v === 'string' && v.trim() === '');
      if (f.required && missing) {
        setSubmitError(`Missing required field: ${f.label}`);
        return;
      }
    }

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug,
          qrLabel,
          formData: formState,
          metadata: {
            sketId,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit registration');
      }
      
      // Redirect to success page with QR code display
      if (data.registration?.id) {
        window.location.href = `/registration-success?id=${data.registration.id}`;
      } else {
        setSubmitted(true);
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" data-testid="page-public-registration">
        <div className="text-center" data-testid="loading-public-registration" data-loading="true">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4" data-testid="page-public-registration">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration submitted!</h1>
            <p className="text-gray-600 mb-6">Thank you for registering. You may close this page.</p>
            <button
              onClick={() => window.close()}
              className="inline-block bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              data-testid="btn-close-registration"
            >
              Close Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4" data-testid="page-public-registration">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Form unavailable</h1>
            <p className="text-gray-600 mb-6" data-testid="error-public-registration" role="alert">
              {loadError || 'This registration link is not configured yet.'}
            </p>
            <a href="/" className="inline-block bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold">
              Return Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4" data-testid="page-public-registration">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.name || 'Registration Form'}</h1>
          <p className="text-sm text-gray-500 mb-6">Organization: {orgSlug} • Entry: {qrLabel}</p>
          <div className="space-y-4 text-left">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg" role="alert">
                {submitError}
              </div>
            )}

            <form
              className="space-y-4"
              data-testid="form-public-registration"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              {(config.formFields || []).map((field) => (
                <div key={field.id} data-testid={`field-${field.id}`}>
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.id}
                      data-testid={`input-${field.id}`}
                      value={formState[field.id] ?? ''}
                      onChange={(e) => setValue(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      aria-label={field.label}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.id}
                      data-testid={`dropdown-${field.id}`}
                      value={formState[field.id] ?? ''}
                      onChange={(e) => setValue(field.id, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      aria-label={field.label}
                    >
                      <option value="">Select...</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2">
                      <input
                        id={field.id}
                        type="checkbox"
                        data-testid={`input-${field.id}`}
                        checked={!!formState[field.id]}
                        onChange={(e) => setValue(field.id, e.target.checked)}
                        className="w-4 h-4 border-gray-300 rounded"
                        aria-label={field.label}
                      />
                      <span className="text-sm text-gray-600">{field.placeholder || 'Yes'}</span>
                    </label>
                  ) : (
                    <input
                      id={field.id}
                      type={field.type === 'phone' ? 'tel' : field.type}
                      data-testid={`input-${field.id}`}
                      value={formState[field.id] ?? ''}
                      onChange={(e) => setValue(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      aria-label={field.label}
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                data-testid="btn-submit-registration"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                aria-label="Submit registration"
              >
                Submit Registration
              </button>
            </form>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Already registered?{' '}
                <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                  Go Home
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationPageContent({ params }: { params: Promise<{ orgSlug: string; qrLabel: string }> }) {
  const searchParams = useSearchParams();
  const sketId = searchParams.get('sketId') || undefined;
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string; qrLabel: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  if (!resolvedParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <RegistrationForm 
      orgSlug={resolvedParams.orgSlug} 
      qrLabel={resolvedParams.qrLabel} 
      sketId={sketId}
    />
  );
}

export default function RegistrationPage({ params }: { params: Promise<{ orgSlug: string; qrLabel: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading registration form...</p>
        </div>
      </div>
    }>
      <RegistrationPageContent params={params} />
    </Suspense>
  );
}
