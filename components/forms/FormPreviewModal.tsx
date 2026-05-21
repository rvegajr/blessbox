/**
 * Phase C: Shared Form Preview Modal Component
 * Extracted from onboarding/form-builder for reuse across pages
 */

'use client';

import type { FormBuilderData } from '@/components/OnboardingWizard.interface';

export function FormPreviewModal({ 
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
