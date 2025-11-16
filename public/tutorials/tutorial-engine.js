/**
 * BlessBox Tutorial System - Context-Independent
 * Pure vanilla JavaScript/TypeScript - zero framework dependencies
 * Can be easily removed by deleting script tag
 */
/**
 * BlessBox Tutorial System
 * Manages context-independent tutorials
 */
export class BlessBoxTutorials {
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
        
        // Pre-load Driver.js immediately
        this.loadDriverJS().catch(err => {
            console.warn('Failed to pre-load Driver.js:', err);
        });
        
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
    async startTutorial(tutorialId, force = false) {
        const tutorial = this.tutorials[tutorialId];
        if (!tutorial) {
            console.error(`Tutorial not found: ${tutorialId}`);
            return false;
        }
        // Check if user has completed this version
        if (!force && this.isTutorialCompleted(tutorialId, tutorial.version)) {
            this.log(`Tutorial already completed: ${tutorialId}`);
            return false;
        }
        // Validate all target elements exist
        const missingElements = this.validateSteps(tutorial.steps);
        if (missingElements.length > 0) {
            console.warn(`Tutorial ${tutorialId} cannot start - missing elements:`, missingElements);
            return false;
        }
        // Run the tutorial
        await this.runWithDriver(tutorial);
        return true;
    }
    /**
     * Run tutorial using Driver.js
     */
    async runWithDriver(tutorial) {
        // Check if Driver.js is loaded
        if (typeof window !== 'undefined' && typeof window.driver === 'undefined') {
            this.log('Driver.js not loaded, loading now...');
            await this.loadDriverJS();
        }
        
        if (typeof window.driver !== 'function') {
            console.error('Driver.js failed to load');
            return;
        }
        
        this.currentTutorial = tutorial;
        this.log(`Starting tutorial: ${tutorial.id}`);
        // Create Driver instance
        const driverObj = window.driver({
            showProgress: true,
            showButtons: ['next', 'previous', 'close'],
            steps: tutorial.steps.map((step) => ({
                element: step.element,
                popover: {
                    title: step.popover.title,
                    description: step.popover.description,
                    side: step.popover.side || 'bottom',
                    align: step.popover.align || 'start'
                }
            })),
            onDestroyStarted: () => {
                if (driverObj.isLastStep()) {
                    this.markTutorialCompleted(tutorial.id, tutorial.version);
                    this.log(`Tutorial completed: ${tutorial.id}`);
                }
                if (!driverObj.isLastStep() && !tutorial.dismissible) {
                    return false; // Prevent closing if not dismissible
                }
            },
            onDestroyed: () => {
                this.currentTutorial = null;
            }
        });
        // Start the tour
        driverObj.drive();
    }
    /**
     * Dynamically load Driver.js
     */
    loadDriverJS() {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined') {
                reject(new Error('Window is not defined'));
                return;
            }
            if (typeof window.driver !== 'undefined') {
                this.log('Driver.js already loaded');
                resolve();
                return;
            }
            
            this.log('Loading Driver.js from CDN...');
            console.log('[BlessBox] Loading Driver.js from CDN...');
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            // Add timeout for CDN loading
            const timeout = setTimeout(() => {
                console.error('[BlessBox] Driver.js CDN timeout after 10 seconds');
                script.remove();
                reject(new Error('Driver.js CDN timeout'));
            }, 10000);
            
            script.onload = () => {
                clearTimeout(timeout);
                
                // Load CSS
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css';
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
                
                this.log('Driver.js loaded successfully from CDN');
                console.log('[BlessBox] Driver.js loaded successfully');
                
                // Verify it's actually available
                setTimeout(() => {
                    if (typeof window.driver === 'function') {
                        resolve();
                    } else {
                        reject(new Error('Driver.js loaded but not available'));
                    }
                }, 100);
            };
            
            script.onerror = (error) => {
                clearTimeout(timeout);
                console.error('[BlessBox] Failed to load Driver.js from CDN:', error);
                reject(new Error('Failed to load Driver.js from CDN'));
            };
            
            document.head.appendChild(script);
        });
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
        const data = this.getStorageData();
        return data[tutorialId]?.version === version && data[tutorialId]?.completed === true;
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
// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    // Expose class globally
    window.BlessBoxTutorials = BlessBoxTutorials;
    // Auto-create instance
    window.blessboxTutorials = new BlessBoxTutorials({
        debug: window.location.hostname === 'localhost'
    });
}
