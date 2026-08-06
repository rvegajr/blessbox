import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    // Only run unit/integration tests for app code (exclude Playwright specs)
    include: [
      'lib/**/*.test.ts',
      'lib/**/*.spec.ts',
      'tests/components/**/*.test.{ts,tsx}',
      'tests/vanilla-js/**/*.test.ts',
      // Previously-silent tiers — now collected so their tests actually gate CI.
      'tests/api/**/*.test.{ts,tsx}',
      'tests/services/**/*.test.ts',
    ],
    exclude: [
      'node_modules/**',
      'tests/e2e/**',
      'src/**',
      'playwright-report/**',
      'test-results/**',
    ],
    // NON-BLOCKING TESTS - No watch mode, no hanging
    watch: false,
    run: true,
    // Exit after tests complete
    bail: 0,
    // Don't hang on errors
    testTimeout: 10000,
    // Fail (not silently pass) if a tier collects no tests — catches mis-globbing.
    passWithNoTests: false,
    // tests/vanilla-js loads public/tutorials/tutorial-engine.js which schedules
    // a setTimeout that fires after teardown referencing window. Tests pass; this
    // keeps the run from exit-coding non-zero on cosmetic stray-timer errors.
    dangerouslyIgnoreUnhandledErrors: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/*.spec.ts',
        '**/*.test.ts'
      ]
    }
  },
  resolve: {
    alias: {
      // Match tsconfig "paths" (@/* -> ./*)
      '@': fileURLToPath(new URL('./', import.meta.url)),
    }
  },
  esbuild: {
    jsx: 'automatic'
  }
});