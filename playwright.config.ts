import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for BlessBox E2E Tests
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Maximum time entire test suite can run.
  // 20 min covers the full prod E2E (~12-15 min serial with relay round-trips
  // and onboarding flows enabled). CI can override with PLAYWRIGHT_GLOBAL_TIMEOUT_MS.
  globalTimeout: Number(process.env.PLAYWRIGHT_GLOBAL_TIMEOUT_MS || 20 * 60 * 1000),
  
  // Test execution settings
  fullyParallel: false, // Run tests sequentially to avoid data conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid concurrent data creation
  
  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  use: {
    // Base URL from environment or default to production
    baseURL: process.env.BASE_URL || 'https://www.blessbox.org',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 10 * 1000,
    
    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Optionally test on other browsers
    ...(process.env.FULL_TEST ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 12'] },
      },
    ] : []),
  ],

  // Run local dev server before tests if needed
  ...(process.env.TEST_ENV === 'local' ? {
    webServer: {
      // Match project dev port (package.json uses 7777)
      command: 'npm run dev',
      port: 7777,
      reuseExistingServer: true, // Always reuse if server is already running
      timeout: 120 * 1000,
    },
  } : {}),
});