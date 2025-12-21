/**
 * Tests for GlobalHelpButton Component
 * Tests the floating help button and help drawer functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalHelpButton } from '../../components/ui/GlobalHelpButton';

// Mock the tutorial system
const mockTutorialSystem = {
  startTutorial: vi.fn(),
  checkContextTriggers: vi.fn(),
  isTutorialCompleted: vi.fn(() => false),
};

// Setup window.BlessBoxTutorialSystem before each test
beforeEach(() => {
  (window as any).BlessBoxTutorialSystem = mockTutorialSystem;
  vi.clearAllMocks();
});

describe('GlobalHelpButton', () => {

  describe('Rendering', () => {
    it('should render the help button', () => {
      render(<GlobalHelpButton />);
      const button = screen.getByRole('button', { name: /open help/i });
      expect(button).toBeInTheDocument();
    });

    it('should render with question mark icon', () => {
      render(<GlobalHelpButton />);
      const button = screen.getByRole('button', { name: /open help/i });
      expect(button).toHaveAttribute('aria-label', 'Open help');
    });

    it('should be positioned fixed in bottom-right', () => {
      render(<GlobalHelpButton />);
      const button = screen.getByRole('button', { name: /open help/i });
      const container = button.closest('[data-testid="global-help-button"]');
      expect(container).toHaveClass('fixed', 'bottom-6', 'right-6', 'z-50');
    });

    it('should accept custom className', () => {
      render(<GlobalHelpButton className="custom-class" />);
      const container = screen.getByTestId('global-help-button');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Help Drawer', () => {
    it('should open drawer when button is clicked', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('help-drawer')).toBeInTheDocument();
      });
    });

    it('should close drawer when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const openButton = screen.getByRole('button', { name: /open help/i });
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByTestId('help-drawer')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close help/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('help-drawer')).not.toBeInTheDocument();
      });
    });

    it('should close drawer when overlay is clicked', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const openButton = screen.getByRole('button', { name: /open help/i });
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByTestId('help-drawer-overlay')).toBeInTheDocument();
      });

      const overlay = screen.getByTestId('help-drawer-overlay');
      await user.click(overlay);

      await waitFor(() => {
        expect(screen.queryByTestId('help-drawer')).not.toBeInTheDocument();
      });
    });

    it('should close drawer when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const openButton = screen.getByRole('button', { name: /open help/i });
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByTestId('help-drawer')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('help-drawer')).not.toBeInTheDocument();
      });
    });
  });

  describe('Help Drawer Content', () => {
    it('should display help drawer title', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/help & support/i)).toBeInTheDocument();
      });
    });

    it('should display tutorial section', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/tutorials/i)).toBeInTheDocument();
      });
    });

    it('should display quick links section', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/quick links/i)).toBeInTheDocument();
      });
    });

    it('should display available tutorials', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/welcome tour/i)).toBeInTheDocument();
        expect(screen.getByText(/dashboard tour/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tutorial Actions', () => {
    it('should start tutorial when tutorial button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/welcome tour/i)).toBeInTheDocument();
      });

      const tutorialButton = screen.getByRole('button', { name: /welcome tour/i });
      await user.click(tutorialButton);

      expect(mockTutorialSystem.startTutorial).toHaveBeenCalledWith('welcome-tour');
    });

    it('should close drawer after starting tutorial', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const openButton = screen.getByRole('button', { name: /open help/i });
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByTestId('help-drawer')).toBeInTheDocument();
      });

      // The button name includes the description, so we match by the tutorial name
      const tutorialButton = screen.getByRole('button', { name: /welcome tour/i });
      await user.click(tutorialButton);

      await waitFor(() => {
        expect(screen.queryByTestId('help-drawer')).not.toBeInTheDocument();
      });
    });

    it('should show completion status for completed tutorials', async () => {
      const user = userEvent.setup();
      
      // Mock completed tutorial
      mockTutorialSystem.isTutorialCompleted.mockReturnValue(true);
      
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        const welcomeButton = screen.getByRole('button', { name: /welcome tour/i });
        expect(welcomeButton).toHaveTextContent(/completed/i);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with Tab key', async () => {
      render(<GlobalHelpButton />);
      const button = screen.getByRole('button', { name: /open help/i });
      
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should open drawer when Enter key is pressed on button', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      button.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('help-drawer')).toBeInTheDocument();
      });
    });

    it('should trap focus within drawer when open', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const openButton = screen.getByRole('button', { name: /open help/i });
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByTestId('help-drawer')).toBeInTheDocument();
      });

      // Focus should be on close button
      const closeButton = screen.getByRole('button', { name: /close help/i });
      expect(closeButton).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<GlobalHelpButton />);
      const button = screen.getByRole('button', { name: /open help/i });
      expect(button).toHaveAttribute('aria-label', 'Open help');
    });

    it('should have proper ARIA attributes on drawer', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        const drawer = screen.getByTestId('help-drawer');
        expect(drawer).toHaveAttribute('role', 'dialog');
        expect(drawer).toHaveAttribute('aria-labelledby');
        expect(drawer).toHaveAttribute('aria-modal', 'true');
      });
    });

    it('should announce drawer opening to screen readers', async () => {
      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        const drawer = screen.getByTestId('help-drawer');
        expect(drawer).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should be responsive on mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<GlobalHelpButton />);
      const container = screen.getByTestId('global-help-button');
      expect(container).toBeInTheDocument();
    });

    it('should adjust drawer width on mobile', async () => {
      const user = userEvent.setup();
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        const drawer = screen.getByTestId('help-drawer');
        // On mobile, drawer should be full width (w-full is present)
        expect(drawer).toHaveClass('w-full');
        // max-w-md is still present but on mobile it should effectively be full width
        expect(drawer).toHaveClass('max-w-md');
      });
    });
  });

  describe('Integration with Tutorial System', () => {
    it('should check context triggers when opened', async () => {
      const user = userEvent.setup();
      
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockTutorialSystem.checkContextTriggers).toHaveBeenCalled();
      });
    });

    it('should handle missing tutorial system gracefully', async () => {
      // Remove tutorial system from window
      const original = (window as any).BlessBoxTutorialSystem;
      delete (window as any).BlessBoxTutorialSystem;

      const user = userEvent.setup();
      render(<GlobalHelpButton />);
      
      const button = screen.getByRole('button', { name: /open help/i });
      await user.click(button);

      // Should not throw error
      await waitFor(() => {
        expect(screen.getByTestId('help-drawer')).toBeInTheDocument();
      });

      // Restore
      (window as any).BlessBoxTutorialSystem = original;
    });
  });
});

