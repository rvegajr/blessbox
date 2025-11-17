// src/tests/pages/CheckoutPage.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import CheckoutPage from '@/app/checkout/page';

// Mock Next.js navigation
const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('?plan=standard');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock the SquarePaymentForm component
vi.mock('@/components/payment/SquarePaymentForm', () => ({
  default: ({ amount, onPaymentSuccess, onPaymentError }: any) => (
    <div data-testid="square-payment-form">
      <div>Amount: ${(amount / 100).toFixed(2)}</div>
      <button 
        onClick={() => onPaymentSuccess({ transactionId: 'test-123' })}
        data-testid="mock-pay-button"
      >
        Pay ${(amount / 100).toFixed(2)}
      </button>
      <button 
        onClick={() => onPaymentError('Payment failed')}
        data-testid="mock-error-button"
      >
        Simulate Error
      </button>
    </div>
  ),
}));

// Mock the CouponInput component
vi.mock('@/components/payment/CouponInput', () => ({
  CouponInput: ({ onCouponApplied, onCouponRemoved, onError, amount, planType }: any) => {
    const [appliedCoupon, setAppliedCoupon] = React.useState(null);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === 'VALID25' && !appliedCoupon) {
        const couponResult = {
          code: 'VALID25',
          discount: Math.round(amount * 0.25),
          finalAmount: Math.round(amount * 0.75),
        };
        setAppliedCoupon(couponResult);
        onCouponApplied(couponResult);
      } else if (e.target.value === 'INVALID') {
        onError('Invalid coupon code');
      }
    };
    
    const handleRemove = () => {
      setAppliedCoupon(null);
      onCouponRemoved();
    };
    
    return (
      <div data-testid="coupon-input">
        {appliedCoupon ? (
          <div>
            <div>Applied: {appliedCoupon.code}</div>
            <button 
              onClick={handleRemove}
              data-testid="remove-coupon-button"
            >
              Remove Coupon
            </button>
          </div>
        ) : (
          <input 
            placeholder="Enter coupon code"
            data-testid="coupon-code-input"
            onChange={handleInputChange}
          />
        )}
      </div>
    );
  },
}));

// Mock fetch for Square config
global.fetch = vi.fn();

describe('CheckoutPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({
        applicationId: 'test-app-id',
        locationId: 'test-location-id',
        environment: 'sandbox',
      }),
    });
  });

  describe('Rendering', () => {
    it('should render checkout page with standard plan by default', async () => {
      render(<CheckoutPage />);
      
      expect(screen.getByText('Checkout')).toBeInTheDocument();
      expect(screen.getByText('Complete your subscription to the STANDARD plan')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });

    it('should render with different plan from URL params', async () => {
      mockSearchParams = new URLSearchParams('?plan=enterprise');
      render(<CheckoutPage />);
      
      expect(screen.getByText('Complete your subscription to the ENTERPRISE plan')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('should show loading state while Square config loads', async () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<CheckoutPage />);
      
      expect(screen.getByText('Loading payment form...')).toBeInTheDocument();
    });
  });

  describe('Coupon Integration', () => {
    it('should display coupon input component', async () => {
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('coupon-input')).toBeInTheDocument();
      });
    });

    it('should show price breakdown with original amount', async () => {
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Plan Price:')).toBeInTheDocument();
        expect(screen.getByText('$29.99')).toBeInTheDocument();
        expect(screen.getByText('Total:')).toBeInTheDocument();
      });
    });

    it('should apply coupon and update pricing', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('coupon-input')).toBeInTheDocument();
      });

      const couponInput = screen.getByTestId('coupon-code-input');
      await user.type(couponInput, 'VALID25');

      await waitFor(() => {
        expect(screen.getByText('Discount (VALID25):')).toBeInTheDocument();
        expect(screen.getByText('-$7.50')).toBeInTheDocument();
        expect(screen.getByText('$22.49')).toBeInTheDocument(); // Updated total
      });
    });

    it('should remove coupon and reset pricing', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);
      
      // Apply coupon first
      await waitFor(() => {
        expect(screen.getByTestId('coupon-input')).toBeInTheDocument();
      });

      const couponInput = screen.getByTestId('coupon-code-input');
      await user.type(couponInput, 'VALID25');

      await waitFor(() => {
        expect(screen.getByText('Discount (VALID25):')).toBeInTheDocument();
      });

      // Remove coupon
      const removeButton = screen.getByTestId('remove-coupon-button');
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('Discount (VALID25):')).not.toBeInTheDocument();
        expect(screen.getByText('$29.99')).toBeInTheDocument(); // Back to original
      });
    });

    it('should handle coupon validation errors', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('coupon-input')).toBeInTheDocument();
      });

      const couponInput = screen.getByTestId('coupon-code-input');
      await user.type(couponInput, 'INVALID');

      await waitFor(() => {
        expect(screen.getByText('Invalid coupon code')).toBeInTheDocument();
      });
    });

    it('should update Square payment form with discounted amount', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('square-payment-form')).toBeInTheDocument();
      });

      // Apply coupon
      const couponInput = screen.getByTestId('coupon-code-input');
      await user.type(couponInput, 'VALID25');

      await waitFor(() => {
        expect(screen.getByText('Amount: $22.49')).toBeInTheDocument();
        expect(screen.getByText('Pay $22.49')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Flow', () => {
    it('should handle successful payment', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('square-payment-form')).toBeInTheDocument();
      });

      const payButton = screen.getByTestId('mock-pay-button');
      await user.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Payment successful! Redirecting to dashboard...')).toBeInTheDocument();
      });

      // Advance timers by 2 seconds to trigger the redirect
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
      
      vi.useRealTimers();
    });

    it('should handle payment errors', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('square-payment-form')).toBeInTheDocument();
      });

      const errorButton = screen.getByTestId('mock-error-button');
      await user.click(errorButton);

      await waitFor(() => {
        expect(screen.getByText('Payment failed: Payment failed')).toBeInTheDocument();
      });
    });

    it('should handle payment with applied coupon', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);
      
      // Apply coupon first
      await waitFor(() => {
        expect(screen.getByTestId('coupon-input')).toBeInTheDocument();
      });

      const couponInput = screen.getByTestId('coupon-code-input');
      await user.type(couponInput, 'VALID25');

      await waitFor(() => {
        expect(screen.getByText('Amount: $22.49')).toBeInTheDocument();
      });

      // Process payment
      const payButton = screen.getByTestId('mock-pay-button');
      await user.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Payment successful! Redirecting to dashboard...')).toBeInTheDocument();
      });
    });
  });

  describe('Plan Variations', () => {
    it('should handle free plan with no payment', async () => {
      mockSearchParams = new URLSearchParams('?plan=free');
      render(<CheckoutPage />);
      
      expect(screen.getByText('Complete your subscription to the FREE plan')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle enterprise plan pricing', async () => {
      mockSearchParams = new URLSearchParams('?plan=enterprise');
      render(<CheckoutPage />);
      
      expect(screen.getByText('Complete your subscription to the ENTERPRISE plan')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle Square config loading error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Config failed'));
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Square configuration error: Config failed')).toBeInTheDocument();
      });
    });

    it('should handle invalid plan gracefully', async () => {
      mockSearchParams = new URLSearchParams('?plan=invalid');
      render(<CheckoutPage />);
      
      // Should default to standard plan
      expect(screen.getByText('Complete your subscription to the STANDARD plan')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });
  });
});
