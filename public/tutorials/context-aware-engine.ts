/**
 * BlessBox Context-Aware Tutorial System
 * Responds to user behavior and application state
 * Pure vanilla JavaScript/TypeScript - zero framework dependencies
 */

export interface ContextTrigger {
  id: string;
  name: string;
  condition: () => boolean;
  tutorial: string;
  priority?: number;
  cooldown?: number; // hours
  maxShows?: number;
  dismissible?: boolean;
}

export interface TriggerData {
  showCount: number;
  lastShown: number | null;
}

export interface UserAction {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * Context-Aware Tutorial System
 * Responds to user behavior and application state
 */
export class ContextAwareTutorials {
  public triggers: ContextTrigger[] = [];
  public storageKey: string = 'blessbox_context_tutorials';
  public eventBus: EventTarget;
  private initialized = false;

  constructor() {
    this.eventBus = new EventTarget();
    this.init();
  }

  /**
   * Initialize the system
   */
  public init(): void {
    if (this.initialized) return;
    this.initialized = true;
    
    // Listen for user interactions
    this.attachEventListeners();
    
    // Observe DOM changes
    this.observeDOM();
    
    // Check conditions periodically
    this.startConditionChecker();
    
    // Track user actions
    this.trackUserActions();
  }

  /**
   * Register a context-aware tutorial trigger
   */
  public registerTrigger(config: ContextTrigger): void {
    this.triggers.push({
      id: config.id,
      name: config.name,
      condition: config.condition,
      tutorial: config.tutorial,
      priority: config.priority || 0,
      cooldown: config.cooldown || 0,
      maxShows: config.maxShows || 1,
      dismissible: config.dismissible !== false
    });
  }

  /**
   * Check all trigger conditions
   */
  public checkConditions(): void {
    this.triggers
      .filter(trigger => this.shouldCheckTrigger(trigger))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .forEach(trigger => {
        if (trigger.condition()) {
          this.executeTrigger(trigger);
        }
      });
  }

  /**
   * Should we check this trigger?
   */
  private shouldCheckTrigger(trigger: ContextTrigger): boolean {
    const data = this.getTriggerData(trigger.id);
    
    // Check max shows
    if (data.showCount >= (trigger.maxShows || 1)) {
      return false;
    }
    
    // Check cooldown
    if (data.lastShown) {
      const hoursSince = (Date.now() - data.lastShown) / (1000 * 60 * 60);
      if (hoursSince < (trigger.cooldown || 0)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Execute a trigger
   */
  public executeTrigger(trigger: ContextTrigger): void {
    console.log(`[Context Tutorial] Triggering: ${trigger.name}`);
    
    // Update trigger data
    this.updateTriggerData(trigger.id);
    
    // Show the tutorial
    if ((window as any).blessboxTutorials) {
      (window as any).blessboxTutorials.startTutorial(trigger.tutorial);
    }
    
    // Emit event
    this.eventBus.dispatchEvent(new CustomEvent('tutorialTriggered', {
      detail: { trigger }
    }));
  }

  /**
   * Get trigger execution data
   */
  public getTriggerData(triggerId: string): TriggerData {
    const data = this.getStorageData();
    return data[triggerId] || { showCount: 0, lastShown: null };
  }

  /**
   * Update trigger execution data
   */
  public updateTriggerData(triggerId: string): void {
    const data = this.getStorageData();
    data[triggerId] = {
      showCount: (data[triggerId]?.showCount || 0) + 1,
      lastShown: Date.now()
    };
    
    const storage = this.getLocalStorage();
    if (storage) {
      storage.setItem(this.storageKey, JSON.stringify(data));
    }
  }

  /**
   * Get localStorage instance
   */
  private getLocalStorage(): Storage | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ls = typeof localStorage !== 'undefined' ? localStorage : (globalThis as any).localStorage;
    return ls || null;
  }

  /**
   * Get storage data
   */
  public getStorageData(): Record<string, TriggerData> {
    const storage = this.getLocalStorage();
    if (!storage) return {};
    
    try {
      const data = storage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading context tutorial data:', e);
      return {};
    }
  }

  /**
   * Attach event listeners for user actions
   */
  private attachEventListeners(): void {
    if (typeof document === 'undefined') return;
    
    // Listen for clicks
    document.addEventListener('click', (e) => {
      this.trackEvent('click', e.target);
    });
    
    // Listen for form submissions
    document.addEventListener('submit', (e) => {
      this.trackEvent('submit', e.target);
    });
    
    // Listen for custom app events
    document.addEventListener('appEvent', (e) => {
      const customEvent = e as CustomEvent;
      this.trackEvent(customEvent.detail.type, customEvent.detail.data);
    });
  }

  /**
   * Observe DOM for changes
   */
  private observeDOM(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const observer = new MutationObserver(() => {
      // Check conditions when DOM changes
      this.checkConditions();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  /**
   * Start periodic condition checker
   */
  private startConditionChecker(): void {
    if (typeof window === 'undefined') return;
    
    // Check every 30 seconds
    setInterval(() => {
      this.checkConditions();
    }, 30000);
    
    // Initial check after 5 seconds
    setTimeout(() => {
      this.checkConditions();
    }, 5000);
  }

  /**
   * Track user action
   */
  private trackEvent(type: string, data: any): void {
    this.eventBus.dispatchEvent(new CustomEvent('userAction', {
      detail: { type, data, timestamp: Date.now() }
    }));
  }

  /**
   * Track user actions in localStorage
   */
  private trackUserActions(): void {
    const actionsKey = 'blessbox_user_actions';
    
    this.eventBus.addEventListener('userAction', (e) => {
      const customEvent = e as CustomEvent;
      try {
        const storage = this.getLocalStorage();
        if (!storage) return;
        
        const actions = JSON.parse(storage.getItem(actionsKey) || '[]');
        actions.push(customEvent.detail);
        
        // Keep only last 100 actions
        if (actions.length > 100) {
          actions.shift();
        }
        
        storage.setItem(actionsKey, JSON.stringify(actions));
      } catch (e) {
        console.error('Error tracking action:', e);
      }
    });
  }

  /**
   * Helper: Get user action count by type
   */
  public getUserActionCount(actionType: string, withinHours: number | null = null): number {
    const actionsKey = 'blessbox_user_actions';
    const storage = this.getLocalStorage();
    if (!storage) return 0;
    
    try {
      const actions = JSON.parse(storage.getItem(actionsKey) || '[]');
      
      let filtered = actions.filter((a: UserAction) => a.type === actionType);
      
      if (withinHours) {
        const cutoff = Date.now() - (withinHours * 60 * 60 * 1000);
        filtered = filtered.filter((a: UserAction) => a.timestamp > cutoff);
      }
      
      return filtered.length;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Helper: Check if element exists in DOM
   */
  public elementExists(selector: string): boolean {
    if (typeof document === 'undefined') return false;
    return document.querySelector(selector) !== null;
  }

  /**
   * Helper: Get element count
   */
  public getElementCount(selector: string): number {
    if (typeof document === 'undefined') return 0;
    return document.querySelectorAll(selector).length;
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Expose class globally
  (window as any).ContextAwareTutorials = ContextAwareTutorials;
  
  // Auto-create instance
  (window as any).contextTutorials = new ContextAwareTutorials();
}


