'use client';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useEffect, useState } from 'react';

export type TutorialStep = {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
  };
};

export type Tutorial = {
  id: string;
  name: string;
  steps: TutorialStep[];
};

export function useTutorial() {
  const [hasSeenTutorial, setHasSeenTutorial] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load tutorial state from localStorage
    const saved = localStorage.getItem('blessbox-tutorials');
    if (saved) {
      try {
        setHasSeenTutorial(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load tutorial state', e);
      }
    }
  }, []);

  const startTutorial = (tutorial: Tutorial) => {
    const driverObj = driver({
      showProgress: true,
      steps: tutorial.steps.map((step, index) => ({
        element: step.element,
        popover: {
          title: step.popover.title,
          description: step.popover.description,
          side: step.popover.side || 'bottom',
          align: step.popover.align || 'start',
        },
      })),
      onDestroyStarted: () => {
        // Mark tutorial as seen
        const newState = { ...hasSeenTutorial, [tutorial.id]: true };
        setHasSeenTutorial(newState);
        localStorage.setItem('blessbox-tutorials', JSON.stringify(newState));
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  const resetTutorial = (tutorialId: string) => {
    const newState = { ...hasSeenTutorial, [tutorialId]: false };
    setHasSeenTutorial(newState);
    localStorage.setItem('blessbox-tutorials', JSON.stringify(newState));
  };

  const resetAllTutorials = () => {
    setHasSeenTutorial({});
    localStorage.removeItem('blessbox-tutorials');
  };

  return {
    startTutorial,
    hasSeenTutorial,
    resetTutorial,
    resetAllTutorials,
  };
}
