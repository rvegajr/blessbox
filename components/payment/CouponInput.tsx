'use client';

import React, { useState, useCallback } from 'react';
import { CouponService } from '@/lib/coupons';
import { CouponInputProps, CouponResult } from '@/lib/interfaces/ICouponInput';

export const CouponInput: React.FC<CouponInputProps> = ({
  onCouponApplied,
  onCouponRemoved,
  onError,
  planType,
  amount,
  className = '',
  disabled = false,
  loading = false,
  placeholder = 'Enter coupon code',
  'data-testid': testId = 'coupon-input',
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const couponService = new CouponService();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().trim();
    setCouponCode(value);
    setErrorMessage(null);
  }, []);

  const handleClear = useCallback(() => {
    setCouponCode('');
    setErrorMessage(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || loading || isValidating || appliedCoupon) return;
    
    const trimmedCode = couponCode.trim();
    if (!trimmedCode) return;

    setIsValidating(true);
    setErrorMessage(null);

    try {
      // Validate coupon
      const validation = await couponService.validateCoupon(trimmedCode);
      
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid coupon code');
        onError(validation.error || 'Invalid coupon code');
        return;
      }

      // Apply coupon
      const finalAmount = await couponService.applyCoupon(trimmedCode, amount, planType);
      const discount = amount - finalAmount;
      
      const result: CouponResult = {
        code: trimmedCode,
        discount,
        finalAmount,
      };

      setAppliedCoupon(result);
      onCouponApplied(result);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to apply coupon. Please try again.';
      setErrorMessage(errorMsg);
      onError(errorMsg);
    } finally {
      setIsValidating(false);
    }
  }, [couponCode, disabled, loading, isValidating, appliedCoupon, amount, planType, onCouponApplied, onError, couponService]);

  const handleRemove = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    setErrorMessage(null);
    onCouponRemoved();
  }, [onCouponRemoved]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const isDisabled = disabled || loading || isValidating || appliedCoupon !== null;
  const isSubmitting = isValidating || loading;

  return (
    <div 
      className={`coupon-input ${className}`}
      data-testid={testId}
    >
      {appliedCoupon ? (
        <div className="applied-coupon">
          <div className="coupon-info">
            <span className="coupon-code">{appliedCoupon.code}</span>
            <span className="coupon-discount">
              {appliedCoupon.discount === amount ? '100% off' : `${Math.round((appliedCoupon.discount / amount) * 100)}% off`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="remove-coupon-btn"
            aria-label="Remove coupon"
          >
            Remove
          </button>
          <div className="success-message" role="status" aria-live="polite">
            Coupon {appliedCoupon.code} applied successfully!
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="coupon-form">
          <div className="input-group">
            <input
              type="text"
              value={couponCode}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isDisabled}
              className="coupon-input-field"
              aria-label="Coupon code"
              data-testid="coupon-code-input"
            />
            {couponCode && (
              <button
                type="button"
                onClick={handleClear}
                className="clear-btn"
                aria-label="Clear coupon code"
                disabled={isDisabled}
              >
                ✕
              </button>
            )}
          </div>
          
          <button
            type="button"
            disabled={isDisabled || !couponCode.trim()}
            className="apply-btn"
            data-testid="apply-coupon-btn"
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Applying...' : 'Apply'}
          </button>
        </form>
      )}

      {errorMessage && (
        <div className="error-message" role="alert" aria-live="assertive">
          {errorMessage}
        </div>
      )}

      <style>{`
        .coupon-input {
          width: 100%;
        }

        .applied-coupon {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background-color: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .coupon-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .coupon-code {
          font-weight: 600;
          color: #0c4a6e;
        }

        .coupon-discount {
          font-size: 14px;
          color: #0369a1;
        }

        .remove-coupon-btn {
          background: none;
          border: 1px solid #0ea5e9;
          color: #0ea5e9;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .remove-coupon-btn:hover {
          background-color: #0ea5e9;
          color: white;
        }

        .coupon-form {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .input-group {
          position: relative;
          flex: 1;
        }

        .coupon-input-field {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .coupon-input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .coupon-input-field:disabled {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .clear-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }

        .clear-btn:hover {
          color: #374151;
        }

        .clear-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .apply-btn {
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .apply-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .apply-btn:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .error-message {
          color: #dc2626;
          font-size: 14px;
          margin-top: 8px;
          padding: 8px 12px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
        }

        .success-message {
          color: #059669;
          font-size: 14px;
          margin-top: 8px;
        }

        @media (max-width: 640px) {
          .coupon-form {
            flex-direction: column;
          }

          .apply-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
