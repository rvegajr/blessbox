'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireActiveOrganization } from '@/components/organization/useRequireActiveOrganization';
import { FormBuilderWizard } from '@/components/onboarding/FormBuilderWizard';
import type { FormBuilderData, FormField } from '@/components/OnboardingWizard.interface';

export const dynamic = 'force-dynamic';

const DEFAULT_FORM_DATA: FormBuilderData = {
  fields: [],
  title: 'Registration Form',
  description: '',
};

export default function DashboardFormBuilderPage() {
  const { ready, activeOrganizationId } = useRequireActiveOrganization();

  const [formData, setFormData] = useState<FormBuilderData>(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load existing form config
  useEffect(() => {
    if (!ready) return;
    async function loadConfig() {
      try {
        const res = await fetch('/api/onboarding/save-form-config');
        const data = await res.json();
        if (data.success && data.formConfig && Array.isArray(data.formConfig.formFields)) {
          setFormData({
            fields: data.formConfig.formFields as FormField[],
            title: data.formConfig.name || 'Registration Form',
            description: '',
          });
        }
      } catch {
        // Leave default empty form
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [ready]);

  const handleFormChange = useCallback((newData: FormBuilderData) => {
    setFormData(newData);
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!activeOrganizationId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding/save-form-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: activeOrganizationId,
          formFields: (formData.fields || []).map((f, idx) => ({ ...f, order: idx })),
          language: 'en',
          name: formData.title || 'Registration Form',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="page-dashboard-form-builder">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registration Form Builder</h1>
          <p className="text-gray-500 mt-1">
            Edit the fields that attendees fill in when registering via your QR code.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6" role="alert">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6">
          Form configuration saved. Changes will apply to new registrations immediately.
        </div>
      )}

      <FormBuilderWizard
        data={formData}
        onChange={handleFormChange}
        onPreview={() => setShowPreview(true)}
        isLoading={saving}
      />
    </div>
  );
}
