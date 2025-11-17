"use strict";
/**
 * BlessBox Tutorial System - Context-Independent
 * Pure vanilla JavaScript/TypeScript - zero framework dependencies
 * Can be easily removed by deleting script tag
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlessBoxTutorials = void 0;
/**
 * BlessBox Tutorial System
 * Manages context-independent tutorials
 */
class BlessBoxTutorials {
    constructor(options = {}) {
        this.tutorials = {};
        this.currentTutorial = null;
        this.initialized = false;
        this.storageKey = options.storageKey || 'blessbox_tutorials';
        this.debug = options.debug || false;
        // Initialize on DOM ready
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            }
            else {
                // DOM already loaded
                setTimeout(() => this.init(), 0);
            }
        }
    }
    /**
     * Initialize the tutorial system
     */
    init() {
        if (this.initialized)
            return;
        this.initialized = true;
        this.log('Tutorial system initialized');
        // Listen for custom events to start tutorials
        if (typeof document !== 'undefined') {
            document.addEventListener('startTutorial', (e) => {
                const customEvent = e;
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
    registerTutorial(id, config) {
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
    startTutorial(tutorialId, force = false) {
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
    runWithDriver(tutorial) {
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
    validateSteps(steps) {
        const missing = [];
        if (typeof document === 'undefined')
            return missing;
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
    isTutorialCompleted(tutorialId, version) {
        var _a, _b;
        const data = this.getStorageData();
        return ((_a = data[tutorialId]) === null || _a === void 0 ? void 0 : _a.version) === version && ((_b = data[tutorialId]) === null || _b === void 0 ? void 0 : _b.completed) === true;
    }
    /**
     * Get localStorage instance (works in both browser and test environments)
     */
    getLocalStorage() {
        // Direct reference to localStorage (works in both environments)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ls = typeof localStorage !== 'undefined' ? localStorage : globalThis.localStorage;
        return ls || null;
    }
    /**
     * Mark tutorial as completed
     */
    markTutorialCompleted(tutorialId, version) {
        const storage = this.getLocalStorage();
        if (!storage)
            return;
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
    resetTutorial(tutorialId) {
        const storage = this.getLocalStorage();
        if (!storage)
            return;
        const data = this.getStorageData();
        delete data[tutorialId];
        storage.setItem(this.storageKey, JSON.stringify(data));
        this.log(`Tutorial reset: ${tutorialId}`);
    }
    /**
     * Reset all tutorials
     */
    resetAllTutorials() {
        const storage = this.getLocalStorage();
        if (!storage)
            return;
        storage.removeItem(this.storageKey);
        this.log('All tutorials reset');
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
            console.error('Error reading tutorial data:', e);
            return {};
        }
    }
    /**
     * Check for auto-start tutorials
     */
    checkAutoStart() {
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
    observePageChanges() {
        if (typeof window === 'undefined' || typeof document === 'undefined')
            return;
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
    log(...args) {
        if (this.debug) {
            console.log('[BlessBox Tutorials]', ...args);
        }
    }
}
exports.BlessBoxTutorials = BlessBoxTutorials;
// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    // Expose class globally
    window.BlessBoxTutorials = BlessBoxTutorials;
    // Auto-create instance
    window.blessboxTutorials = new BlessBoxTutorials({
        debug: window.location.hostname === 'localhost'
    });
}
