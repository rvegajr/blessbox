// src/interfaces/Tutorial.interface.ts
export interface TutorialStep {
  element: string; // CSS selector
  popover: {
    title: string;
    description: string;
    side: 'top' | 'bottom' | 'left' | 'right';
  };
  action?: {
    type: 'click' | 'type' | 'wait';
    value?: string;
  };
}

export interface Tutorial {
  id: string;
  version: number;
  title: string;
  description: string;
  steps: TutorialStep[];
  autoStart?: boolean;
  dismissible?: boolean;
}

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  tutorialId: string | null;
}

export interface TutorialManager {
  startTutorial(tutorialId: string, force?: boolean): Promise<void>;
  stopTutorial(): void;
  nextStep(): void;
  previousStep(): void;
  skipTutorial(): void;
  resetTutorial(tutorialId: string): void;
  getState(): TutorialState;
  isTutorialCompleted(tutorialId: string): boolean;
  markTutorialCompleted(tutorialId: string): void;
}

export interface TutorialStorage {
  saveCompletion(tutorialId: string, version: number): void;
  loadCompletion(tutorialId: string): { completed: boolean; version: number } | null;
  clearCompletion(tutorialId: string): void;
  clearAll(): void;
}
