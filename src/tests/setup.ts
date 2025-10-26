/**
 * Test Setup Configuration
 * 
 * Non-blocking test setup for TDD workflow
 * - Configures testing environment
 * - Sets up mocks and utilities
 * - Ensures tests run independently
 */

import '@testing-library/jest-dom'
import { beforeAll, afterAll } from 'vitest'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Next.js auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}))

// Mock window.location for SPA testing
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost/',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})

// Mock fetch for API calls
global.fetch = vi.fn()

// Suppress console errors in tests (non-blocking)
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})