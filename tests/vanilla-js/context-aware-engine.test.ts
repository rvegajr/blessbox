/**
 * Tests for ContextAwareTutorials - Context-Aware Tutorial System
 * Pure vanilla JavaScript testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor, createTestElement, cleanupTestElements } from './setup';
import './setup';

describe('ContextAwareTutorials - Context-Aware System', () => {
  let ContextAwareTutorials: any;

  beforeEach(async () => {
    cleanupTestElements();
    localStorage.clear();
    
    // Load the context-aware engine
    // We'll create this file next
    const module = await import('../../public/tutorials/context-aware-engine');
    ContextAwareTutorials = module.ContextAwareTutorials;
  });

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        new ContextAwareTutorials();
      }).not.toThrow();
    });

    it('should create instance with default properties', () => {
      const contextTutorials = new ContextAwareTutorials();
      expect(contextTutorials).toBeDefined();
      expect(contextTutorials.triggers).toEqual([]);
      expect(contextTutorials.storageKey).toBe('blessbox_context_tutorials');
      expect(contextTutorials.eventBus).toBeDefined();
    });

    it('should attach event listeners on init', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      
      const contextTutorials = new ContextAwareTutorials();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('submit', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('appEvent', expect.any(Function));
    });

    it('should start condition checker on init', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      
      const contextTutorials = new ContextAwareTutorials();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    });
  });

  describe('Trigger Registration', () => {
    it('should register a trigger', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      contextTutorials.registerTrigger({
        id: 'test-trigger',
        name: 'Test Trigger',
        condition: () => true,
        tutorial: 'test-tutorial',
        priority: 10
      });

      expect(contextTutorials.triggers).toHaveLength(1);
      expect(contextTutorials.triggers[0].id).toBe('test-trigger');
      expect(contextTutorials.triggers[0].name).toBe('Test Trigger');
      expect(contextTutorials.triggers[0].priority).toBe(10);
    });

    it('should set default values for optional properties', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      contextTutorials.registerTrigger({
        id: 'test-trigger',
        name: 'Test Trigger',
        condition: () => true,
        tutorial: 'test-tutorial'
      });

      const trigger = contextTutorials.triggers[0];
      expect(trigger.priority).toBe(0);
      expect(trigger.cooldown).toBe(0);
      expect(trigger.maxShows).toBe(1);
      expect(trigger.dismissible).toBe(true);
    });

    it('should respect custom values for optional properties', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      contextTutorials.registerTrigger({
        id: 'test-trigger',
        name: 'Test Trigger',
        condition: () => true,
        tutorial: 'test-tutorial',
        priority: 15,
        cooldown: 24,
        maxShows: 3,
        dismissible: false
      });

      const trigger = contextTutorials.triggers[0];
      expect(trigger.priority).toBe(15);
      expect(trigger.cooldown).toBe(24);
      expect(trigger.maxShows).toBe(3);
      expect(trigger.dismissible).toBe(false);
    });
  });

  describe('Trigger Condition Checking', () => {
    it('should check all trigger conditions', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      const condition1 = vi.fn(() => true);
      const condition2 = vi.fn(() => false);
      
      contextTutorials.registerTrigger({
        id: 'trigger-1',
        name: 'Trigger 1',
        condition: condition1,
        tutorial: 'tutorial-1'
      });
      
      contextTutorials.registerTrigger({
        id: 'trigger-2',
        name: 'Trigger 2',
        condition: condition2,
        tutorial: 'tutorial-2'
      });

      const executeSpy = vi.spyOn(contextTutorials, 'executeTrigger');
      
      contextTutorials.checkConditions();
      
      expect(condition1).toHaveBeenCalled();
      expect(condition2).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalledWith(contextTutorials.triggers[0]);
    });

    it('should sort triggers by priority', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      contextTutorials.registerTrigger({
        id: 'low-priority',
        name: 'Low Priority',
        condition: () => true,
        tutorial: 'tutorial-1',
        priority: 1
      });
      
      contextTutorials.registerTrigger({
        id: 'high-priority',
        name: 'High Priority',
        condition: () => true,
        tutorial: 'tutorial-2',
        priority: 10
      });

      const executeSpy = vi.spyOn(contextTutorials, 'executeTrigger');
      
      contextTutorials.checkConditions();
      
      // Should execute high priority first
      expect(executeSpy).toHaveBeenNthCalledWith(1, contextTutorials.triggers[1]); // high priority
      expect(executeSpy).toHaveBeenNthCalledWith(2, contextTutorials.triggers[0]); // low priority
    });

    it('should not check triggers that exceed max shows', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      contextTutorials.registerTrigger({
        id: 'limited-trigger',
        name: 'Limited Trigger',
        condition: () => true,
        tutorial: 'tutorial-1',
        maxShows: 1
      });

      // Mark as shown once
      contextTutorials.updateTriggerData('limited-trigger');
      
      const conditionSpy = vi.fn(() => true);
      contextTutorials.triggers[0].condition = conditionSpy;
      
      contextTutorials.checkConditions();
      
      expect(conditionSpy).not.toHaveBeenCalled();
    });

    it('should not check triggers within cooldown period', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      contextTutorials.registerTrigger({
        id: 'cooldown-trigger',
        name: 'Cooldown Trigger',
        condition: () => true,
        tutorial: 'tutorial-1',
        cooldown: 24 // 24 hours
      });

      // Mark as shown recently
      const data = contextTutorials.getStorageData();
      data['cooldown-trigger'] = {
        showCount: 1,
        lastShown: Date.now() - (1 * 60 * 60 * 1000) // 1 hour ago
      };
      localStorage.setItem(contextTutorials.storageKey, JSON.stringify(data));
      
      const conditionSpy = vi.fn(() => true);
      contextTutorials.triggers[0].condition = conditionSpy;
      
      contextTutorials.checkConditions();
      
      expect(conditionSpy).not.toHaveBeenCalled();
    });
  });

  describe('Trigger Execution', () => {
    it('should execute trigger when condition is met', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      contextTutorials.registerTrigger({
        id: 'test-trigger',
        name: 'Test Trigger',
        condition: () => true,
        tutorial: 'test-tutorial'
      });

      const updateSpy = vi.spyOn(contextTutorials, 'updateTriggerData');
      const dispatchSpy = vi.spyOn(contextTutorials.eventBus, 'dispatchEvent');
      
      // Mock window.blessboxTutorials
      (window as any).blessboxTutorials = {
        startTutorial: vi.fn()
      };
      
      contextTutorials.executeTrigger(contextTutorials.triggers[0]);
      
      expect(updateSpy).toHaveBeenCalledWith('test-trigger');
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'tutorialTriggered',
        detail: expect.objectContaining({ trigger: contextTutorials.triggers[0] })
      }));
    });

    it('should update trigger data on execution', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      contextTutorials.updateTriggerData('test-trigger');
      
      const data = contextTutorials.getTriggerData('test-trigger');
      expect(data.showCount).toBe(1);
      expect(data.lastShown).toBeDefined();
      expect(typeof data.lastShown).toBe('number');
    });

    it('should increment show count on multiple executions', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      contextTutorials.updateTriggerData('test-trigger');
      contextTutorials.updateTriggerData('test-trigger');
      contextTutorials.updateTriggerData('test-trigger');
      
      const data = contextTutorials.getTriggerData('test-trigger');
      expect(data.showCount).toBe(3);
    });
  });

  describe('User Action Tracking', () => {
    it('should track click events', () => {
      const contextTutorials = new ContextAwareTutorials();
      contextTutorials.init();
      
      const dispatchSpy = vi.spyOn(contextTutorials.eventBus, 'dispatchEvent');
      
      const element = createTestElement('<button>Click me</button>');
      const button = element.querySelector('button')!;
      
      button.click();
      
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'userAction',
        detail: expect.objectContaining({
          type: 'click',
          data: button,
          timestamp: expect.any(Number)
        })
      }));
    });

    it('should track form submission events', () => {
      const contextTutorials = new ContextAwareTutorials();
      contextTutorials.init();
      
      const dispatchSpy = vi.spyOn(contextTutorials.eventBus, 'dispatchEvent');
      
      const form = createTestElement('<form><input type="submit" value="Submit"></form>');
      const submitButton = form.querySelector('input[type="submit"]')!;
      
      submitButton.click();
      
      // Should track both click and submit events
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'userAction',
        detail: expect.objectContaining({
          type: 'click',
          timestamp: expect.any(Number)
        })
      }));
      
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'userAction',
        detail: expect.objectContaining({
          type: 'submit',
          timestamp: expect.any(Number)
        })
      }));
    });

    it('should track custom app events', () => {
      const contextTutorials = new ContextAwareTutorials();
      contextTutorials.init();
      
      const dispatchSpy = vi.spyOn(contextTutorials.eventBus, 'dispatchEvent');
      
      const customEvent = new CustomEvent('appEvent', {
        detail: { type: 'page-view', data: { page: '/dashboard' } }
      });
      document.dispatchEvent(customEvent);
      
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'userAction',
        detail: expect.objectContaining({
          type: 'page-view',
          data: { page: '/dashboard' },
          timestamp: expect.any(Number)
        })
      }));
    });
  });

  describe('Action History Management', () => {
    it('should store user actions in localStorage', () => {
      const contextTutorials = new ContextAwareTutorials();
      contextTutorials.init();
      
      // Simulate user action
      const action = { type: 'click', data: 'test', timestamp: Date.now() };
      contextTutorials.eventBus.dispatchEvent(new CustomEvent('userAction', { detail: action }));
      
      const actions = JSON.parse(localStorage.getItem('blessbox_user_actions') || '[]');
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual(action);
    });

    it('should limit stored actions to 100', () => {
      const contextTutorials = new ContextAwareTutorials();
      contextTutorials.init();
      
      // Add 101 actions
      for (let i = 0; i < 101; i++) {
        const action = { type: 'click', data: `test-${i}`, timestamp: Date.now() };
        contextTutorials.eventBus.dispatchEvent(new CustomEvent('userAction', { detail: action }));
      }
      
      const actions = JSON.parse(localStorage.getItem('blessbox_user_actions') || '[]');
      expect(actions).toHaveLength(100);
      expect(actions[0].data).toBe('test-1'); // First action should be removed
      expect(actions[99].data).toBe('test-100'); // Last action should remain
    });

    it('should get action count by type', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      // Add some test actions
      const actions = [
        { type: 'click', data: 'test1', timestamp: Date.now() },
        { type: 'click', data: 'test2', timestamp: Date.now() },
        { type: 'submit', data: 'test3', timestamp: Date.now() },
        { type: 'click', data: 'test4', timestamp: Date.now() }
      ];
      
      localStorage.setItem('blessbox_user_actions', JSON.stringify(actions));
      
      expect(contextTutorials.getUserActionCount('click')).toBe(3);
      expect(contextTutorials.getUserActionCount('submit')).toBe(1);
      expect(contextTutorials.getUserActionCount('unknown')).toBe(0);
    });

    it('should filter actions by time window', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      const now = Date.now();
      const actions = [
        { type: 'click', data: 'old', timestamp: now - (2 * 60 * 60 * 1000) }, // 2 hours ago
        { type: 'click', data: 'recent', timestamp: now - (30 * 60 * 1000) }, // 30 minutes ago
        { type: 'click', data: 'very-recent', timestamp: now - (5 * 60 * 1000) } // 5 minutes ago
      ];
      
      localStorage.setItem('blessbox_user_actions', JSON.stringify(actions));
      
      expect(contextTutorials.getUserActionCount('click', 1)).toBe(2); // Within 1 hour
      expect(contextTutorials.getUserActionCount('click', 0.1)).toBe(1); // Within 6 minutes
    });
  });

  describe('DOM Observation', () => {
    it('should observe DOM changes', () => {
      const contextTutorials = new ContextAwareTutorials();
      const checkSpy = vi.spyOn(contextTutorials, 'checkConditions');
      
      contextTutorials.observeDOM();
      
      // Add element to DOM
      createTestElement('<div>New element</div>');
      
      // Wait for mutation observer to trigger
      setTimeout(() => {
        expect(checkSpy).toHaveBeenCalled();
      }, 100);
    });
  });

  describe('Helper Methods', () => {
    it('should check if element exists', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      expect(contextTutorials.elementExists('#non-existent')).toBe(false);
      
      createTestElement('<div id="test-element">Test</div>');
      
      expect(contextTutorials.elementExists('#test-element')).toBe(true);
    });

    it('should get element count', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      expect(contextTutorials.getElementCount('.test-class')).toBe(0);
      
      createTestElement(`
        <div class="test-class">1</div>
        <div class="test-class">2</div>
        <div class="test-class">3</div>
      `);
      
      expect(contextTutorials.getElementCount('.test-class')).toBe(3);
    });
  });

  describe('Storage Management', () => {
    it('should get empty storage data when none exists', () => {
      const contextTutorials = new ContextAwareTutorials();
      localStorage.clear();
      
      const data = contextTutorials.getStorageData();
      expect(data).toEqual({});
    });

    it('should retrieve stored trigger data', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      const testData = {
        'trigger-1': { showCount: 2, lastShown: Date.now() },
        'trigger-2': { showCount: 1, lastShown: Date.now() }
      };
      
      localStorage.setItem(contextTutorials.storageKey, JSON.stringify(testData));
      
      const data = contextTutorials.getStorageData();
      expect(data).toEqual(testData);
    });

    it('should handle corrupted storage data', () => {
      const contextTutorials = new ContextAwareTutorials();
      
      localStorage.setItem(contextTutorials.storageKey, 'invalid json {');
      
      const data = contextTutorials.getStorageData();
      expect(data).toEqual({});
    });
  });
});

