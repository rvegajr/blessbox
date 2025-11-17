// src/tests/components/StatCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { StatCard } from '@/components/dashboard/StatCard';
import type { StatCardProps } from '@/interfaces/Dashboard.interface';

describe('StatCard Component', () => {
  const mockProps: StatCardProps = {
    title: 'Total Registrations',
    value: 150,
    change: {
      value: 12.5,
      type: 'increase',
      period: 'vs last month',
    },
    icon: <div>📊</div>,
  };

  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<StatCard {...mockProps} />);
      
      expect(screen.getByTestId('stat-card')).toBeInTheDocument();
      expect(screen.getByText('Total Registrations')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<StatCard {...mockProps} className="custom-stat" />);
      
      const card = screen.getByTestId('stat-card');
      expect(card).toHaveClass('custom-stat');
    });

    it('should render with custom test id', () => {
      render(<StatCard {...mockProps} data-testid="custom-stat" />);
      
      expect(screen.getByTestId('custom-stat')).toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      render(<StatCard {...mockProps} />);
      
      expect(screen.getAllByTestId('stat-icon')).toHaveLength(1);
    });

    it('should render without icon', () => {
      const propsWithoutIcon = { ...mockProps };
      delete propsWithoutIcon.icon;
      
      render(<StatCard {...propsWithoutIcon} />);
      
      expect(screen.getByTestId('stat-card')).toBeInTheDocument();
      expect(screen.queryByTestId('stat-icon')).not.toBeInTheDocument();
    });
  });

  describe('Value Display', () => {
    it('should display numeric values', () => {
      render(<StatCard {...mockProps} value={150} />);
      
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should display string values', () => {
      render(<StatCard {...mockProps} value="85.5%" />);
      
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });

    it('should display zero values', () => {
      render(<StatCard {...mockProps} value={0} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should display large numbers', () => {
      render(<StatCard {...mockProps} value={1234567} />);
      
      expect(screen.getByText('1.2M')).toBeInTheDocument();
    });
  });

  describe('Change Indicators', () => {
    it('should show increase indicator', () => {
      render(<StatCard {...mockProps} />);
      
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('should show decrease indicator', () => {
      const decreaseProps = {
        ...mockProps,
        change: {
          value: 8.2,
          type: 'decrease' as const,
          period: 'vs last week',
        },
      };
      
      render(<StatCard {...decreaseProps} />);
      
      expect(screen.getByText('-8.2%')).toBeInTheDocument();
      expect(screen.getByText('vs last week')).toBeInTheDocument();
    });

    it('should show neutral indicator', () => {
      const neutralProps = {
        ...mockProps,
        change: {
          value: 0,
          type: 'neutral' as const,
          period: 'vs last month',
        },
      };
      
      render(<StatCard {...neutralProps} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('should render without change indicator', () => {
      const propsWithoutChange = { ...mockProps };
      delete propsWithoutChange.change;
      
      render(<StatCard {...propsWithoutChange} />);
      
      expect(screen.getByTestId('stat-card')).toBeInTheDocument();
      expect(screen.queryByText('+12.5%')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StatCard {...mockProps} />);
      
      const card = screen.getByTestId('stat-card');
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Total Registrations: 150');
    });

    it('should have proper heading structure', () => {
      render(<StatCard {...mockProps} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<StatCard {...mockProps} />);
      
      const card = screen.getByTestId('stat-card');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Visual States', () => {
    it('should have proper styling classes', () => {
      render(<StatCard {...mockProps} />);
      
      const card = screen.getByTestId('stat-card');
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm', 'p-6');
    });

    it('should show increase color for positive change', () => {
      render(<StatCard {...mockProps} />);
      
      const changeElement = screen.getByText('+12.5%');
      expect(changeElement).toHaveClass('text-green-600');
    });

    it('should show decrease color for negative change', () => {
      const decreaseProps = {
        ...mockProps,
        change: {
          value: 8.2,
          type: 'decrease' as const,
          period: 'vs last week',
        },
      };
      
      render(<StatCard {...decreaseProps} />);
      
      const changeElement = screen.getByText('-8.2%');
      expect(changeElement).toHaveClass('text-red-600');
    });

    it('should show neutral color for no change', () => {
      const neutralProps = {
        ...mockProps,
        change: {
          value: 0,
          type: 'neutral' as const,
          period: 'vs last month',
        },
      };
      
      render(<StatCard {...neutralProps} />);
      
      const changeElement = screen.getByText('0%');
      expect(changeElement).toHaveClass('text-gray-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      render(<StatCard {...mockProps} title="" />);
      
      expect(screen.getByTestId('stat-card')).toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const longTitle = 'Very Long Statistic Title That Might Overflow';
      render(<StatCard {...mockProps} title={longTitle} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      render(<StatCard {...mockProps} value={85.5} />);
      
      expect(screen.getByText('85.5')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      render(<StatCard {...mockProps} value={-10} />);
      
      expect(screen.getByText('-10')).toBeInTheDocument();
    });
  });
});
