/**
 * BlessBox Tutorial System Integration
 * Loads and initializes both tutorial engines
 */

// Load tutorial engines
import './tutorial-engine';
import './context-aware-engine';
import { initializeTutorials, trackUserAction } from './tutorial-definitions';

// Initialize everything
initializeTutorials();

// Export for external use
if (typeof window !== 'undefined') {
  (window as any).BlessBoxTutorialSystem = {
    // Tutorial management
    startTutorial: (id: string) => {
      if ((window as any).blessboxTutorials) {
        (window as any).blessboxTutorials.startTutorial(id);
      }
    },
    
    // Context tracking
    trackAction: trackUserAction,
    
    // Manual trigger checking
    checkContextTriggers: () => {
      if ((window as any).contextTutorials) {
        (window as any).contextTutorials.checkConditions();
      }
    },
    
    // Tutorial completion
    markTutorialCompleted: (id: string, version: number = 1) => {
      if ((window as any).blessboxTutorials) {
        (window as any).blessboxTutorials.markTutorialCompleted(id, version);
      }
    },
    
    // Reset tutorials
    resetTutorial: (id: string) => {
      if ((window as any).blessboxTutorials) {
        (window as any).blessboxTutorials.resetTutorial(id);
      }
    },
    
    // Get tutorial status
    isTutorialCompleted: (id: string, version: number = 1) => {
      if ((window as any).blessboxTutorials) {
        return (window as any).blessboxTutorials.isTutorialCompleted(id, version);
      }
      return false;
    }
  };
}

console.log('[BlessBox Tutorials] Tutorial system loaded and initialized');


