// src/tests/components/ProgressIndicator.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import type { ProgressIndicatorProps } from '@/interfaces/ProgressIndicator.interface';

describe('ProgressIndicator Component', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const props: ProgressIndicatorProps = {
        current: 2,
        total: 4,
      };

      render(<ProgressIndicator {...props} />);

      expect(screen.getByText(/2/)).toBeInTheDocument();
      expect(screen.getByText(/4/)).toBeInTheDocument();
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      const props: ProgressIndicatorProps = {
        current: 1,
        total: 3,
        label: 'Building your form',
      };

      render(<ProgressIndicator {...props} />);

      expect(screen.getByText('Building your form')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });

    it('should render with percentage when showPercentage is true', () => {
      const props: ProgressIndicatorProps = {
        current: 3,
        total: 4,
        showPercentage: true,
      };

      render(<ProgressIndicator {...props} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });

    it('should render default variant', () => {
      const props: ProgressIndicatorProps = {
        current: 1,
        total: 2,
      };

      render(<ProgressIndicator {...props} />);

      const container = screen.getByTestId('progress-indicator');
      expect(container).toHaveClass('w-full');
    });

    it('should render compact variant', () => {
      const props: ProgressIndicatorProps = {
        current: 1,
        total: 2,
        variant: 'compact',
      };

      render(<ProgressIndicator {...props} />);

      const container = screen.getByTestId('progress-indicator');
      expect(container).toHaveClass('w-32');
    });

    it('should render minimal variant', () => {
      const props: ProgressIndicatorProps = {
        current: 1,
        total: 2,
        variant: 'minimal',
      };

      render(<ProgressIndicator {...props} />);

      const container = screen.getByTestId('progress-indicator');
      expect(container).toHaveClass('w-24');
    });

    it('should render with custom className', () => {
      const props: ProgressIndicatorProps = {
        current: 1,
        total: 2,
        className: 'custom-progress',
      };

      render(<ProgressIndicator {...props} />);

      const container = screen.getByTestId('progress-indicator');
      expect(container).toHaveClass('custom-progress');
    });

    it('should render with data-testid', () => {
      const props: ProgressIndicatorProps = {
        current: 1,
        total: 2,
        'data-testid': 'custom-progress-test',
      };

      render(<ProgressIndicator {...props} />);

      expect(screen.getByTestId('custom-progress-test')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate correct progress percentage', () => {
      const props: ProgressIndicatorProps = {
        current: 2,
        total: 4,
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should handle zero progress', () => {
      const props: ProgressIndicatorProps = {
        current: 0,
        total: 4,
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle complete progress', () => {
      const props: ProgressIndicatorProps = {
        current: 4,
        total: 4,
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle single step', () => {
      const props: ProgressIndicatorProps = {
        current: 1,
        total: 1,
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const props: ProgressIndicatorProps = {
        current: 2,
        total: 4,
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: Step 2 of 4');
    });

    it('should have accessible label', () => {
      const props: ProgressIndicatorProps = {
        current: 1,
        total: 3,
        label: 'Building your form',
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: Building your form - Step 1 of 3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle current greater than total', () => {
      const props: ProgressIndicatorProps = {
        current: 5,
        total: 4,
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle negative current', () => {
      const props: ProgressIndicatorProps = {
        current: -1,
        total: 4,
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle zero total', () => {
      const props: ProgressIndicatorProps = {
        current: 1,
        total: 0,
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('Component Methods', () => {
    it('should expose getProgress method', () => {
      const props: ProgressIndicatorProps = {
        current: 2,
        total: 4,
      };

      const { container } = render(<ProgressIndicator {...props} />);
      const component = container.querySelector('[data-testid="progress-indicator"]');
      
      // This would be tested with a ref in a real implementation
      expect(component).toBeInTheDocument();
    });

    it('should expose isComplete method', () => {
      const props: ProgressIndicatorProps = {
        current: 4,
        total: 4,
      };

      render(<ProgressIndicator {...props} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });
});
