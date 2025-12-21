/**
 * Tests for BlessBoxTutorials - Context-Independent Tutorial System
 * Pure vanilla JavaScript testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor, createTestElement, cleanupTestElements } from './setup';
import './setup';

describe('BlessBoxTutorials - Context-Independent System', () => {
  let BlessBoxTutorials: any;

  beforeEach(async () => {
    cleanupTestElements();
    localStorage.clear();
    
    // Load the tutorial engine
    // We'll create this file next
    const module = await import('../../public/tutorials/tutorial-engine');
    BlessBoxTutorials = module.BlessBoxTutorials;
  });

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        new BlessBoxTutorials();
      }).not.toThrow();
    });

    it('should create instance with default options', () => {
      const tutorials = new BlessBoxTutorials();
      expect(tutorials).toBeDefined();
      expect(tutorials.tutorials).toEqual({});
      expect(tutorials.currentTutorial).toBeNull();
    });

    it('should accept debug option', () => {
      const tutorials = new BlessBoxTutorials({ debug: true });
      expect(tutorials.debug).toBe(true);
    });

    it('should set storage key', () => {
      const tutorials = new BlessBoxTutorials();
      expect(tutorials.storageKey).toBe('blessbox_tutorials');
    });
  });

  describe('Tutorial Registration', () => {
    it('should register a tutorial', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.registerTutorial('test-tour', {
        title: 'Test Tour',
        description: 'A test tutorial',
        steps: [
          {
            element: '#test-element',
            popover: {
              title: 'Step 1',
              description: 'This is step 1',
              side: 'bottom'
            }
          }
        ]
      });

      expect(tutorials.tutorials['test-tour']).toBeDefined();
      expect(tutorials.tutorials['test-tour'].title).toBe('Test Tour');
      expect(tutorials.tutorials['test-tour'].steps.length).toBe(1);
    });

    it('should set default version to 1', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.registerTutorial('test-tour', {
        title: 'Test Tour',
        steps: []
      });

      expect(tutorials.tutorials['test-tour'].version).toBe(1);
    });

    it('should accept custom version', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.registerTutorial('test-tour', {
        version: 2,
        title: 'Test Tour',
        steps: []
      });

      expect(tutorials.tutorials['test-tour'].version).toBe(2);
    });

    it('should set dismissible to true by default', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.registerTutorial('test-tour', {
        title: 'Test Tour',
        steps: []
      });

      expect(tutorials.tutorials['test-tour'].dismissible).toBe(true);
    });

    it('should respect dismissible: false', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.registerTutorial('test-tour', {
        title: 'Test Tour',
        dismissible: false,
        steps: []
      });

      expect(tutorials.tutorials['test-tour'].dismissible).toBe(false);
    });

    it('should set autoStart to false by default', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.registerTutorial('test-tour', {
        title: 'Test Tour',
        steps: []
      });

      expect(tutorials.tutorials['test-tour'].autoStart).toBe(false);
    });
  });

  describe('Tutorial Validation', () => {
    it('should validate that all step elements exist', () => {
      const tutorials = new BlessBoxTutorials();
      
      // Create test elements
      createTestElement('<div id="step-1">Step 1</div>');
      createTestElement('<div id="step-2">Step 2</div>');

      const steps = [
        { element: '#step-1', popover: { title: 'Step 1' } },
        { element: '#step-2', popover: { title: 'Step 2' } }
      ];

      const missing = tutorials.validateSteps(steps);
      expect(missing).toEqual([]);
    });

    it('should detect missing elements', () => {
      const tutorials = new BlessBoxTutorials();
      
      createTestElement('<div id="step-1">Step 1</div>');
      // step-2 intentionally missing

      const steps = [
        { element: '#step-1', popover: { title: 'Step 1' } },
        { element: '#step-2', popover: { title: 'Step 2' } }
      ];

      const missing = tutorials.validateSteps(steps);
      expect(missing).toEqual(['#step-2']);
    });

    it('should return all missing elements', () => {
      const tutorials = new BlessBoxTutorials();
      
      const steps = [
        { element: '#missing-1', popover: { title: 'Step 1' } },
        { element: '#missing-2', popover: { title: 'Step 2' } },
        { element: '#missing-3', popover: { title: 'Step 3' } }
      ];

      const missing = tutorials.validateSteps(steps);
      expect(missing).toEqual(['#missing-1', '#missing-2', '#missing-3']);
    });
  });

  describe('Tutorial Completion Tracking', () => {
    it('should mark tutorial as completed', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.markTutorialCompleted('test-tour', 1);
      
      const isCompleted = tutorials.isTutorialCompleted('test-tour', 1);
      expect(isCompleted).toBe(true);
    });

    it('should save completion to localStorage', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.markTutorialCompleted('test-tour', 1);
      
      const data = JSON.parse(localStorage.getItem('blessbox_tutorials') || '{}');
      expect(data['test-tour']).toBeDefined();
      expect(data['test-tour'].completed).toBe(true);
      expect(data['test-tour'].version).toBe(1);
    });

    it('should save completion timestamp', () => {
      const tutorials = new BlessBoxTutorials();
      
      const beforeTime = new Date().toISOString();
      tutorials.markTutorialCompleted('test-tour', 1);
      const afterTime = new Date().toISOString();
      
      const data = JSON.parse(localStorage.getItem('blessbox_tutorials') || '{}');
      expect(data['test-tour'].completedAt).toBeDefined();
      expect(data['test-tour'].completedAt >= beforeTime).toBe(true);
      expect(data['test-tour'].completedAt <= afterTime).toBe(true);
    });

    it('should return false for uncompleted tutorial', () => {
      const tutorials = new BlessBoxTutorials();
      
      const isCompleted = tutorials.isTutorialCompleted('never-started', 1);
      expect(isCompleted).toBe(false);
    });

    it('should return false for old version', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.markTutorialCompleted('test-tour', 1);
      
      const isCompleted = tutorials.isTutorialCompleted('test-tour', 2);
      expect(isCompleted).toBe(false);
    });

    it('should handle version upgrades', () => {
      const tutorials = new BlessBoxTutorials();
      
      // Complete version 1
      tutorials.markTutorialCompleted('test-tour', 1);
      expect(tutorials.isTutorialCompleted('test-tour', 1)).toBe(true);
      
      // Version 2 should not be completed
      expect(tutorials.isTutorialCompleted('test-tour', 2)).toBe(false);
      
      // Complete version 2
      tutorials.markTutorialCompleted('test-tour', 2);
      expect(tutorials.isTutorialCompleted('test-tour', 2)).toBe(true);
    });
  });

  describe('Tutorial Reset', () => {
    it('should reset specific tutorial', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.markTutorialCompleted('tutorial-1', 1);
      tutorials.markTutorialCompleted('tutorial-2', 1);
      
      tutorials.resetTutorial('tutorial-1');
      
      expect(tutorials.isTutorialCompleted('tutorial-1', 1)).toBe(false);
      expect(tutorials.isTutorialCompleted('tutorial-2', 1)).toBe(true);
    });

    it('should reset all tutorials', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.markTutorialCompleted('tutorial-1', 1);
      tutorials.markTutorialCompleted('tutorial-2', 1);
      tutorials.markTutorialCompleted('tutorial-3', 1);
      
      tutorials.resetAllTutorials();
      
      expect(tutorials.isTutorialCompleted('tutorial-1', 1)).toBe(false);
      expect(tutorials.isTutorialCompleted('tutorial-2', 1)).toBe(false);
      expect(tutorials.isTutorialCompleted('tutorial-3', 1)).toBe(false);
    });

    it('should clear localStorage on reset all', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.markTutorialCompleted('test-tour', 1);
      tutorials.resetAllTutorials();
      
      const data = localStorage.getItem('blessbox_tutorials');
      expect(data).toBeNull();
    });
  });

  describe('Storage Management', () => {
    it('should get empty object when no data exists', () => {
      const tutorials = new BlessBoxTutorials();
      localStorage.clear();
      
      const data = tutorials.getStorageData();
      expect(data).toEqual({});
    });

    it('should retrieve stored data', () => {
      const tutorials = new BlessBoxTutorials();
      
      const testData = { 'test-tour': { completed: true, version: 1 } };
      localStorage.setItem('blessbox_tutorials', JSON.stringify(testData));
      
      const data = tutorials.getStorageData();
      expect(data).toEqual(testData);
    });

    it('should handle corrupted localStorage data', () => {
      const tutorials = new BlessBoxTutorials();
      
      localStorage.setItem('blessbox_tutorials', 'invalid json {');
      
      const data = tutorials.getStorageData();
      expect(data).toEqual({});
    });

    it('should not throw on localStorage errors', () => {
      const tutorials = new BlessBoxTutorials();
      
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      expect(() => {
        tutorials.getStorageData();
      }).not.toThrow();
      
      // Restore
      localStorage.getItem = originalGetItem;
    });
  });

  describe('Starting Tutorials', () => {
    it('should not start tutorial if not registered', () => {
      const tutorials = new BlessBoxTutorials();
      
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      tutorials.startTutorial('non-existent');
      
      expect(consoleError).toHaveBeenCalledWith('Tutorial not found: non-existent');
      
      consoleError.mockRestore();
    });

    it('should not start completed tutorial', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.registerTutorial('test-tour', {
        version: 1,
        title: 'Test',
        steps: []
      });
      
      tutorials.markTutorialCompleted('test-tour', 1);
      
      // Mock the log method
      const logSpy = vi.spyOn(tutorials, 'log');
      
      tutorials.startTutorial('test-tour');
      
      expect(logSpy).toHaveBeenCalledWith('Tutorial already completed: test-tour');
    });

    it('should start completed tutorial when forced', () => {
      const tutorials = new BlessBoxTutorials();
      
      createTestElement('<div id="test">Test</div>');
      
      tutorials.registerTutorial('test-tour', {
        version: 1,
        title: 'Test',
        steps: [
          { element: '#test', popover: { title: 'Test' } }
        ]
      });
      
      tutorials.markTutorialCompleted('test-tour', 1);
      
      // Force start (we'll need to mock Driver.js)
      const runSpy = vi.spyOn(tutorials, 'runWithDriver').mockImplementation(() => {});
      
      tutorials.startTutorial('test-tour', true);
      
      expect(runSpy).toHaveBeenCalled();
      
      runSpy.mockRestore();
    });

    it('should not start if elements are missing', () => {
      const tutorials = new BlessBoxTutorials();
      
      tutorials.registerTutorial('test-tour', {
        version: 1,
        title: 'Test',
        steps: [
          { element: '#missing-element', popover: { title: 'Test' } }
        ]
      });
      
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      tutorials.startTutorial('test-tour');
      
      expect(consoleWarn).toHaveBeenCalledWith(
        'Tutorial test-tour cannot start - missing elements:',
        ['#missing-element']
      );
      
      consoleWarn.mockRestore();
    });
  });

  describe('Debug Logging', () => {
    it('should log when debug is true', () => {
      const tutorials = new BlessBoxTutorials({ debug: true });
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      tutorials.log('Test message', 'extra data');
      
      expect(consoleLog).toHaveBeenCalledWith(
        '[BlessBox Tutorials]',
        'Test message',
        'extra data'
      );
      
      consoleLog.mockRestore();
    });

    it('should not log when debug is false', () => {
      const tutorials = new BlessBoxTutorials({ debug: false });
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      tutorials.log('Test message');
      
      expect(consoleLog).not.toHaveBeenCalled();
      
      consoleLog.mockRestore();
    });
  });

  describe('Event Listeners', () => {
    it('should listen for startTutorial custom event', async () => {
      const tutorials = new BlessBoxTutorials();
      
      createTestElement('<div id="test">Test</div>');
      
      tutorials.registerTutorial('test-tour', {
        version: 1,
        title: 'Test',
        steps: [
          { element: '#test', popover: { title: 'Test' } }
        ]
      });
      
      const startSpy = vi.spyOn(tutorials, 'startTutorial');
      
      // Manually trigger init to attach listeners
      tutorials.init();
      
      // Dispatch custom event
      const event = new CustomEvent('startTutorial', {
        detail: { tutorialId: 'test-tour' }
      });
      document.dispatchEvent(event);
      
      await waitFor(100);
      
      expect(startSpy).toHaveBeenCalledWith('test-tour');
    });
  });
});

