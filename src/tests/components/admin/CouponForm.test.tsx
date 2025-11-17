import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { CouponForm } from '@/components/admin/CouponForm';

// Mock fetch
global.fetch = vi.fn();

describe('CouponForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create form with all fields', () => {
      render(<CouponForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

      expect(screen.getByLabelText(/coupon code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/discount type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/discount value/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<CouponForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should validate percentage discount range', async () => {
      const user = userEvent.setup();
      render(<CouponForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

      const codeInput = screen.getByLabelText(/coupon code/i);
      const discountTypeSelect = screen.getByLabelText(/discount type/i);
      const discountValueInput = screen.getByLabelText(/discount value/i);

      await user.type(codeInput, 'TEST101');
      await user.selectOptions(discountTypeSelect, 'percentage');
      await user.type(discountValueInput, '150'); // Invalid: > 100

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/between 0 and 100/i)).toBeInTheDocument();
      });
    });

    it('should create coupon successfully', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, coupon: { id: '1' } })
      });

      render(<CouponForm onSuccess={onSuccess} onCancel={vi.fn()} />);

      const codeInput = screen.getByLabelText(/coupon code/i);
      const discountTypeSelect = screen.getByLabelText(/discount type/i);
      const discountValueInput = screen.getByLabelText(/discount value/i);

      await user.type(codeInput, 'TEST25');
      await user.selectOptions(discountTypeSelect, 'percentage');
      await user.type(discountValueInput, '25');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode', () => {
    const existingCoupon = {
      id: '1',
      code: 'EXISTING',
      description: 'Existing coupon',
      discountType: 'percentage',
      discountValue: 20,
      minAmount: 1000,
      maxDiscount: 500,
      maxRedemptions: 100,
      expiresAt: '2025-12-31',
      isActive: true,
      applicablePlans: null
    };

    it('should populate form with existing coupon data', () => {
      render(<CouponForm coupon={existingCoupon} onSuccess={vi.fn()} onCancel={vi.fn()} />);

      expect(screen.getByDisplayValue('EXISTING')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing coupon')).toBeInTheDocument();
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    });

    it('should update coupon successfully', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, coupon: existingCoupon })
      });

      render(<CouponForm coupon={existingCoupon} onSuccess={onSuccess} onCancel={vi.fn()} />);

      const discountValueInput = screen.getByLabelText(/discount value/i);
      await user.clear(discountValueInput);
      await user.type(discountValueInput, '30');

      const submitButton = screen.getByRole('button', { name: /update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Form Fields', () => {
    it('should toggle between percentage and fixed discount types', async () => {
      const user = userEvent.setup();
      render(<CouponForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

      const discountTypeSelect = screen.getByLabelText(/discount type/i);
      
      await user.selectOptions(discountTypeSelect, 'percentage');
      expect(screen.getByText(/percentage/i)).toBeInTheDocument();

      await user.selectOptions(discountTypeSelect, 'fixed');
      expect(screen.getByText(/fixed/i)).toBeInTheDocument();
    });

    it('should handle optional fields', async () => {
      const user = userEvent.setup();
      render(<CouponForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

      const codeInput = screen.getByLabelText(/coupon code/i);
      const discountTypeSelect = screen.getByLabelText(/discount type/i);
      const discountValueInput = screen.getByLabelText(/discount value/i);

      await user.type(codeInput, 'TEST25');
      await user.selectOptions(discountTypeSelect, 'percentage');
      await user.type(discountValueInput, '25');

      // Optional fields should be present but not required
      expect(screen.getByLabelText(/expires at/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max redemptions/i)).toBeInTheDocument();
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<CouponForm onSuccess={vi.fn()} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
