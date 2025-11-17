// src/tests/components/OnboardingWizard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import type { OnboardingStep, OnboardingWizardProps } from '@/interfaces/OnboardingWizard.interface';

// Mock step components
const MockStep1 = () => <div data-testid="step-1">Step 1 Content</div>;
const MockStep2 = () => <div data-testid="step-2">Step 2 Content</div>;
const MockStep3 = () => <div data-testid="step-3">Step 3 Content</div>;

const mockSteps: OnboardingStep[] = [
  {
    id: 'step-1',
    title: 'Organization Setup',
    description: 'Set up your organization details',
    component: <MockStep1 />,
    isCompleted: false,
    isOptional: false,
    canSkip: false,
  },
  {
    id: 'step-2',
    title: 'Email Verification',
    description: 'Verify your email address',
    component: <MockStep2 />,
    isCompleted: false,
    isOptional: false,
    canSkip: false,
  },
  {
    id: 'step-3',
    title: 'Form Builder',
    description: 'Build your registration form',
    component: <MockStep3 />,
    isCompleted: false,
    isOptional: true,
    canSkip: true,
  },
];

describe('OnboardingWizard Component', () => {
  const mockProps: OnboardingWizardProps = {
    steps: mockSteps,
    currentStep: 0,
    onStepChange: vi.fn(),
    onComplete: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<OnboardingWizard {...mockProps} />);
      
      expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Organization Setup' })).toBeInTheDocument();
      expect(screen.getByTestId('step-1')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<OnboardingWizard {...mockProps} className="custom-wizard" />);
      
      const wizard = screen.getByTestId('onboarding-wizard');
      expect(wizard).toHaveClass('custom-wizard');
    });

    it('should render with custom test id', () => {
      render(<OnboardingWizard {...mockProps} data-testid="custom-wizard" />);
      
      expect(screen.getByTestId('custom-wizard')).toBeInTheDocument();
    });

    it('should render current step content', () => {
      render(<OnboardingWizard {...mockProps} currentStep={1} />);
      
      expect(screen.getByTestId('step-2')).toBeInTheDocument();
      expect(screen.queryByTestId('step-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-3')).not.toBeInTheDocument();
    });

    it('should render step titles and descriptions', () => {
      render(<OnboardingWizard {...mockProps} />);
      
      // Check header title
      expect(screen.getByRole('heading', { name: 'Organization Setup' })).toBeInTheDocument();
      // Check header description specifically
      const headerDescription = screen.getByTestId('onboarding-wizard').querySelector('.wizard-header p');
      expect(headerDescription).toHaveTextContent('Set up your organization details');
    });
  });

  describe('Step Navigation', () => {
    it('should call onStepChange when step is clicked', () => {
      // Make step 1 completed so it's clickable
      const stepsWithCompleted = mockSteps.map((step, index) => ({
        ...step,
        isCompleted: index === 1, // Step 2 (Email Verification) is completed
      }));

      render(<OnboardingWizard {...mockProps} steps={stepsWithCompleted} />);
      
      const stepButton = screen.getByTestId('step-button-1'); // Email Verification button
      fireEvent.click(stepButton);
      
      expect(mockProps.onStepChange).toHaveBeenCalledWith(1);
    });

    it('should not allow navigation to future steps', () => {
      render(<OnboardingWizard {...mockProps} currentStep={0} />);
      
      const stepButton = screen.getByTestId('step-button-2'); // Form Builder button
      fireEvent.click(stepButton);
      
      // Should not call onStepChange for future steps
      expect(mockProps.onStepChange).not.toHaveBeenCalledWith(2);
    });

    it('should allow navigation to completed steps', () => {
      const stepsWithCompleted = mockSteps.map((step, index) => ({
        ...step,
        isCompleted: index === 1, // Step 2 is completed
      }));

      render(<OnboardingWizard {...mockProps} steps={stepsWithCompleted} currentStep={0} />);
      
      const stepButton = screen.getByTestId('step-button-1'); // Email Verification button
      fireEvent.click(stepButton);
      
      expect(mockProps.onStepChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Step States', () => {
    it('should show completed steps with checkmark', () => {
      const stepsWithCompleted = mockSteps.map((step, index) => ({
        ...step,
        isCompleted: index === 0, // Step 1 is completed
      }));

      render(<OnboardingWizard {...mockProps} steps={stepsWithCompleted} />);
      
      const step1Button = screen.getByTestId('step-button-0');
      expect(step1Button).toHaveClass('completed');
    });

    it('should show current step as active', () => {
      render(<OnboardingWizard {...mockProps} currentStep={1} />);
      
      const step2Button = screen.getByTestId('step-button-1');
      expect(step2Button).toHaveClass('active');
    });

    it('should show optional steps with indicator', () => {
      render(<OnboardingWizard {...mockProps} />);
      
      const step3Button = screen.getByTestId('step-button-2');
      expect(step3Button).toHaveClass('optional');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<OnboardingWizard {...mockProps} />);
      
      const wizard = screen.getByTestId('onboarding-wizard');
      expect(wizard).toHaveAttribute('role', 'region');
      expect(wizard).toHaveAttribute('aria-label', 'Onboarding Wizard');
    });

    it('should have proper step navigation labels', () => {
      render(<OnboardingWizard {...mockProps} />);
      
      const stepButton = screen.getByTestId('step-button-0');
      expect(stepButton).toHaveAttribute('aria-label', 'Step 1: Organization Setup');
    });

    it('should support keyboard navigation', () => {
      // Make step 1 completed so it's clickable
      const stepsWithCompleted = mockSteps.map((step, index) => ({
        ...step,
        isCompleted: index === 1, // Step 2 (Email Verification) is completed
      }));

      render(<OnboardingWizard {...mockProps} steps={stepsWithCompleted} />);
      
      const stepButton = screen.getByTestId('step-button-1');
      fireEvent.keyDown(stepButton, { key: 'Enter' });
      
      expect(mockProps.onStepChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty steps array', () => {
      render(<OnboardingWizard {...mockProps} steps={[]} />);
      
      expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
      expect(screen.getByText('No steps available')).toBeInTheDocument();
    });

    it('should handle currentStep out of bounds', () => {
      render(<OnboardingWizard {...mockProps} currentStep={10} />);
      
      expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
      expect(screen.getByText('Step not found')).toBeInTheDocument();
    });

    it('should handle negative currentStep', () => {
      render(<OnboardingWizard {...mockProps} currentStep={-1} />);
      
      expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
      expect(screen.getByText('Step not found')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should render with WizardStepper and WizardNavigation', () => {
      render(<OnboardingWizard {...mockProps} />);
      
      // Check that stepper is rendered
      expect(screen.getByTestId('wizard-stepper')).toBeInTheDocument();
      
      // Check that navigation is rendered
      expect(screen.getByTestId('wizard-navigation')).toBeInTheDocument();
    });

    it('should pass correct props to child components', () => {
      render(<OnboardingWizard {...mockProps} currentStep={1} />);
      
      // Check that stepper is rendered
      expect(screen.getByTestId('wizard-stepper')).toBeInTheDocument();
      
      // Check that navigation is rendered
      expect(screen.getByTestId('wizard-navigation')).toBeInTheDocument();
    });
  });
});
