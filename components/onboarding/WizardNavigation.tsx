// src/components/onboarding/WizardNavigation.tsx
'use client';

import React from 'react';
import type { WizardNavigationProps } from '@/interfaces/OnboardingWizard.interface';

export function WizardNavigation({
  currentStep,
  totalSteps,
  canGoNext,
  canGoPrevious,
  isLastStep,
  onNext,
  onPrevious,
  onComplete,
  onSkip,
  className = '',
  'data-testid': testId = 'wizard-navigation',
}: WizardNavigationProps) {
  const handleKeyDown = (event: React.KeyboardEvent, handler: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler();
    }
  };

  return (
    <div
      className={`wizard-navigation flex items-center justify-between ${className}`.trim()}
      data-testid={testId}
      role="navigation"
      aria-label="Wizard Navigation"
    >
      {/* Left Side - Previous Button */}
      <div className="flex items-center">
        <button
          className={`
            px-4 py-2 rounded-lg border transition-colors
            ${canGoPrevious 
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500' 
              : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }
          `.trim()}
          onClick={canGoPrevious ? onPrevious : undefined}
          onKeyDown={canGoPrevious ? (e) => handleKeyDown(e, onPrevious) : undefined}
          disabled={!canGoPrevious}
          aria-label="Go to previous step"
          data-testid="btn-prev"
        >
          Previous
        </button>
      </div>

      {/* Center - Step Progress */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600" data-testid="step-progress">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Right Side - Next/Complete and Skip Buttons */}
      <div className="flex items-center gap-3">
        {/* Skip Button */}
        <button
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors focus:ring-2 focus:ring-blue-500 rounded-lg secondary"
          onClick={onSkip}
          onKeyDown={(e) => handleKeyDown(e, onSkip)}
          aria-label="Skip this step"
          data-testid="btn-skip"
        >
          Skip
        </button>

        {/* Next/Complete Button */}
        {isLastStep ? (
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors primary"
            onClick={onComplete}
            onKeyDown={(e) => handleKeyDown(e, onComplete)}
            aria-label="Complete onboarding"
            data-testid="btn-complete"
          >
            Complete
          </button>
        ) : (
          <button
            className={`
              px-6 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${canGoNext 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `.trim()}
            onClick={canGoNext ? onNext : undefined}
            onKeyDown={canGoNext ? (e) => handleKeyDown(e, onNext) : undefined}
            disabled={!canGoNext}
            aria-label="Go to next step"
            data-testid="btn-next"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
