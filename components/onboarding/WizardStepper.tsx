// src/components/onboarding/WizardStepper.tsx
'use client';

import React from 'react';
import type { WizardStepperProps } from '@/interfaces/OnboardingWizard.interface';

export function WizardStepper({
  steps,
  currentStep,
  onStepClick,
  className = '',
  'data-testid': testId = 'wizard-stepper',
}: WizardStepperProps) {
  // Handle edge cases
  if (steps.length === 0) {
    return (
      <div
        className={`wizard-stepper ${className}`.trim()}
        data-testid={testId}
        role="navigation"
        aria-label="Onboarding Steps"
      >
        <div className="text-center text-gray-500">No steps available</div>
      </div>
    );
  }

  const handleStepClick = (stepIndex: number) => {
    if (onStepClick) {
      onStepClick(stepIndex);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, stepIndex: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStepClick(stepIndex);
    }
  };

  return (
    <div
      className={`wizard-stepper ${className}`.trim()}
      data-testid={testId}
      role="navigation"
      aria-label="Onboarding Steps"
    >
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = step.isCompleted;
          const isOptional = step.isOptional;
          const isDisabled = index > currentStep && !isCompleted;
          const isClickable = index <= currentStep || isCompleted;

          return (
            <React.Fragment key={step.id}>
              {/* Step Button */}
              <div className="flex flex-col items-center">
                <button
                  className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all
                    ${isActive ? 'border-blue-500 bg-blue-500 text-white active' : ''}
                    ${isCompleted ? 'border-green-500 bg-green-500 text-white completed' : ''}
                    ${isOptional ? 'border-orange-300 bg-orange-100 text-orange-700 optional' : ''}
                    ${isDisabled ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed disabled' : ''}
                    ${isClickable && !isActive && !isCompleted ? 'border-gray-400 bg-white text-gray-600 hover:border-gray-500' : ''}
                  `.trim()}
                  onClick={() => isClickable && handleStepClick(index)}
                  onKeyDown={(e) => isClickable && handleKeyDown(e, index)}
                  aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? ' (Completed)' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                  disabled={isDisabled}
                  data-testid={`step-button-${index}`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      data-testid={`checkmark-${index}`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step Info */}
                <div className="mt-2 text-center max-w-24">
                  <div className="text-sm font-medium text-gray-900">{step.title}</div>
                  {step.description && (
                    <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                  )}
                  {isOptional && (
                    <div className="text-xs text-orange-600 mt-1" data-testid={`optional-indicator-${index}`}>
                      Optional
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    index < currentStep || (index === currentStep - 1 && steps[index].isCompleted)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                  data-testid="progress-line"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
