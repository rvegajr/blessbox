// src/tests/components/WizardNavigation.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import { WizardNavigation } from '@/components/onboarding/WizardNavigation';
import type { WizardNavigationProps } from '@/interfaces/OnboardingWizard.interface';

describe('WizardNavigation Component', () => {
  const mockProps: WizardNavigationProps = {
    currentStep: 1,
    totalSteps: 4,
    canGoNext: true,
    canGoPrevious: true,
    isLastStep: false,
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onComplete: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<WizardNavigation {...mockProps} />);
      
      expect(screen.getByTestId('wizard-navigation')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<WizardNavigation {...mockProps} className="custom-navigation" />);
      
      const navigation = screen.getByTestId('wizard-navigation');
      expect(navigation).toHaveClass('custom-navigation');
    });

    it('should render with custom test id', () => {
      render(<WizardNavigation {...mockProps} data-testid="custom-navigation" />);
      
      expect(screen.getByTestId('custom-navigation')).toBeInTheDocument();
    });

    it('should show step progress', () => {
      render(<WizardNavigation {...mockProps} />);
      
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should disable Previous button when canGoPrevious is false', () => {
      render(<WizardNavigation {...mockProps} canGoPrevious={false} />);
      
      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    it('should disable Next button when canGoNext is false', () => {
      render(<WizardNavigation {...mockProps} canGoNext={false} />);
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('should show Complete button on last step', () => {
      render(<WizardNavigation {...mockProps} isLastStep={true} />);
      
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should show Skip button when available', () => {
      render(<WizardNavigation {...mockProps} />);
      
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onPrevious when Previous button is clicked', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);
      
      expect(mockProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Next button is clicked', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(mockProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('should call onComplete when Complete button is clicked', () => {
      render(<WizardNavigation {...mockProps} isLastStep={true} />);
      
      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);
      
      expect(mockProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onSkip when Skip button is clicked', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const skipButton = screen.getByText('Skip');
      fireEvent.click(skipButton);
      
      expect(mockProps.onSkip).toHaveBeenCalledTimes(1);
    });

    it('should not call handlers when buttons are disabled', () => {
      render(<WizardNavigation {...mockProps} canGoPrevious={false} canGoNext={false} />);
      
      const prevButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');
      
      fireEvent.click(prevButton);
      fireEvent.click(nextButton);
      
      expect(mockProps.onPrevious).not.toHaveBeenCalled();
      expect(mockProps.onNext).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Enter key on buttons', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const nextButton = screen.getByText('Next');
      fireEvent.keyDown(nextButton, { key: 'Enter' });
      
      expect(mockProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('should support Space key on buttons', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const prevButton = screen.getByText('Previous');
      fireEvent.keyDown(prevButton, { key: ' ' });
      
      expect(mockProps.onPrevious).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const navigation = screen.getByTestId('wizard-navigation');
      expect(navigation).toHaveAttribute('role', 'navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Wizard Navigation');
    });

    it('should have proper button labels', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const prevButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');
      
      expect(prevButton).toHaveAttribute('aria-label', 'Go to previous step');
      expect(nextButton).toHaveAttribute('aria-label', 'Go to next step');
    });

    it('should have proper Complete button label', () => {
      render(<WizardNavigation {...mockProps} isLastStep={true} />);
      
      const completeButton = screen.getByText('Complete');
      expect(completeButton).toHaveAttribute('aria-label', 'Complete onboarding');
    });

    it('should have proper Skip button label', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const skipButton = screen.getByText('Skip');
      expect(skipButton).toHaveAttribute('aria-label', 'Skip this step');
    });
  });

  describe('Step Progress', () => {
    it('should show correct step numbers', () => {
      render(<WizardNavigation {...mockProps} currentStep={2} totalSteps={5} />);
      
      expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
    });

    it('should handle step 1 correctly', () => {
      render(<WizardNavigation {...mockProps} currentStep={0} />);
      
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    });

    it('should handle last step correctly', () => {
      render(<WizardNavigation {...mockProps} currentStep={3} totalSteps={4} isLastStep={true} />);
      
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle currentStep 0', () => {
      render(<WizardNavigation {...mockProps} currentStep={0} canGoPrevious={false} />);
      
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeDisabled();
    });

    it('should handle totalSteps 1', () => {
      render(<WizardNavigation {...mockProps} totalSteps={1} currentStep={0} isLastStep={true} />);
      
      expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should handle currentStep equal to totalSteps', () => {
      render(<WizardNavigation {...mockProps} currentStep={4} totalSteps={4} isLastStep={true} />);
      
      expect(screen.getByText('Step 5 of 4')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should show loading state on buttons', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toHaveClass('loading');
    });

    it('should show primary styling on Complete button', () => {
      render(<WizardNavigation {...mockProps} isLastStep={true} />);
      
      const completeButton = screen.getByText('Complete');
      expect(completeButton).toHaveClass('primary');
    });

    it('should show secondary styling on Skip button', () => {
      render(<WizardNavigation {...mockProps} />);
      
      const skipButton = screen.getByText('Skip');
      expect(skipButton).toHaveClass('secondary');
    });
  });
});


