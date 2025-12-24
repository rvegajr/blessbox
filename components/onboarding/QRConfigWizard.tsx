'use client';

import { useState, useEffect, useRef } from 'react';
import type { QRConfigProps } from '@/components/OnboardingWizard.interface';

export function QRConfigWizard({
  data,
  onChange,
  onGenerate,
  onDownload,
  isLoading = false,
  className = '',
  'data-testid': testId = 'qr-config-wizard',
}: QRConfigProps) {
  const [entryPoints, setEntryPoints] = useState<Array<{ label: string; slug: string; description?: string }>>(
    data.qrCodes.map(qr => ({
      label: qr.label,
      slug: qr.url.split('/').pop() || qr.label.toLowerCase().replace(/\s+/g, '-'),
      description: qr.description,
    }))
  );

  // Use ref to store onChange to avoid infinite loops
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Notify parent of changes without including onChange in dependencies
  useEffect(() => {
    onChangeRef.current({
      qrCodes: entryPoints.map(ep => ({
        id: `qr_${ep.slug}`,
        label: ep.label,
        description: ep.description,
        url: `/register/${ep.slug}`,
      })),
      settings: data.settings,
    });
  }, [entryPoints, data.settings]);

  const addEntryPoint = () => {
    const newEntryPoint = {
      label: '',
      slug: '',
      description: '',
    };
    setEntryPoints([...entryPoints, newEntryPoint]);
  };

  const updateEntryPoint = (index: number, updates: Partial<typeof entryPoints[0]>) => {
    const newEntryPoints = [...entryPoints];
    newEntryPoints[index] = { ...newEntryPoints[index], ...updates };
    
    // Auto-generate slug from label if slug is empty
    if (updates.label && !updates.slug) {
      newEntryPoints[index].slug = updates.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    
    setEntryPoints(newEntryPoints);
  };

  const removeEntryPoint = (index: number) => {
    setEntryPoints(entryPoints.filter((_, i) => i !== index));
  };

  const defaultEntryPoints = [
    { label: 'Main Entrance', slug: 'main-entrance', description: 'Primary entry point' },
    { label: 'Side Door', slug: 'side-door', description: 'Secondary entry point' },
    { label: 'VIP Entrance', slug: 'vip-entrance', description: 'VIP/priority entry' },
  ];

  const addDefaultEntry = (entryPoint: typeof defaultEntryPoints[0]) => {
    if (!entryPoints.some(ep => ep.slug === entryPoint.slug)) {
      setEntryPoints([...entryPoints, entryPoint]);
    }
  };

  return (
    <div className={`qr-config-wizard ${className}`.trim()} data-testid={testId}>
      <div className="space-y-6">
        {/* Entry Points Configuration */}
        <div id="qr-form" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-tutorial-target="qr-form">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Entry Points</h3>
              <p className="text-sm text-gray-500 mt-1">
                Create QR codes for different entry points or locations
              </p>
            </div>
            <button
              type="button"
              data-testid="btn-add-entry-point"
              onClick={addEntryPoint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Add entry point"
            >
              + Add Entry Point
            </button>
          </div>

          {/* Quick Add Defaults */}
          {entryPoints.length === 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Quick start with common entry points:</p>
              <div className="flex flex-wrap gap-2">
                {defaultEntryPoints.map((ep) => (
                  <button
                    key={ep.slug}
                    type="button"
                    onClick={() => addDefaultEntry(ep)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    + {ep.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Entry Points List */}
          <div className="space-y-4">
            {entryPoints.map((entryPoint, index) => (
              <div
                key={index}
                data-testid={`row-entry-point-${index}`}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Label *
                    </label>
                    <input
                      type="text"
                      data-testid={`input-entry-label-${index}`}
                      value={entryPoint.label}
                      onChange={(e) => updateEntryPoint(index, { label: e.target.value })}
                      placeholder="e.g., Main Entrance"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-label={`Entry point label ${index + 1}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      data-testid={`input-entry-slug-${index}`}
                      value={entryPoint.slug}
                      onChange={(e) => updateEntryPoint(index, {
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                      })}
                      placeholder="main-entrance"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      aria-label={`Entry point slug ${index + 1}`}
                    />
                    </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      data-testid={`input-entry-description-${index}`}
                      value={entryPoint.description || ''}
                      onChange={(e) => updateEntryPoint(index, { description: e.target.value })}
                      placeholder="Brief description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-label={`Entry point description ${index + 1}`}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    data-testid={`btn-remove-entry-${index}`}
                    onClick={() => removeEntryPoint(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                    aria-label={`Remove entry point ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {entryPoints.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No entry points configured.</p>
              <p className="text-sm mt-1">Add at least one entry point to generate QR codes.</p>
            </div>
          )}
        </div>

        {/* QR Code Preview */}
        {data.qrCodes.length > 0 && (
          <div id="preview-section" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-tutorial-target="preview-section" data-testid="section-qr-preview">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated QR Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.qrCodes.map((qr) => {
                // Check if this QR code has a dataUrl (generated QR image)
                const hasImage = 'dataUrl' in qr && qr.dataUrl;
                const slug = qr.url?.split('/').pop() || qr.id;
                
                return (
                  <div key={qr.id} className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow" data-testid={`card-qr-${slug}`}>
                    <div className="bg-gray-50 rounded-lg p-4 mb-2 aspect-square flex items-center justify-center">
                      {hasImage ? (
                        <img 
                          src={qr.dataUrl as string} 
                          alt={`QR Code for ${qr.label}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-4xl">📱</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{qr.label}</p>
                    {qr.description && (
                      <p className="text-sm text-gray-500 mt-1">{qr.description}</p>
                    )}
                    {qr.url && (
                      <p className="text-xs text-blue-600 mt-2 break-all">{qr.url}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            id="generate-qr-btn"
            type="button"
            data-testid="btn-generate-qr"
            onClick={onGenerate}
            disabled={isLoading || entryPoints.length === 0 || entryPoints.some(ep => !ep.label || !ep.slug)}
            data-loading={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-tutorial-target="generate-qr-btn"
            aria-label="Generate QR codes"
          >
            {isLoading ? 'Generating...' : 'Generate QR Codes'}
          </button>
          {isLoading && (
            <div data-testid="loading-qr-generate" className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
          {data.qrCodes.length > 0 && (
            <button
              type="button"
              data-testid="btn-download-qr"
              onClick={onDownload}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Download QR codes"
            >
              Download All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
