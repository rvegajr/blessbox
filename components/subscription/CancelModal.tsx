'use client';

import React, { useState, useEffect } from 'react';
import type { CancelReason } from '@/lib/interfaces/ISubscriptionCancel';

interface CancelPreview {
  currentPlan: string;
  currentPlanName: string;
  currentLimit: number;
  currentRegistrationCount: number;
  accessUntil: string;
  daysRemaining: number;
  willExceedFreeLimit: boolean;
  registrationsOverFreeLimit: number;
  refundAmount: number;
  summary: string;
}

const CANCEL_REASON_LABELS: Record<CancelReason, string> = {
  too_expensive: 'Too expensive',
  not_using_enough: 'Not using it enough',
  found_alternative: 'Found an alternative',
  missing_features: 'Missing features I need',
  temporary_pause: 'Just need a temporary break',
  other: 'Other reason'
};

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CancelModal({ isOpen, onClose, onSuccess }: CancelModalProps) {
  const [preview, setPreview] = useState<CancelPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedReason, setSelectedReason] = useState<CancelReason | ''>('');
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPreview();
      // Reset state
      setSuccess(false);
      setSelectedReason('');
      setConfirmText('');
    }
  }, [isOpen]);

  async function loadPreview() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscription/cancel');
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to load cancellation preview');
        return;
      }
      
      setPreview(data.data);
    } catch (err) {
      setError('Failed to load cancellation preview');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (confirmText.toLowerCase() !== 'cancel') {
      setError('Please type "cancel" to confirm');
      return;
    }

    setCanceling(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: selectedReason || undefined })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Cancellation failed');
        return;
      }
      
      setSuccess(true);
      
      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 3000);
    } catch (err) {
      setError('Cancellation failed. Please try again.');
    } finally {
      setCanceling(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && !canceling && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            Cancel Subscription
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">👋</div>
              <p className="text-green-700 font-medium">Subscription cancelled</p>
              <p className="text-green-600 text-sm">
                Your access will continue until {preview && new Date(preview.accessUntil).toLocaleDateString()}.
              </p>
            </div>
          )}

          {preview && !loading && !success && (
            <>
              {/* Current Subscription Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  {preview.currentPlanName} Plan
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• {preview.currentRegistrationCount.toLocaleString()} registrations used</p>
                  <p>• {preview.daysRemaining} days remaining in current period</p>
                  <p>• Access until: {new Date(preview.accessUntil).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Data Warning */}
              {preview.willExceedFreeLimit && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important Notice</h3>
                  <p className="text-sm text-yellow-700">
                    You have {preview.currentRegistrationCount.toLocaleString()} registrations, 
                    which exceeds the Free plan limit of 100.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    After cancellation, your existing data will be preserved, 
                    but you won't be able to add new registrations until you upgrade again.
                  </p>
                </div>
              )}

              {/* What happens next */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">What happens next:</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Your access continues until {new Date(preview.accessUntil).toLocaleDateString()}
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    All your data will be preserved
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">→</span>
                    After that, you'll be on the Free plan (100 registrations)
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">→</span>
                    You can upgrade again anytime
                  </li>
                </ul>
              </div>

              {/* Reason Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you cancelling? (optional)
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value as CancelReason)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select a reason...</option>
                  {Object.entries(CANCEL_REASON_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Confirmation Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "cancel" to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type 'cancel' here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={canceling}
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancel}
                  disabled={canceling || confirmText.toLowerCase() !== 'cancel'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canceling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CancelModal;
