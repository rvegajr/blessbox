// src/components/ui/TutorialManager.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Tutorial, TutorialState, TutorialManager as ITutorialManager } from '@/interfaces/Tutorial.interface';

interface TutorialManagerProps {
  tutorials: Tutorial[];
  onTutorialComplete?: (tutorialId: string) => void;
  onTutorialSkip?: (tutorialId: string) => void;
  className?: string;
  'data-testid'?: string;
}

interface TutorialStorage {
  saveCompletion: (tutorialId: string, version: number) => void;
  loadCompletion: (tutorialId: string) => { completed: boolean; version: number } | null;
  clearCompletion: (tutorialId: string) => void;
  clearAll: () => void;
}

const createTutorialStorage = (): TutorialStorage => ({
  saveCompletion: (tutorialId: string, version: number) => {
    localStorage.setItem(`tutorial-${tutorialId}`, JSON.stringify({ completed: true, version }));
  },
  loadCompletion: (tutorialId: string) => {
    const data = localStorage.getItem(`tutorial-${tutorialId}`);
    return data ? JSON.parse(data) : null;
  },
  clearCompletion: (tutorialId: string) => {
    localStorage.removeItem(`tutorial-${tutorialId}`);
  },
  clearAll: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('tutorial-')) {
        localStorage.removeItem(key);
      }
    });
  },
});

export function TutorialManager({
  tutorials,
  onTutorialComplete,
  onTutorialSkip,
  className = '',
  'data-testid': testId = 'tutorial-manager',
}: TutorialManagerProps) {
  const [state, setState] = useState<TutorialState>({
    isActive: false,
    currentStep: 0,
    totalSteps: 0,
    tutorialId: null,
  });

  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const storage = useRef<TutorialStorage>(createTutorialStorage());
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-start tutorials
  useEffect(() => {
    const autoStartTutorial = tutorials.find(tutorial => 
      tutorial.autoStart && !isTutorialCompleted(tutorial.id)
    );
    
    if (autoStartTutorial) {
      startTutorial(autoStartTutorial.id);
    }
  }, [tutorials]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.isActive) return;

      switch (event.key) {
        case 'Escape':
          if (currentTutorial?.dismissible !== false) {
            stopTutorial();
          }
          break;
        case 'ArrowRight':
        case 'Enter':
          if (state.currentStep < state.totalSteps - 1) {
            nextStep();
          } else {
            completeTutorial();
          }
          break;
        case 'ArrowLeft':
          if (state.currentStep > 0) {
            previousStep();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state, currentTutorial]);

  const isTutorialCompleted = useCallback((tutorialId: string): boolean => {
    const data = localStorage.getItem(`tutorial-${tutorialId}`);
    const completion = data ? JSON.parse(data) : null;
    return completion?.completed === true;
  }, []);

  const startTutorial = useCallback((tutorialId: string, force = false) => {
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return;

    // Check if tutorial is already completed and not forced
    if (!force && isTutorialCompleted(tutorialId)) {
      return;
    }

    // Check if target elements exist
    const hasValidElements = tutorial.steps.every(step => {
      const element = document.querySelector(step.element);
      return element !== null;
    });

    if (!hasValidElements) {
      return;
    }

    setCurrentTutorial(tutorial);
    setState({
      isActive: true,
      currentStep: 0,
      totalSteps: tutorial.steps.length,
      tutorialId: tutorialId,
    });
  }, [tutorials, isTutorialCompleted]);

  const stopTutorial = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
    setCurrentTutorial(null);
  }, []);

  const nextStep = useCallback(() => {
    if (state.currentStep < state.totalSteps - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }, [state.currentStep, state.totalSteps]);

  const previousStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [state.currentStep]);

  const skipTutorial = useCallback(() => {
    if (currentTutorial) {
      onTutorialSkip?.(currentTutorial.id);
    }
    stopTutorial();
  }, [currentTutorial, onTutorialSkip, stopTutorial]);

  const completeTutorial = useCallback(() => {
    if (currentTutorial) {
      console.log('Completing tutorial:', currentTutorial.id, currentTutorial.version);
      // Direct localStorage call to ensure it works
      localStorage.setItem(`tutorial-${currentTutorial.id}`, JSON.stringify({ completed: true, version: currentTutorial.version }));
      onTutorialComplete?.(currentTutorial.id);
    }
    stopTutorial();
  }, [currentTutorial, onTutorialComplete, stopTutorial]);

  const resetTutorial = useCallback((tutorialId: string) => {
    storage.current.clearCompletion(tutorialId);
  }, []);

  const getCurrentStepElement = () => {
    if (!currentTutorial || state.currentStep >= currentTutorial.steps.length) {
      return null;
    }

    const step = currentTutorial.steps[state.currentStep];
    return document.querySelector(step.element);
  };

  const getStepPosition = () => {
    const element = getCurrentStepElement();
    if (!element) return { top: 0, left: 0 };

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    };
  };

  const handleStartClick = () => {
    const firstTutorial = tutorials[0];
    if (firstTutorial) {
      startTutorial(firstTutorial.id);
    }
  };

  if (!state.isActive || !currentTutorial) {
    return (
      <div
        className={`tutorial-manager ${className}`.trim()}
        data-testid={testId}
        onClick={handleStartClick}
      >
        {/* Hidden trigger for testing */}
      </div>
    );
  }

  const currentStep = currentTutorial.steps[state.currentStep];
  const isLastStep = state.currentStep === state.totalSteps - 1;
  const isFirstStep = state.currentStep === 0;

  return (
    <>
      {/* Tutorial Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black bg-opacity-50"
        data-testid="tutorial-overlay"
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-label={`Tutorial: ${currentTutorial.title}`}
      >
        {/* Highlighted Element */}
        {getCurrentStepElement() && (
          <div
            className="absolute border-2 border-blue-500 rounded-lg pointer-events-none"
            style={{
              ...getStepPosition(),
              width: getCurrentStepElement()?.getBoundingClientRect().width || 0,
              height: getCurrentStepElement()?.getBoundingClientRect().height || 0,
            }}
          />
        )}

        {/* Tutorial Popover */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentStep.popover.title}
            </h3>
            <p className="text-gray-600">
              {currentStep.popover.description}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Step {state.currentStep + 1} of {state.totalSteps}</span>
              <span>{state.currentStep + 1} of {state.totalSteps}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((state.currentStep + 1) / state.totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <div>
              {!isFirstStep && (
                <button
                  onClick={previousStep}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentTutorial.dismissible !== false && (
                <button
                  onClick={skipTutorial}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip
                </button>
              )}
              
              {isLastStep ? (
                <button
                  onClick={completeTutorial}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Complete
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
