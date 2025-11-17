// src/tests/components/WizardStepper.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import { WizardStepper } from '@/components/onboarding/WizardStepper';
import type { OnboardingStep, WizardStepperProps } from '@/interfaces/OnboardingWizard.interface';

const mockSteps: OnboardingStep[] = [
  {
    id: 'step-1',
    title: 'Organization Setup',
    description: 'Set up your organization details',
    component: <div>Step 1</div>,
    isCompleted: false,
    isOptional: false,
    canSkip: false,
  },
  {
    id: 'step-2',
    title: 'Email Verification',
    description: 'Verify your email address',
    component: <div>Step 2</div>,
    isCompleted: true,
    isOptional: false,
    canSkip: false,
  },
  {
    id: 'step-3',
    title: 'Form Builder',
    description: 'Build your registration form',
    component: <div>Step 3</div>,
    isCompleted: false,
    isOptional: true,
    canSkip: true,
  },
];

describe('WizardStepper Component', () => {
  const mockProps: WizardStepperProps = {
    steps: mockSteps,
    currentStep: 0,
    onStepClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<WizardStepper {...mockProps} />);
      
      expect(screen.getByTestId('wizard-stepper')).toBeInTheDocument();
      expect(screen.getByText('Organization Setup')).toBeInTheDocument();
      expect(screen.getByText('Email Verification')).toBeInTheDocument();
      expect(screen.getByText('Form Builder')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<WizardStepper {...mockProps} className="custom-stepper" />);
      
      const stepper = screen.getByTestId('wizard-stepper');
      expect(stepper).toHaveClass('custom-stepper');
    });

    it('should render with custom test id', () => {
      render(<WizardStepper {...mockProps} data-testid="custom-stepper" />);
      
      expect(screen.getByTestId('custom-stepper')).toBeInTheDocument();
    });

    it('should render step numbers', () => {
      render(<WizardStepper {...mockProps} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render step descriptions', () => {
      render(<WizardStepper {...mockProps} />);
      
      expect(screen.getByText('Set up your organization details')).toBeInTheDocument();
      expect(screen.getByText('Verify your email address')).toBeInTheDocument();
      expect(screen.getByText('Build your registration form')).toBeInTheDocument();
    });
  });

  describe('Step States', () => {
    it('should show current step as active', () => {
      render(<WizardStepper {...mockProps} currentStep={1} />);
      
      const step2Button = screen.getByText('Email Verification');
      expect(step2Button).toHaveClass('active');
    });

    it('should show completed steps with checkmark', () => {
      render(<WizardStepper {...mockProps} />);
      
      const step2Button = screen.getByText('Email Verification');
      expect(step2Button).toHaveClass('completed');
    });

    it('should show optional steps with indicator', () => {
      render(<WizardStepper {...mockProps} />);
      
      const step3Button = screen.getByText('Form Builder');
      expect(step3Button).toHaveClass('optional');
    });

    it('should show future steps as disabled', () => {
      render(<WizardStepper {...mockProps} currentStep={0} />);
      
      const step3Button = screen.getByText('Form Builder');
      expect(step3Button).toHaveClass('disabled');
    });
  });

  describe('Interactions', () => {
    it('should call onStepClick when step is clicked', () => {
      render(<WizardStepper {...mockProps} />);
      
      const stepButton = screen.getByText('Email Verification');
      fireEvent.click(stepButton);
      
      expect(mockProps.onStepClick).toHaveBeenCalledWith(1);
    });

    it('should not call onStepClick for disabled steps', () => {
      render(<WizardStepper {...mockProps} currentStep={0} />);
      
      const step3Button = screen.getByText('Form Builder');
      fireEvent.click(step3Button);
      
      expect(mockProps.onStepClick).not.toHaveBeenCalledWith(2);
    });

    it('should support keyboard navigation', () => {
      render(<WizardStepper {...mockProps} />);
      
      const stepButton = screen.getByText('Email Verification');
      fireEvent.keyDown(stepButton, { key: 'Enter' });
      
      expect(mockProps.onStepClick).toHaveBeenCalledWith(1);
    });

    it('should support space key navigation', () => {
      render(<WizardStepper {...mockProps} />);
      
      const stepButton = screen.getByText('Email Verification');
      fireEvent.keyDown(stepButton, { key: ' ' });
      
      expect(mockProps.onStepClick).toHaveBeenCalledWith(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<WizardStepper {...mockProps} />);
      
      const stepper = screen.getByTestId('wizard-stepper');
      expect(stepper).toHaveAttribute('role', 'navigation');
      expect(stepper).toHaveAttribute('aria-label', 'Onboarding Steps');
    });

    it('should have proper step button labels', () => {
      render(<WizardStepper {...mockProps} />);
      
      const stepButton = screen.getByText('Organization Setup');
      expect(stepButton).toHaveAttribute('aria-label', 'Step 1: Organization Setup');
    });

    it('should indicate current step', () => {
      render(<WizardStepper {...mockProps} currentStep={1} />);
      
      const stepButton = screen.getByText('Email Verification');
      expect(stepButton).toHaveAttribute('aria-current', 'step');
    });

    it('should indicate completed steps', () => {
      render(<WizardStepper {...mockProps} />);
      
      const stepButton = screen.getByText('Email Verification');
      expect(stepButton).toHaveAttribute('aria-label', 'Step 2: Email Verification (Completed)');
    });
  });

  describe('Visual Indicators', () => {
    it('should show progress line between steps', () => {
      render(<WizardStepper {...mockProps} />);
      
      const progressLines = screen.getAllByTestId('progress-line');
      expect(progressLines).toHaveLength(2); // 3 steps = 2 lines
    });

    it('should show checkmark for completed steps', () => {
      render(<WizardStepper {...mockProps} />);
      
      const checkmark = screen.getByTestId('checkmark-1'); // Step 2 (index 1) is completed
      expect(checkmark).toBeInTheDocument();
    });

    it('should show optional indicator for optional steps', () => {
      render(<WizardStepper {...mockProps} />);
      
      const optionalIndicator = screen.getByTestId('optional-indicator-2'); // Step 3 (index 2) is optional
      expect(optionalIndicator).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty steps array', () => {
      render(<WizardStepper {...mockProps} steps={[]} />);
      
      expect(screen.getByTestId('wizard-stepper')).toBeInTheDocument();
      expect(screen.getByText('No steps available')).toBeInTheDocument();
    });

    it('should handle single step', () => {
      const singleStep = [mockSteps[0]];
      render(<WizardStepper {...mockProps} steps={singleStep} />);
      
      expect(screen.getByTestId('wizard-stepper')).toBeInTheDocument();
      expect(screen.getByText('Organization Setup')).toBeInTheDocument();
      expect(screen.queryByTestId('progress-line')).not.toBeInTheDocument();
    });

    it('should handle currentStep out of bounds', () => {
      render(<WizardStepper {...mockProps} currentStep={10} />);
      
      expect(screen.getByTestId('wizard-stepper')).toBeInTheDocument();
      // Should not crash and should render all steps
      expect(screen.getByText('Organization Setup')).toBeInTheDocument();
    });
  });
});


