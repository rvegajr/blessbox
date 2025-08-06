import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for BlessBox E2E Tests
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Maximum time entire test suite can run
  globalTimeout: 10 * 60 * 1000, // 10 minutes
  
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
      command: 'npm run dev',
      port: 4321,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  } : {}),
});