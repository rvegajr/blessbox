/**
 * BlessBox Tutorial System Integration
 * Loads and initializes both tutorial engines
 */

// Export unified API for external use
if (typeof window !== 'undefined') {
    window.BlessBoxTutorialSystem = {
        // Tutorial management
        startTutorial: (id) => {
            if (window.blessboxTutorials) {
                return window.blessboxTutorials.startTutorial(id, true);
            }
            return Promise.resolve(false);
        },
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
    
    console.log('[BlessBox Tutorials] Tutorial system API initialized');
}
