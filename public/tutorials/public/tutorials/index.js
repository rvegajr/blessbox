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
    window.BlessBoxTutorialSystem = {
        // Tutorial management
        startTutorial: (id) => {
            if (window.blessboxTutorials) {
                window.blessboxTutorials.startTutorial(id);
            }
        },
        // Context tracking
        trackAction: trackUserAction,
        // Manual trigger checking
        checkContextTriggers: () => {
            if (window.contextTutorials) {
                window.contextTutorials.checkConditions();
            }
        },
        // Tutorial completion
        markTutorialCompleted: (id, version = 1) => {
            if (window.blessboxTutorials) {
                window.blessboxTutorials.markTutorialCompleted(id, version);
            }
        },
        // Reset tutorials
        resetTutorial: (id) => {
            if (window.blessboxTutorials) {
                window.blessboxTutorials.resetTutorial(id);
            }
        },
        // Get tutorial status
        isTutorialCompleted: (id, version = 1) => {
            if (window.blessboxTutorials) {
                return window.blessboxTutorials.isTutorialCompleted(id, version);
            }
            return false;
        }
    };
}
console.log('[BlessBox Tutorials] Tutorial system loaded and initialized');
