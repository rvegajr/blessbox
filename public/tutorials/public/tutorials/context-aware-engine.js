/**
 * BlessBox Context-Aware Tutorial System
 * Responds to user behavior and application state
 * Pure vanilla JavaScript/TypeScript - zero framework dependencies
 */
/**
 * Context-Aware Tutorial System
 * Responds to user behavior and application state
 */
export class ContextAwareTutorials {
    constructor() {
        this.triggers = [];
        this.storageKey = 'blessbox_context_tutorials';
        this.initialized = false;
        this.eventBus = new EventTarget();
        this.init();
    }
    /**
     * Initialize the system
     */
    init() {
        if (this.initialized)
            return;
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
    registerTrigger(config) {
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
    checkConditions() {
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
    shouldCheckTrigger(trigger) {
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
    executeTrigger(trigger) {
        console.log(`[Context Tutorial] Triggering: ${trigger.name}`);
        // Update trigger data
        this.updateTriggerData(trigger.id);
        // Show the tutorial
        if (window.blessboxTutorials) {
            window.blessboxTutorials.startTutorial(trigger.tutorial);
        }
        // Emit event
        this.eventBus.dispatchEvent(new CustomEvent('tutorialTriggered', {
            detail: { trigger }
        }));
    }
    /**
     * Get trigger execution data
     */
    getTriggerData(triggerId) {
        const data = this.getStorageData();
        return data[triggerId] || { showCount: 0, lastShown: null };
    }
    /**
     * Update trigger execution data
     */
    updateTriggerData(triggerId) {
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
    getLocalStorage() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ls = typeof localStorage !== 'undefined' ? localStorage : globalThis.localStorage;
        return ls || null;
    }
    /**
     * Get storage data
     */
    getStorageData() {
        const storage = this.getLocalStorage();
        if (!storage)
            return {};
        try {
            const data = storage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        }
        catch (e) {
            console.error('Error reading context tutorial data:', e);
            return {};
        }
    }
    /**
     * Attach event listeners for user actions
     */
    attachEventListeners() {
        if (typeof document === 'undefined')
            return;
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
            const customEvent = e;
            this.trackEvent(customEvent.detail.type, customEvent.detail.data);
        });
    }
    /**
     * Observe DOM for changes
     */
    observeDOM() {
        if (typeof window === 'undefined' || typeof document === 'undefined')
            return;
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
    startConditionChecker() {
        if (typeof window === 'undefined')
            return;
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
    trackEvent(type, data) {
        this.eventBus.dispatchEvent(new CustomEvent('userAction', {
            detail: { type, data, timestamp: Date.now() }
        }));
    }
    /**
     * Track user actions in localStorage
     */
    trackUserActions() {
        const actionsKey = 'blessbox_user_actions';
        this.eventBus.addEventListener('userAction', (e) => {
            const customEvent = e;
            try {
                const storage = this.getLocalStorage();
                if (!storage)
                    return;
                const actions = JSON.parse(storage.getItem(actionsKey) || '[]');
                actions.push(customEvent.detail);
                // Keep only last 100 actions
                if (actions.length > 100) {
                    actions.shift();
                }
                storage.setItem(actionsKey, JSON.stringify(actions));
            }
            catch (e) {
                console.error('Error tracking action:', e);
            }
        });
    }
    /**
     * Helper: Get user action count by type
     */
    getUserActionCount(actionType, withinHours = null) {
        const actionsKey = 'blessbox_user_actions';
        const storage = this.getLocalStorage();
        if (!storage)
            return 0;
        try {
            const actions = JSON.parse(storage.getItem(actionsKey) || '[]');
            let filtered = actions.filter((a) => a.type === actionType);
            if (withinHours) {
                const cutoff = Date.now() - (withinHours * 60 * 60 * 1000);
                filtered = filtered.filter((a) => a.timestamp > cutoff);
            }
            return filtered.length;
        }
        catch (e) {
            return 0;
        }
    }
    /**
     * Helper: Check if element exists in DOM
     */
    elementExists(selector) {
        if (typeof document === 'undefined')
            return false;
        return document.querySelector(selector) !== null;
    }
    /**
     * Helper: Get element count
     */
    getElementCount(selector) {
        if (typeof document === 'undefined')
            return 0;
        return document.querySelectorAll(selector).length;
    }
}
// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    // Expose class globally
    window.ContextAwareTutorials = ContextAwareTutorials;
    // Auto-create instance
    window.contextTutorials = new ContextAwareTutorials();
}
