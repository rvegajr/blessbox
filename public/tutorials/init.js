/**
 * Tutorial System Initialization
 * This file initializes the tutorial system for use in the browser
 * It's a bridge between the vanilla JS tutorial system and Next.js
 */

// This will be loaded as a client-side script
// For now, we'll create a minimal initialization

if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  const initTutorialSystem = () => {
    // Check if tutorial system classes are available
    // If they're not, we'll create a minimal mock for now
    if (!(window as any).BlessBoxTutorials) {
      console.warn('[BlessBox] Tutorial engine not loaded. Please ensure tutorial-engine.js is loaded.');
      
      // Create a minimal mock for development
      (window as any).BlessBoxTutorialSystem = {
        startTutorial: (id: string) => {
          console.log(`[BlessBox] Tutorial "${id}" would start here`);
        },
        checkContextTriggers: () => {
          console.log('[BlessBox] Context triggers would be checked here');
        },
        isTutorialCompleted: () => false,
        markTutorialCompleted: () => {},
        resetTutorial: () => {},
      };
    }
    
    if (!(window as any).ContextAwareTutorials) {
      console.warn('[BlessBox] Context-aware engine not loaded. Please ensure context-aware-engine.js is loaded.');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTutorialSystem);
  } else {
    initTutorialSystem();
  }
}

