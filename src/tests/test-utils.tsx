// src/tests/test-utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createEmptyStateProps = (overrides = {}) => ({
  icon: <div data-testid="test-icon">📦</div>,
  title: 'No Items Yet',
  description: 'Create your first item to get started.',
  ...overrides,
});

export const createTutorialStep = (overrides = {}) => ({
  element: '#test-element',
  popover: {
    title: 'Test Step',
    description: 'This is a test step description.',
    side: 'bottom' as const,
  },
  ...overrides,
});

export const createTutorial = (overrides = {}) => ({
  id: 'test-tutorial',
  version: 1,
  title: 'Test Tutorial',
  description: 'A test tutorial for development.',
  steps: [createTutorialStep()],
  autoStart: false,
  dismissible: true,
  ...overrides,
});


