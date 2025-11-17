// src/tests/pages/CheckoutPageSimple.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import CheckoutPage from '@/app/checkout/page';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams('?plan=standard');

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
    </div>
  ),
}));

// Mock the CouponInput component
vi.mock('@/components/payment/CouponInput', () => ({
  CouponInput: ({ onCouponApplied, onCouponRemoved, onError, amount }: any) => {
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

describe('CheckoutPage Simple Integration', () => {
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

  describe('Basic Rendering', () => {
      it('should render checkout page with standard plan', async () => {
        render(<CheckoutPage />);

        expect(screen.getByText('Checkout')).toBeInTheDocument();
        expect(screen.getByText((content, element) => {
          return element?.textContent === 'Complete your subscription to the standard plan';
        })).toBeInTheDocument();
        // Check for the total amount specifically (the blue one)
        const totalElement = screen.getByText('Total:').parentElement;
        expect(totalElement).toHaveTextContent('$29.99');
      });

    it('should display coupon input component', async () => {
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('coupon-input')).toBeInTheDocument();
      });
    });

    it('should show price breakdown', async () => {
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Plan Price:')).toBeInTheDocument();
        expect(screen.getByText('Total:')).toBeInTheDocument();
      });
    });
  });

  describe('Coupon Functionality', () => {
    it('should apply coupon and update pricing', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('coupon-input')).toBeInTheDocument();
      });

      const couponInput = screen.getByTestId('coupon-code-input');
      await user.type(couponInput, 'VALID25');

      await waitFor(() => {
        expect(screen.getByText('Applied: VALID25')).toBeInTheDocument();
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
        expect(screen.getByText('Applied: VALID25')).toBeInTheDocument();
      });

      // Remove coupon
      const removeButton = screen.getByTestId('remove-coupon-button');
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('Discount (VALID25):')).not.toBeInTheDocument();
        // Check that the total amount is back to $29.99
        const totalElement = screen.getByText('Total:').parentElement;
        expect(totalElement).toHaveTextContent('$29.99');
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
  });

  describe('Payment Integration', () => {
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
});
