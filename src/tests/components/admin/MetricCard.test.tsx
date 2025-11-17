import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-utils';
import { MetricCard } from '@/components/admin/MetricCard';

describe('MetricCard Component', () => {
  it('should render metric card with title and value', () => {
    render(<MetricCard title="Total Coupons" value={25} />);

    expect(screen.getByText('Total Coupons')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should render with custom icon', () => {
    render(<MetricCard title="Active" value={15} icon={<span>📊</span>} />);

    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('should render with trend indicator', () => {
    render(<MetricCard title="Redemptions" value={100} trend="up" trendValue={10} />);

    expect(screen.getByText(/\+10%/i)).toBeInTheDocument();
  });

  it('should render with description', () => {
    render(
      <MetricCard
        title="Discount Given"
        value="$5,000.00"
        description="Total discounts applied"
      />
    );

    expect(screen.getByText('Total discounts applied')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MetricCard title="Test" value={0} className="custom-class" />
    );

    const metricCard = container.querySelector('[data-testid="metric-card"]');
    expect(metricCard).toHaveClass('custom-class');
  });
});
