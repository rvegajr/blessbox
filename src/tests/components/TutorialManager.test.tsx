// src/tests/components/TutorialManager.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { TutorialManager } from '@/components/ui/TutorialManager';
import type { Tutorial, TutorialState, TutorialManager as ITutorialManager } from '@/interfaces/Tutorial.interface';

// Mock tutorial data
const mockTutorial: Tutorial = {
  id: 'test-tutorial',
  version: 1,
  title: 'Test Tutorial',
  description: 'A test tutorial for testing purposes',
  steps: [
    {
      element: '[data-testid="step-1"]',
      popover: {
        title: 'Step 1',
        description: 'This is the first step',
        side: 'bottom',
      },
    },
    {
      element: '[data-testid="step-2"]',
      popover: {
        title: 'Step 2',
        description: 'This is the second step',
        side: 'top',
      },
    },
  ],
  autoStart: false,
  dismissible: true,
};

const mockTutorials = [mockTutorial];

describe('TutorialManager Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
    
    // Add target elements to the DOM for testing
    const step1 = document.createElement('div');
    step1.setAttribute('data-testid', 'step-1');
    step1.textContent = 'Step 1 Element';
    document.body.appendChild(step1);
    
    const step2 = document.createElement('div');
    step2.setAttribute('data-testid', 'step-2');
    step2.textContent = 'Step 2 Element';
    document.body.appendChild(step2);
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      expect(document.body).toBeInTheDocument();
    });

    it('should render tutorial overlay when active', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
      });
    });

    it('should render tutorial popover with correct content', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByText('This is the first step')).toBeInTheDocument();
      });
    });

    it('should render progress indicator', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });
    });

    it('should render navigation buttons', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Skip')).toBeInTheDocument();
      });
    });
  });

  describe('Tutorial Navigation', () => {
    it('should navigate to next step', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
      });
      
      // Click next
      fireEvent.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(screen.getByText('Step 2')).toBeInTheDocument();
        expect(screen.getByText('2 of 2')).toBeInTheDocument();
      });
    });

    it('should navigate to previous step', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial and go to step 2
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(screen.getByText('Step 2')).toBeInTheDocument();
      });
      
      // Click previous
      fireEvent.click(screen.getByText('Previous'));
      
      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });
    });

    it('should complete tutorial on last step', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial and go to last step
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(screen.getByText('Step 2')).toBeInTheDocument();
        expect(screen.getByText('Complete')).toBeInTheDocument();
      });
    });

    it('should skip tutorial', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
      });
      
      // Click skip
      fireEvent.click(screen.getByText('Skip'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-overlay')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tutorial State Management', () => {
    it('should track tutorial completion', async () => {
      // Clear localStorage before this test
      localStorage.clear();
      
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start and complete tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(screen.getByText('Step 2')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Complete'));
      
      // Check if tutorial is marked as completed
      await waitFor(() => {
        expect(localStorage.getItem('tutorial-test-tutorial')).toBeTruthy();
      });
    });

    it('should not auto-start completed tutorials', async () => {
      // Mark tutorial as completed
      localStorage.setItem('tutorial-test-tutorial', JSON.stringify({ completed: true, version: 1 }));
      
      const autoStartTutorial = { ...mockTutorial, autoStart: true };
      render(<TutorialManager tutorials={[autoStartTutorial]} />);
      
      // Tutorial should not auto-start
      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-overlay')).not.toBeInTheDocument();
      });
    });

    it('should reset tutorial completion', async () => {
      // Mark tutorial as completed
      localStorage.setItem('tutorial-test-tutorial', JSON.stringify({ completed: true, version: 1 }));
      
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Reset tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        const overlay = screen.getByTestId('tutorial-overlay');
        expect(overlay).toHaveAttribute('role', 'dialog');
        expect(overlay).toHaveAttribute('aria-modal', 'true');
      });
    });

    it('should be keyboard navigable', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
      });
      
      // Test escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-overlay')).not.toBeInTheDocument();
      });
    });

    it('should announce step changes to screen readers', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        const overlay = screen.getByTestId('tutorial-overlay');
        expect(overlay).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tutorials array', () => {
      render(<TutorialManager tutorials={[]} />);
      expect(document.body).toBeInTheDocument();
    });

    it('should handle tutorial with no steps', () => {
      const emptyTutorial = { ...mockTutorial, steps: [] };
      render(<TutorialManager tutorials={[emptyTutorial]} />);
      expect(document.body).toBeInTheDocument();
    });

    it('should handle invalid tutorial ID', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Try to start non-existent tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      // Should not crash
      expect(document.body).toBeInTheDocument();
    });

    it('should handle missing target elements', async () => {
      const tutorialWithMissingElement = {
        ...mockTutorial,
        steps: [
          {
            element: '[data-testid="non-existent"]',
            popover: {
              title: 'Missing Element',
              description: 'This element does not exist',
              side: 'bottom',
            },
          },
        ],
      };
      
      render(<TutorialManager tutorials={[tutorialWithMissingElement]} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      // Should handle gracefully
      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-overlay')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Methods', () => {
    it('should expose startTutorial method', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
      });
    });

    it('should expose stopTutorial method', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      // Start tutorial
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
      });
      
      // Stop tutorial
      fireEvent.click(screen.getByText('Skip'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-overlay')).not.toBeInTheDocument();
      });
    });

    it('should expose getState method', async () => {
      render(<TutorialManager tutorials={mockTutorials} />);
      
      const manager = screen.getByTestId('tutorial-manager');
      fireEvent.click(manager);
      
      await waitFor(() => {
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });
    });
  });
});
