import { test as setup, expect } from '@playwright/test';
import { setupCalendarTestEnvironment } from '../utils/calendar-database';
import { CALENDAR_TEST_USERS } from './calendar-test-data';

/**
 * Calendar-focused authentication setup
 * Creates minimal test data and auth states needed for calendar testing
 */

setup('authenticate calendar provider', async ({ page }) => {
  console.log('Setting up calendar test environment...');
  
  // Setup calendar test data (this cleans old data and creates fresh data)
  const testData = await setupCalendarTestEnvironment();
  
  console.log('✅ Calendar test environment ready');
  
  // Mock authentication for calendar provider
  await page.route('**/api/auth/session', async (route) => {
    const json = {
      user: {
        id: testData.provider.id,
        email: testData.provider.email,
        name: testData.provider.name,
        role: testData.provider.role,
        image: 'https://via.placeholder.com/40',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    await route.fulfill({ json });
  });

  // Navigate to a protected page to establish session
  await page.goto('/calendar');
  
  // Wait for successful authentication
  await page.waitForTimeout(1000);
  
  // Save authentication state
  await page.context().storageState({ path: 'e2e/.auth/calendar-provider.json' });
  console.log('Auth state saved for calendar provider');
});

setup('authenticate calendar client', async ({ page }) => {
  // We assume calendar test environment is already set up by the provider setup
  
  // Get the test data (should exist from provider setup)
  const testData = await setupCalendarTestEnvironment();
  
  // Mock authentication for calendar client
  await page.route('**/api/auth/session', async (route) => {
    const json = {
      user: {
        id: testData.client.id,
        email: testData.client.email,
        name: testData.client.name,
        role: testData.client.role,
        image: 'https://via.placeholder.com/40',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    await route.fulfill({ json });
  });

  // Navigate to a protected page to establish session
  await page.goto('/providers');
  
  // Wait for successful authentication
  await page.waitForTimeout(1000);
  
  // Save authentication state
  await page.context().storageState({ path: 'e2e/.auth/calendar-client.json' });
  console.log('Auth state saved for calendar client');
});