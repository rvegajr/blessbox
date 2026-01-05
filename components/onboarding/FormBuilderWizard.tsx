'use client';

import { useState, useEffect, useRef } from 'react';
import type { FormBuilderProps, FormField } from '@/components/OnboardingWizard.interface';

export function FormBuilderWizard({
  data,
  onChange,
  onPreview,
  isLoading = false,
  className = '',
  'data-testid': testId = 'form-builder-wizard',
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(data.fields || []);
  const [title, setTitle] = useState(data.title || 'Registration Form');
  const [description, setDescription] = useState(data.description || '');
  
  // Use ref to store onChange to avoid infinite loops
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Notify parent of changes without including onChange in dependencies
  useEffect(() => {
    onChangeRef.current({
      fields,
      title,
      description,
    });
  }, [fields, title, description]);

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: '',
      required: false,
      placeholder: getDefaultPlaceholder(type),
    };

    if (type === 'select') {
      newField.options = []; // Start empty - admin enters their own options
    }

    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === id);
    if (index === -1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const getDefaultPlaceholder = (type: FormField['type']): string => {
    switch (type) {
      case 'text': return 'Enter text';
      case 'email': return 'your@email.com';
      case 'phone': return '(555) 123-4567';
      case 'textarea': return 'Enter details';
      default: return '';
    }
  };

  const fieldTypes: Array<{ type: FormField['type']; label: string; icon: string; description: string }> = [
    { type: 'text', label: 'Short Text', icon: '📝', description: 'Single line input (name, address, etc.)' },
    { type: 'email', label: 'Email', icon: '✉️', description: 'Email address field with validation' },
    { type: 'phone', label: 'Phone', icon: '📞', description: 'Phone number field' },
    { type: 'select', label: 'Dropdown', icon: '📋', description: 'Select from a list of options' },
    { type: 'textarea', label: 'Long Text', icon: '📄', description: 'Multi-line text (comments, notes, etc.)' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️', description: 'Yes/No toggle or agreement' },
  ];

  return (
    <div className={`form-builder ${className}`.trim()} data-testid={testId}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Form Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Registration Form"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the form"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add Field</h4>
              <div className="grid grid-cols-1 gap-2">
                {fieldTypes.map(({ type, label, icon, description }) => (
                  <button
                    key={type}
                    type="button"
                    data-testid={`btn-add-field-${type}`}
                    onClick={() => addField(type)}
                    className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    title={description}
                    aria-label={`Add ${label} field`}
                  >
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-700 block">{label}</span>
                      <span className="text-xs text-gray-500 block truncate">{description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Builder */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Fields</h3>
            
            {fields.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">No fields yet. Add fields from the sidebar.</p>
                <p className="text-sm">Click on a field type to add it to your form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="Field label"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                        />
                      </div>
                      <div className="flex gap-2 ml-3">
                        <button
                          type="button"
                          onClick={() => moveField(field.id, 'up')}
                          disabled={index === 0}
                          className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(field.id, 'down')}
                          disabled={index === fields.length - 1}
                          className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          className="px-2 py-1 text-red-500 hover:text-red-700"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          placeholder="Placeholder text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {field.type === 'select' && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Options (one per line, add as many as needed)
                          </label>
                          <textarea
                            data-testid={`input-select-options-${field.id}`}
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => {
                              const lines = e.target.value.split('\n');
                              // Preserve empty lines but filter out trailing empty lines
                              const trimmedLines = lines.map(o => o.trim());
                              // Keep all non-empty lines, but allow empty lines in the middle
                              const options = trimmedLines.filter((o, i) => {
                                // Keep if not empty, or if it's not the last empty line
                                return o !== '' || (i < trimmedLines.length - 1 && trimmedLines.slice(i + 1).some(l => l !== ''));
                              });
                              updateField(field.id, { options });
                            }}
                            rows={10}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-y"
                            placeholder="Newborn\nSize 1\nSize 2\nSize 3\nSize 4\nSize 5\n... (add as many as you need)"
                            aria-label={`Options for ${field.label || 'select field'}`}
                            style={{ minHeight: '120px' }}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            💡 Tip: Add unlimited options, one per line. Empty lines will be removed. You can resize this box by dragging the corner.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`required-${field.id}`}
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="mr-2"
                        />
                        <label htmlFor={`required-${field.id}`} className="text-sm text-gray-700">
                          Required field
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onPreview}
              data-testid="btn-preview-form"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Preview form"
            >
              Preview Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
