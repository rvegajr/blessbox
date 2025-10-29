// src/components/onboarding/OnboardingWizard.tsx
'use client';

import React from 'react';
import { WizardStepper } from './WizardStepper';
import { WizardNavigation } from './WizardNavigation';
import type { OnboardingWizardProps } from '@/interfaces/OnboardingWizard.interface';

export function OnboardingWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onSkip,
  className = '',
  'data-testid': testId = 'onboarding-wizard',
}: OnboardingWizardProps) {
  // Handle edge cases
  if (steps.length === 0) {
    return (
      <div
        className={`onboarding-wizard ${className}`.trim()}
        data-testid={testId}
        role="region"
        aria-label="Onboarding Wizard"
      >
        <div className="text-center text-gray-500">No steps available</div>
      </div>
    );
  }

  if (currentStep < 0 || currentStep >= steps.length) {
    return (
      <div
        className={`onboarding-wizard ${className}`.trim()}
        data-testid={testId}
        role="region"
        aria-label="Onboarding Wizard"
      >
        <div className="text-center text-gray-500">Step not found</div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const canGoNext = currentStep < steps.length - 1;
  const canGoPrevious = currentStep > 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleStepClick = (stepIndex: number) => {
    // Only allow navigation to completed steps or current step
    if (stepIndex <= currentStep || steps[stepIndex].isCompleted) {
      onStepChange(stepIndex);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div
      className={`onboarding-wizard ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label="Onboarding Wizard"
    >
      {/* Header */}
      <div className="wizard-header mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {currentStepData.title}
        </h1>
        {currentStepData.description && (
          <p className="text-gray-600">{currentStepData.description}</p>
        )}
      </div>

      {/* Stepper */}
      <WizardStepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        data-testid="wizard-stepper"
      />

      {/* Content */}
      <div className="wizard-content my-8">
        {currentStepData.component}
      </div>

      {/* Navigation */}
      <WizardNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isLastStep={isLastStep}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onComplete={onComplete}
        onSkip={onSkip}
        data-testid="wizard-navigation"
      />
    </div>
  );
}
