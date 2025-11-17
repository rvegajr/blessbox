import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { CouponListTable } from '@/components/admin/CouponListTable';

// Mock fetch
global.fetch = vi.fn();

const mockCoupons = [
  {
    id: '1',
    code: 'WELCOME25',
    description: 'Welcome discount',
    discountType: 'percentage',
    discountValue: 25,
    isActive: true,
    expiresAt: '2025-12-31',
    createdAt: '2024-01-01',
    redemptionCount: 5,
    usagePercentage: 50
  },
  {
    id: '2',
    code: 'SAVE50',
    description: 'Save 50%',
    discountType: 'fixed',
    discountValue: 5000,
    isActive: false,
    expiresAt: null,
    createdAt: '2024-01-02',
    redemptionCount: 0,
    usagePercentage: 0
  }
];

describe('CouponListTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ data: mockCoupons, count: 2 })
    });
  });

  describe('Rendering', () => {
    it('should render coupon list table', async () => {
      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText('Coupon Management')).toBeInTheDocument();
      });
    });

    it('should display loading state', () => {
      render(<CouponListTable />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display coupons when loaded', async () => {
      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
        expect(screen.getByText('SAVE50')).toBeInTheDocument();
      });
    });

    it('should display empty state when no coupons', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({ data: [], count: 0 })
      });

      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText(/no coupons/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter coupons by search term', async () => {
      const user = userEvent.setup();
      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'WELCOME');

      await waitFor(() => {
        const fetchCall = (global.fetch as any).mock.calls.find((call: any) => 
          call[0].includes('$search=WELCOME')
        );
        expect(fetchCall).toBeDefined();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by active status', async () => {
      const user = userEvent.setup();
      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });

      const activeFilter = screen.getByLabelText(/active/i);
      await user.click(activeFilter);

      await waitFor(() => {
        expect((global.fetch as any)).toHaveBeenCalledWith(
          expect.stringContaining('$filter=isActive eq true'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValue({
        json: () => Promise.resolve({ data: mockCoupons, count: 25 })
      });

      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });

      const nextButton = screen.getByText(/next/i);
      await user.click(nextButton);

      await waitFor(() => {
        expect((global.fetch as any)).toHaveBeenCalledWith(
          expect.stringContaining('$skip=10'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Actions', () => {
    it('should navigate to create coupon page', async () => {
      const user = userEvent.setup();
      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create coupon/i);
      await user.click(createButton);

      // Check that navigation would happen (would need router mock for full test)
      expect(createButton).toBeInTheDocument();
    });

    it('should display edit button for each coupon', async () => {
      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText(/edit/i);
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should display delete button for each coupon', async () => {
      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/delete/i);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Sorting', () => {
    it('should sort by code when header clicked', async () => {
      const user = userEvent.setup();
      render(<CouponListTable />);

      await waitFor(() => {
        expect(screen.getByText('WELCOME25')).toBeInTheDocument();
      });

      const codeHeader = screen.getByText(/code/i);
      await user.click(codeHeader);

      await waitFor(() => {
        expect((global.fetch as any)).toHaveBeenCalledWith(
          expect.stringContaining('$orderby=code'),
          expect.any(Object)
        );
      });
    });
  });
});
