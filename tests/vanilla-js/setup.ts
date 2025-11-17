/**
 * Test setup for vanilla JavaScript tutorial system
 * Uses happy-dom (already configured in vitest.config.ts)
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Set up DOM before each test
beforeEach(() => {
  // Create a fresh localStorage mock for each test
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
    };
  })();

  // Replace global localStorage with our mock
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  });

  // Also replace window.localStorage
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  });
  
  // Clear document body
  document.body.innerHTML = '';
  
  // Ensure window.location is set
  if (!window.location.href.includes('localhost')) {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:7777',
        hostname: 'localhost',
        pathname: '/',
        search: '',
        hash: ''
      },
      writable: true
    });
  }
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
  document.body.innerHTML = '';
  localStorage.clear();
});

// Helper to wait for async operations
export const waitFor = (ms: number = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Helper to trigger DOM events
export const triggerEvent = (element: Element, eventType: string, detail?: any) => {
  const event = new global.window.Event(eventType, { bubbles: true, cancelable: true });
  if (detail) {
    Object.defineProperty(event, 'detail', { value: detail, writable: false });
  }
  element.dispatchEvent(event);
};

// Helper to create DOM elements for testing
export const createTestElement = (html: string): Element => {
  const div = global.document.createElement('div');
  div.innerHTML = html;
  global.document.body.appendChild(div);
  return div;
};

// Helper to clean up test elements
export const cleanupTestElements = () => {
  global.document.body.innerHTML = '';
};

