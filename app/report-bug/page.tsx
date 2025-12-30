'use client';

import { useState, useRef } from 'react';

/**
 * Simple bug report form for non-technical users.
 * Creates GitHub Issues via API with image support.
 */
export default function ReportBugPage() {
  const [description, setDescription] = useState('');
  const [expected, setExpected] = useState('');
  const [steps, setSteps] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [browser, setBrowser] = useState('');
  const [device, setDevice] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [issueUrl, setIssueUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (files: File[]) => {
    const newImages = [...images, ...files].slice(0, 5); // Max 5 images
    setImages(newImages);

    // Create previews
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setPreviews(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return newPreviews;
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles = items
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (imageFiles.length > 0) {
      e.preventDefault();
      addImages(imageFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Convert images to base64
      const imageData = await Promise.all(
        images.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return {
            name: file.name,
            type: file.type,
            data: base64,
          };
        })
      );

      const response = await fetch('/api/report-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          expected,
          steps,
          pageUrl: pageUrl || window.location.href,
          browser,
          device,
          images: imageData,
          userAgent: navigator.userAgent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit bug report');
      }

      setSubmitted(true);
      setIssueUrl(result.issueUrl || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4" data-testid="page-bug-submitted">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your bug report has been submitted. Our team will look into it soon.
          </p>
          {issueUrl && (
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline block mb-4"
              data-testid="link-issue"
            >
              View your report on GitHub
            </a>
          )}
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            data-testid="link-home"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" data-testid="page-report-bug">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Report a Problem</h1>
          <p className="text-gray-600 mb-6">
            Found something that isn&apos;t working? Let us know and we&apos;ll fix it.
            You can paste screenshots directly into any text box.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" data-testid="error-submit">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="form-bug-report" onPaste={handlePaste}>
            {/* What happened */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                What happened? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                data-testid="input-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what went wrong..."
              />
            </div>

            {/* Expected behavior */}
            <div className="mb-6">
              <label htmlFor="expected" className="block text-sm font-medium text-gray-700 mb-1">
                What did you expect to happen? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="expected"
                data-testid="input-expected"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What should have happened instead..."
              />
            </div>

            {/* Steps to reproduce */}
            <div className="mb-6">
              <label htmlFor="steps" className="block text-sm font-medium text-gray-700 mb-1">
                Steps to reproduce <span className="text-red-500">*</span>
              </label>
              <textarea
                id="steps"
                data-testid="input-steps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See the problem"
              />
            </div>

            {/* Page URL */}
            <div className="mb-6">
              <label htmlFor="pageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Page URL (where did this happen?)
              </label>
              <input
                type="url"
                id="pageUrl"
                data-testid="input-url"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.blessbox.org/..."
              />
            </div>

            {/* Browser and Device */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="browser" className="block text-sm font-medium text-gray-700 mb-1">
                  Browser <span className="text-red-500">*</span>
                </label>
                <select
                  id="browser"
                  data-testid="dropdown-browser"
                  value={browser}
                  onChange={(e) => setBrowser(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Chrome">Chrome</option>
                  <option value="Safari">Safari</option>
                  <option value="Firefox">Firefox</option>
                  <option value="Edge">Edge</option>
                  <option value="Mobile Safari">Mobile Safari (iPhone)</option>
                  <option value="Mobile Chrome">Mobile Chrome (Android)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-1">
                  Device <span className="text-red-500">*</span>
                </label>
                <select
                  id="device"
                  data-testid="dropdown-device"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Desktop">Desktop/Laptop</option>
                  <option value="iPhone">iPhone</option>
                  <option value="Android">Android Phone</option>
                  <option value="Tablet">iPad/Tablet</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Screenshots */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Screenshots (optional)
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Paste images with Ctrl+V / Cmd+V, or click to upload (max 5)
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                data-testid="dropzone-images"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  data-testid="input-images"
                />
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600">Click to upload or paste from clipboard</p>
              </div>

              {/* Image previews */}
              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Screenshot ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        data-testid={`btn-remove-image-${index}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              data-testid="btn-submit"
              data-loading={submitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Bug Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
