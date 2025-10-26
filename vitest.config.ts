import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Non-blocking test configuration
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './src/tests/setup/global-mocks.ts',
      './src/tests/setup.ts'
    ],
    // Exclude E2E tests from unit test runs
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/src/tests/e2e/**', // Exclude Playwright E2E tests
      '**/*.spec.ts' // Exclude Playwright spec files
    ],
    // Run tests once and exit (non-blocking)
    watch: false,
    // Don't fail on first error - run all tests
    bail: 0,
    // Timeout for individual tests
    testTimeout: 10000,
    // Hook timeout
    hookTimeout: 10000,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
