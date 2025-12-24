import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    // Only run unit/integration tests for app code (exclude Playwright specs)
    include: [
      'lib/**/*.test.ts',
      'lib/**/*.spec.ts',
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
    // Run tests once and exit
    passWithNoTests: true,
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