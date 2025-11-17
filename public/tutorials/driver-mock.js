/**
 * Mock Driver.js for Testing
 * Provides a fallback when CDN is unavailable
 * Only used when real Driver.js fails to load
 */

if (typeof window !== 'undefined' && typeof window.driver === 'undefined') {
  window.driver = function(config) {
    console.log('[Mock Driver] Creating mock driver instance');
    
    const steps = config.steps || [];
    let currentStep = 0;
    let isActive = false;
    
    const mockDriver = {
      drive: function() {
        console.log(`[Mock Driver] Starting tour with ${steps.length} steps`);
        isActive = true;
        currentStep = 0;
        
        // Simulate showing first step
        if (steps.length > 0) {
          console.log(`[Mock Driver] Step 1/${steps.length}: ${steps[0].popover?.title || 'Step 1'}`);
        }
        
        // Call config callbacks
        if (config.onHighlightStarted) config.onHighlightStarted();
        
        return this;
      },
      
      moveNext: function() {
        if (currentStep < steps.length - 1) {
          currentStep++;
          console.log(`[Mock Driver] Step ${currentStep + 1}/${steps.length}: ${steps[currentStep].popover?.title || 'Step'}`);
          return this;
        }
        return this;
      },
      
      movePrevious: function() {
        if (currentStep > 0) {
          currentStep--;
          console.log(`[Mock Driver] Step ${currentStep + 1}/${steps.length}`);
          return this;
        }
        return this;
      },
      
      destroy: function() {
        console.log('[Mock Driver] Destroying tour');
        isActive = false;
        if (config.onDestroyStarted) config.onDestroyStarted();
        if (config.onDestroyed) config.onDestroyed();
        return this;
      },
      
      isLastStep: function() {
        return currentStep === steps.length - 1;
      },
      
      isFirstStep: function() {
        return currentStep === 0;
      },
      
      getActiveIndex: function() {
        return currentStep;
      },
      
      getActiveStep: function() {
        return steps[currentStep] || null;
      },
      
      isActive: function() {
        return isActive;
      }
    };
    
    return mockDriver;
  };
  
  console.log('[BlessBox] Mock Driver.js loaded as fallback');
}
