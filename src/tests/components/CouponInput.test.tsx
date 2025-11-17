// src/tests/components/CouponInput.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { CouponInput } from '@/components/payment/CouponInput';
import { CouponService } from '@/lib/coupons';

// Mock the CouponService
vi.mock('@/lib/coupons', () => ({
  CouponService: vi.fn().mockImplementation(() => ({
    validateCoupon: vi.fn(),
    applyCoupon: vi.fn(),
  })),
}));

// Mock the coupon service instance
const mockValidateCoupon = vi.fn();
const mockApplyCoupon = vi.fn();

// Mock the CouponService constructor
vi.mocked(CouponService).mockImplementation(() => ({
  validateCoupon: mockValidateCoupon,
  applyCoupon: mockApplyCoupon,
} as any));

describe('CouponInput Component', () => {
  const mockOnCouponApplied = vi.fn();
  const mockOnCouponRemoved = vi.fn();
  const mockOnError = vi.fn();

  const defaultProps = {
    onCouponApplied: mockOnCouponApplied,
    onCouponRemoved: mockOnCouponRemoved,
    onError: mockOnError,
    planType: 'standard',
    amount: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<CouponInput {...defaultProps} />);
      
      expect(screen.getByTestId('coupon-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter coupon code')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<CouponInput {...defaultProps} className="custom-coupon-input" />);
      
      const container = screen.getByTestId('coupon-input');
      expect(container).toHaveClass('custom-coupon-input');
    });

    it('should render with disabled state', () => {
      render(<CouponInput {...defaultProps} disabled />);
      
      expect(screen.getByPlaceholderText('Enter coupon code')).toBeDisabled();
      expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled();
    });

    it('should render with loading state', () => {
      render(<CouponInput {...defaultProps} loading />);
      
      expect(screen.getByRole('button', { name: /applying/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /applying/i })).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should update input value when user types', async () => {
      const user = userEvent.setup();
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      await user.type(input, 'WELCOME25');
      
      expect(input).toHaveValue('WELCOME25');
    });

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      await user.type(input, 'WELCOME25');
      
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);
      
      expect(input).toHaveValue('');
    });

    it('should submit form when Enter key is pressed', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ valid: true });
      mockApplyCoupon.mockResolvedValue(75);
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      await user.type(input, 'WELCOME25');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockValidateCoupon).toHaveBeenCalledWith('WELCOME25');
      });
    });

    it('should not submit form when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      await user.type(input, 'WELCOME25');
      
      // Simulate Shift+Enter by firing the event directly
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
      
      expect(mockValidateCoupon).not.toHaveBeenCalled();
    });
  });

  describe('Coupon Validation', () => {
    it('should validate and apply valid coupon', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ valid: true });
      mockApplyCoupon.mockResolvedValue(75);
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, 'WELCOME25');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockValidateCoupon).toHaveBeenCalledWith('WELCOME25');
        expect(mockApplyCoupon).toHaveBeenCalledWith('WELCOME25', 100, 'standard');
        expect(mockOnCouponApplied).toHaveBeenCalledWith({
          code: 'WELCOME25',
          discount: 25,
          finalAmount: 75,
        });
      });
    });

    it('should handle invalid coupon', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ 
        valid: false, 
        error: 'Coupon not found' 
      });
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, 'INVALID');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockValidateCoupon).toHaveBeenCalledWith('INVALID');
        expect(mockOnError).toHaveBeenCalledWith('Coupon not found');
        expect(screen.getByText('Coupon not found')).toBeInTheDocument();
      });
    });

    it('should handle expired coupon', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ 
        valid: false, 
        error: 'Coupon has expired' 
      });
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, 'EXPIRED');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Coupon has expired')).toBeInTheDocument();
      });
    });

    it('should handle network error during validation', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockRejectedValue(new Error('Network error'));
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, 'WELCOME25');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Network error');
      });
    });

    it('should handle network error during application', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ valid: true });
      mockApplyCoupon.mockRejectedValue(new Error('Network error'));
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, 'WELCOME25');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Network error');
      });
    });
  });

  describe('Applied Coupon State', () => {
    it('should show applied coupon with remove option', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ valid: true });
      mockApplyCoupon.mockResolvedValue(75);
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, 'WELCOME25');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
        expect(screen.getByText('25% off')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
      });
    });

    it('should remove applied coupon when remove button is clicked', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ valid: true });
      mockApplyCoupon.mockResolvedValue(75);
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      // Apply coupon
      await user.type(input, 'WELCOME25');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });
      
      // Remove coupon
      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);
      
      expect(mockOnCouponRemoved).toHaveBeenCalled();
      expect(screen.getByPlaceholderText('Enter coupon code')).toBeInTheDocument();
    });

    it('should not allow applying another coupon when one is already applied', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ valid: true });
      mockApplyCoupon.mockResolvedValue(75);
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      // Apply first coupon
      await user.type(input, 'WELCOME25');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });
      
      // Verify that the input is no longer available (coupon is applied)
      expect(screen.queryByPlaceholderText('Enter coupon code')).not.toBeInTheDocument();
      
      // Verify that only one validation call was made
      expect(mockValidateCoupon).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input Validation', () => {
    it('should not submit empty coupon code', async () => {
      const user = userEvent.setup();
      render(<CouponInput {...defaultProps} />);
      
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);
      
      expect(mockValidateCoupon).not.toHaveBeenCalled();
    });

    it('should not submit whitespace-only coupon code', async () => {
      const user = userEvent.setup();
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, '   ');
      await user.click(applyButton);
      
      expect(mockValidateCoupon).not.toHaveBeenCalled();
    });

    it('should trim whitespace from coupon code', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ valid: true });
      mockApplyCoupon.mockResolvedValue(75);
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, '  WELCOME25  ');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockValidateCoupon).toHaveBeenCalledWith('WELCOME25');
      });
    });

    it('should convert coupon code to uppercase', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ valid: true });
      mockApplyCoupon.mockResolvedValue(75);
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, 'welcome25');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockValidateCoupon).toHaveBeenCalledWith('WELCOME25');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during validation', async () => {
      const user = userEvent.setup();
      let resolveValidation: (value: any) => void;
      const validationPromise = new Promise((resolve) => {
        resolveValidation = resolve;
      });
      mockValidateCoupon.mockReturnValue(validationPromise);
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, 'WELCOME25');
      await user.click(applyButton);
      
      expect(screen.getByRole('button', { name: /applying/i })).toBeInTheDocument();
      
      // Resolve the promise
      resolveValidation!({ valid: true });
      mockApplyCoupon.mockResolvedValue(75);
      
      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      expect(input).toHaveAttribute('aria-label', 'Coupon code');
      
      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).toHaveAttribute('type', 'button');
    });

    it('should announce coupon application to screen readers', async () => {
      const user = userEvent.setup();
      mockValidateCoupon.mockResolvedValue({ valid: true });
      mockApplyCoupon.mockResolvedValue(75);
      
      render(<CouponInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter coupon code');
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(input, 'WELCOME25');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Coupon WELCOME25 applied successfully!')).toBeInTheDocument();
      });
    });
  });
});
