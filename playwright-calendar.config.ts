import { defineConfig, devices } from '@playwright/test';

/**
 * Calendar-focused Playwright configuration
 * Runs only calendar-related tests with minimal setup
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Calendar-focused setup
    { 
      name: 'calendar-setup', 
      testMatch: /calendar-auth\.setup\.ts/,
      teardown: 'calendar-cleanup',
    },
    
    // Calendar-focused cleanup
    {
      name: 'calendar-cleanup',
      testMatch: /calendar-cleanup\.spec\.ts/,
    },

    // Desktop testing (chromium only for faster calendar development)
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/calendar-provider.json',
      },
      dependencies: ['calendar-setup'],
      testIgnore: [
        '**/auth/**',           // Skip auth tests
        '**/admin/**',          // Skip admin tests  
        '**/providers/**',      // Skip provider onboarding tests
        '**/organizations/**',  // Skip organization tests
        '**/cleanup/**',        // Skip general cleanup tests
      ],
      testMatch: [
        '**/calendar/**',       // Only calendar tests
        '**/availability/**',   // Availability-related tests
        '**/booking/**',        // Booking-related tests
      ],
    },

    // Client browser for booking tests
    {
      name: 'client-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/calendar-client.json',
      },
      dependencies: ['calendar-setup'],
      testMatch: [
        '**/booking/**',        // Client booking tests
      ],
    },

    // Optional: Mobile testing for calendar
    // {
    //   name: 'Mobile Safari',
    //   use: { 
    //     ...devices['iPhone 12'],
    //     storageState: 'e2e/.auth/calendar-client.json',
    //   },
    //   dependencies: ['calendar-setup'],
    //   testMatch: [
    //     '**/calendar/**',
    //     '**/booking/**',
    //   ],
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});