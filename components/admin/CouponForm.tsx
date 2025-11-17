'use client';

import { useState, useEffect } from 'react';

export interface CouponFormData {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  maxRedemptions?: number;
  expiresAt?: string;
  isActive: boolean;
  applicablePlans?: string[] | null;
}

interface CouponFormProps {
  coupon?: CouponFormData & { id: string };
  onSuccess: () => void;
  onCancel: () => void;
  className?: string;
}

export function CouponForm({ coupon, onSuccess, onCancel, className = '' }: CouponFormProps) {
  const [formData, setFormData] = useState<CouponFormData>({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discountType: coupon?.discountType || 'percentage',
    discountValue: coupon?.discountValue || 0,
    minAmount: coupon?.minAmount || 0,
    maxDiscount: coupon?.maxDiscount || undefined,
    maxRedemptions: coupon?.maxRedemptions || undefined,
    expiresAt: coupon?.expiresAt || undefined,
    isActive: coupon?.isActive ?? true,
    applicablePlans: coupon?.applicablePlans || null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Coupon code must contain only uppercase letters and numbers';
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage discount must be between 0 and 100';
    }

    if (formData.minAmount !== undefined && formData.minAmount < 0) {
      newErrors.minAmount = 'Minimum amount cannot be negative';
    }

    if (formData.maxDiscount !== undefined && formData.maxDiscount < 0) {
      newErrors.maxDiscount = 'Maximum discount cannot be negative';
    }

    if (formData.maxRedemptions !== undefined && formData.maxRedemptions < 0) {
      newErrors.maxRedemptions = 'Maximum redemptions cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const url = coupon
        ? `/api/admin/coupons/${coupon.id}`
        : '/api/admin/coupons';
      
      const method = coupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          code: formData.code.toUpperCase()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save coupon');
      }

      onSuccess();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to save coupon'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CouponFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Coupon Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Coupon Code *
          </label>
          <input
            type="text"
            id="code"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.code ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="WELCOME25"
            disabled={!!coupon}
          />
          {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
          <p className="mt-1 text-xs text-gray-500">Uppercase letters and numbers only</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter coupon description..."
          />
        </div>

        {/* Discount Type */}
        <div>
          <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-1">
            Discount Type *
          </label>
          <select
            id="discountType"
            value={formData.discountType}
            onChange={(e) => handleChange('discountType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        {/* Discount Value */}
        <div>
          <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
            Discount Value *
            {formData.discountType === 'percentage' ? ' (%)' : ' (cents)'}
          </label>
          <input
            type="number"
            id="discountValue"
            value={formData.discountValue || ''}
            onChange={(e) => handleChange('discountValue', parseFloat(e.target.value) || 0)}
            min="0"
            max={formData.discountType === 'percentage' ? 100 : undefined}
            step={formData.discountType === 'percentage' ? 0.1 : 1}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.discountValue ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={formData.discountType === 'percentage' ? '25' : '2500'}
          />
          {errors.discountValue && (
            <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>
          )}
          {formData.discountType === 'fixed' && (
            <p className="mt-1 text-xs text-gray-500">Enter amount in cents (e.g., 2500 = $25.00)</p>
          )}
        </div>

        {/* Minimum Amount (for fixed discounts) */}
        <div>
          <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Order Amount (cents)
          </label>
          <input
            type="number"
            id="minAmount"
            value={formData.minAmount || 0}
            onChange={(e) => handleChange('minAmount', parseInt(e.target.value) || 0)}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.minAmount ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.minAmount && <p className="mt-1 text-sm text-red-600">{errors.minAmount}</p>}
        </div>

        {/* Max Discount (for percentage discounts) */}
        {formData.discountType === 'percentage' && (
          <div>
            <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Discount (cents, optional)
            </label>
            <input
              type="number"
              id="maxDiscount"
              value={formData.maxDiscount || ''}
              onChange={(e) => handleChange('maxDiscount', e.target.value ? parseInt(e.target.value) : undefined)}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.maxDiscount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Optional"
            />
            {errors.maxDiscount && (
              <p className="mt-1 text-sm text-red-600">{errors.maxDiscount}</p>
            )}
          </div>
        )}

        {/* Max Redemptions */}
        <div>
          <label htmlFor="maxRedemptions" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Redemptions (optional)
          </label>
          <input
            type="number"
            id="maxRedemptions"
            value={formData.maxRedemptions || ''}
            onChange={(e) => handleChange('maxRedemptions', e.target.value ? parseInt(e.target.value) : undefined)}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.maxRedemptions ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Unlimited"
          />
          {errors.maxRedemptions && (
            <p className="mt-1 text-sm text-red-600">{errors.maxRedemptions}</p>
          )}
        </div>

        {/* Expires At */}
        <div>
          <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
            Expires At (optional)
          </label>
          <input
            type="datetime-local"
            id="expiresAt"
            value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange('expiresAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Is Active */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Active
          </label>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </div>
      </form>
    </div>
  );
}
