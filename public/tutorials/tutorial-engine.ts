/**
 * BlessBox Tutorial System - Context-Independent
 * Pure vanilla JavaScript/TypeScript - zero framework dependencies
 * Can be easily removed by deleting script tag
 */

export interface TutorialStep {
  element: string; // CSS selector
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
}

export interface Tutorial {
  id: string;
  version: number;
  title: string;
  description?: string;
  autoStart?: boolean;
  dismissible?: boolean;
  steps: TutorialStep[];
}

export interface TutorialCompletionData {
  completed: boolean;
  version: number;
  completedAt: string;
}

export interface BlessBoxTutorialsOptions {
  debug?: boolean;
  storageKey?: string;
}

/**
 * BlessBox Tutorial System
 * Manages context-independent tutorials
 */
export class BlessBoxTutorials {
  public tutorials: Record<string, Tutorial> = {};
  public currentTutorial: Tutorial | null = null;
  public storageKey: string;
  public debug: boolean;
  private initialized = false;

  constructor(options: BlessBoxTutorialsOptions = {}) {
    this.storageKey = options.storageKey || 'blessbox_tutorials';
    this.debug = options.debug || false;
    
    // Initialize on DOM ready
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        // DOM already loaded
        setTimeout(() => this.init(), 0);
      }
    }
  }

  /**
   * Initialize the tutorial system
   */
  public init(): void {
    if (this.initialized) return;
    this.initialized = true;
    
    this.log('Tutorial system initialized');
    
    // Listen for custom events to start tutorials
    if (typeof document !== 'undefined') {
      document.addEventListener('startTutorial', (e: Event) => {
        const customEvent = e as CustomEvent;
        this.startTutorial(customEvent.detail.tutorialId);
      });

      // Listen for page changes (for SPA navigation)
      this.observePageChanges();
      
      // Auto-start tutorials if configured
      this.checkAutoStart();
    }
  }

  /**
   * Register a tutorial
   */
  public registerTutorial(id: string, config: Partial<Tutorial>): void {
    this.tutorials[id] = {
      id,
      version: config.version || 1,
      title: config.title || '',
      description: config.description,
      autoStart: config.autoStart || false,
      dismissible: config.dismissible !== false,
      steps: config.steps || []
    };
    
    this.log(`Tutorial registered: ${id}`);
  }

  /**
   * Start a tutorial by ID
   */
  public startTutorial(tutorialId: string, force = false): void {
    const tutorial = this.tutorials[tutorialId];
    
    if (!tutorial) {
      console.error(`Tutorial not found: ${tutorialId}`);
      return;
    }

    // Check if user has completed this version
    if (!force && this.isTutorialCompleted(tutorialId, tutorial.version)) {
      this.log(`Tutorial already completed: ${tutorialId}`);
      return;
    }

    // Validate all target elements exist
    const missingElements = this.validateSteps(tutorial.steps);
    if (missingElements.length > 0) {
      console.warn(`Tutorial ${tutorialId} cannot start - missing elements:`, missingElements);
      return;
    }

    // Run the tutorial
    this.runWithDriver(tutorial);
  }

  /**
   * Run tutorial using Driver.js (to be implemented when Driver.js is loaded)
   */
  public runWithDriver(tutorial: Tutorial): void {
    // This method will be called when tutorial starts
    // Implementation will use Driver.js when available
    this.currentTutorial = tutorial;
    this.log(`Starting tutorial: ${tutorial.id}`);
    
    // Actual Driver.js integration will be added later
    // For now, just set the current tutorial
  }

  /**
   * Validate that all step elements exist in DOM
   */
  public validateSteps(steps: TutorialStep[]): string[] {
    const missing: string[] = [];
    
    if (typeof document === 'undefined') return missing;
    
    steps.forEach(step => {
      const element = document.querySelector(step.element);
      if (!element) {
        missing.push(step.element);
      }
    });
    
    return missing;
  }

  /**
   * Check if tutorial has been completed
   */
  public isTutorialCompleted(tutorialId: string, version: number): boolean {
    const data = this.getStorageData();
    return data[tutorialId]?.version === version && data[tutorialId]?.completed === true;
  }

  /**
   * Get localStorage instance (works in both browser and test environments)
   */
  private getLocalStorage(): Storage | null {
    // Direct reference to localStorage (works in both environments)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ls = typeof localStorage !== 'undefined' ? localStorage : (globalThis as any).localStorage;
    return ls || null;
  }

  /**
   * Mark tutorial as completed
   */
  public markTutorialCompleted(tutorialId: string, version: number): void {
    const storage = this.getLocalStorage();
    if (!storage) return;
    
    const data = this.getStorageData();
    data[tutorialId] = {
      completed: true,
      version: version,
      completedAt: new Date().toISOString()
    };
    
    storage.setItem(this.storageKey, JSON.stringify(data));
  }

  /**
   * Reset a specific tutorial
   */
  public resetTutorial(tutorialId: string): void {
    const storage = this.getLocalStorage();
    if (!storage) return;
    
    const data = this.getStorageData();
    delete data[tutorialId];
    
    storage.setItem(this.storageKey, JSON.stringify(data));
    
    this.log(`Tutorial reset: ${tutorialId}`);
  }

  /**
   * Reset all tutorials
   */
  public resetAllTutorials(): void {
    const storage = this.getLocalStorage();
    if (!storage) return;
    
    storage.removeItem(this.storageKey);
    this.log('All tutorials reset');
  }

  /**
   * Get storage data
   */
  public getStorageData(): Record<string, TutorialCompletionData> {
    const storage = this.getLocalStorage();
    if (!storage) return {};
    
    try {
      const data = storage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading tutorial data:', e);
      return {};
    }
  }

  /**
   * Check for auto-start tutorials
   */
  private checkAutoStart(): void {
    // Wait a bit for page to fully render
    setTimeout(() => {
      Object.values(this.tutorials).forEach(tutorial => {
        if (tutorial.autoStart && !this.isTutorialCompleted(tutorial.id, tutorial.version)) {
          this.startTutorial(tutorial.id);
        }
      });
    }, 1000);
  }

  /**
   * Observe page changes for SPA navigation
   */
  private observePageChanges(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    let lastUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.log('Page changed:', currentUrl);
        this.checkAutoStart();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Debug logger
   */
  public log(...args: any[]): void {
    if (this.debug) {
      console.log('[BlessBox Tutorials]', ...args);
    }
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Expose class globally
  (window as any).BlessBoxTutorials = BlessBoxTutorials;
  
  // Auto-create instance
  (window as any).blessboxTutorials = new BlessBoxTutorials({
    debug: window.location.hostname === 'localhost'
  });
}

