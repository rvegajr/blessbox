import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.ts'],
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@interfaces': fileURLToPath(new URL('./src/interfaces', import.meta.url)),
      '@implementations': fileURLToPath(new URL('./src/implementations', import.meta.url)),
      '@tests': fileURLToPath(new URL('./src/tests', import.meta.url))
    }
  },
  esbuild: {
    jsx: 'automatic'
  }
});