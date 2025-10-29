// src/tests/components/EmptyState.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import { EmptyState } from '@/components/ui/EmptyState';
import type { EmptyStateProps } from '@/interfaces/EmptyState.interface';

describe('EmptyState Component', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const props: EmptyStateProps = {
        icon: <div data-testid="test-icon">📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
      };

      render(<EmptyState {...props} />);

      expect(screen.getByText('No Items Yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first item to get started.')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should render with primary action', () => {
      const mockOnClick = vi.fn();
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        primaryAction: {
          label: 'Create Item',
          onClick: mockOnClick,
        },
      };

      render(<EmptyState {...props} />);

      const button = screen.getByRole('button', { name: 'Create Item' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-blue-600'); // Primary variant
    });

    it('should render with secondary action', () => {
      const mockOnClick = vi.fn();
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        secondaryAction: {
          label: 'Learn More',
          onClick: mockOnClick,
        },
      };

      render(<EmptyState {...props} />);

      const button = screen.getByRole('button', { name: 'Learn More' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-gray-100'); // Secondary variant
    });

    it('should render with help link', () => {
      const mockOnClick = vi.fn();
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        helpLink: {
          text: 'Watch Tutorial',
          onClick: mockOnClick,
        },
      };

      render(<EmptyState {...props} />);

      const link = screen.getByText('Watch Tutorial');
      expect(link).toBeInTheDocument();
      expect(link).toHaveClass('text-blue-600');
    });

    it('should render with custom className', () => {
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        className: 'custom-empty-state',
      };

      render(<EmptyState {...props} />);
      const element = screen.getByTestId('empty-state');
      expect(element).toHaveClass('custom-empty-state');
    });

    it('should render with data-testid', () => {
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        'data-testid': 'empty-state-test',
      };

      render(<EmptyState {...props} />);
      expect(screen.getByTestId('empty-state-test')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call primary action onClick when clicked', () => {
      const mockOnClick = vi.fn();
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        primaryAction: {
          label: 'Create Item',
          onClick: mockOnClick,
        },
      };

      render(<EmptyState {...props} />);

      const button = screen.getByRole('button', { name: 'Create Item' });
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call secondary action onClick when clicked', () => {
      const mockOnClick = vi.fn();
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        secondaryAction: {
          label: 'Learn More',
          onClick: mockOnClick,
        },
      };

      render(<EmptyState {...props} />);

      const button = screen.getByRole('button', { name: 'Learn More' });
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call help link onClick when clicked', () => {
      const mockOnClick = vi.fn();
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        helpLink: {
          text: 'Watch Tutorial',
          onClick: mockOnClick,
        },
      };

      render(<EmptyState {...props} />);

      const link = screen.getByText('Watch Tutorial');
      fireEvent.click(link);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should disable primary action when disabled', () => {
      const mockOnClick = vi.fn();
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        primaryAction: {
          label: 'Create Item',
          onClick: mockOnClick,
          disabled: true,
        },
      };

      render(<EmptyState {...props} />);

      const button = screen.getByRole('button', { name: 'Create Item' });
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
      };

      render(<EmptyState {...props} />);

      const container = screen.getByRole('region', { name: 'Empty state' });
      expect(container).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: 'Create your first item to get started.',
        primaryAction: {
          label: 'Create Item',
          onClick: vi.fn(),
        },
      };

      render(<EmptyState {...props} />);

      const button = screen.getByRole('button', { name: 'Create Item' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: '',
        description: 'Create your first item to get started.',
      };

      render(<EmptyState {...props} />);
      expect(screen.getByText('Create your first item to get started.')).toBeInTheDocument();
    });

    it('should handle empty description', () => {
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: 'No Items Yet',
        description: '',
      };

      render(<EmptyState {...props} />);
      expect(screen.getByText('No Items Yet')).toBeInTheDocument();
    });

    it('should handle React node content', () => {
      const props: EmptyStateProps = {
        icon: <div>📦</div>,
        title: <span>Custom <strong>Title</strong></span>,
        description: <p>Custom <em>description</em> with HTML</p>,
      };

      render(<EmptyState {...props} />);
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
    });
  });
});
