'use client';

import React, { useState, useEffect } from 'react';
import type { PlanType } from '@/lib/subscriptions';

interface UpgradePreview {
  currentPlan: PlanType;
  currentPlanName: string;
  currentLimit: number;
  targetPlan: PlanType;
  targetPlanName: string;
  targetLimit: number;
  currentMonthlyPrice: number;
  newMonthlyPrice: number;
  priceDifference: number;
  amountDueNow: number;
  effectiveImmediately: boolean;
  summary: string;
}

interface UpgradeModalProps {
  targetPlan: PlanType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpgradeModal({ targetPlan, isOpen, onClose, onSuccess }: UpgradeModalProps) {
  const [preview, setPreview] = useState<UpgradePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && targetPlan) {
      loadPreview();
    }
  }, [isOpen, targetPlan]);

  async function loadPreview() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/subscription/upgrade?plan=${targetPlan}`);
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to load upgrade preview');
        return;
      }
      
      setPreview(data.data);
    } catch (err) {
      setError('Failed to load upgrade preview');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    // Redirect to checkout page with the selected plan
    // Payment must be collected before upgrading the subscription
    const checkoutUrl = `/checkout?plan=${targetPlan}`;
    window.location.href = checkoutUrl;
  }

  if (!isOpen) return null;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            Upgrade Your Plan
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading preview...</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-green-700 font-medium">Upgrade successful!</p>
              <p className="text-green-600 text-sm">Your new limits are now active.</p>
            </div>
          )}

          {preview && !loading && !success && (
            <>
              {/* Plan Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                  <p className="text-lg font-semibold text-gray-900">{preview.currentPlanName}</p>
                  <p className="text-sm text-gray-600">{preview.currentLimit.toLocaleString()} registrations</p>
                  <p className="text-sm text-gray-500">{formatPrice(preview.currentMonthlyPrice)}/mo</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center border-2 border-blue-300">
                  <p className="text-sm text-blue-600 mb-1">New Plan</p>
                  <p className="text-lg font-semibold text-blue-900">{preview.targetPlanName}</p>
                  <p className="text-sm text-blue-700">{preview.targetLimit.toLocaleString()} registrations</p>
                  <p className="text-sm text-blue-600">{formatPrice(preview.newMonthlyPrice)}/mo</p>
                </div>
              </div>

              {/* Upgrade Benefits */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-800 mb-2">What you get:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ {(preview.targetLimit - preview.currentLimit).toLocaleString()} more registrations</li>
                  <li>✓ Upgrade takes effect immediately</li>
                  <li>✓ Keep all your existing data</li>
                </ul>
              </div>

              {/* Pricing Summary */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Monthly price</span>
                  <span className="font-medium">{formatPrice(preview.newMonthlyPrice)}/mo</span>
                </div>
                {preview.priceDifference > 0 && preview.currentMonthlyPrice > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Price increase</span>
                    <span>+{formatPrice(preview.priceDifference)}/mo</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  data-testid="btn-proceed-to-checkout"
                >
                  Proceed to Checkout →
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                You'll be taken to the checkout page to complete payment.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
