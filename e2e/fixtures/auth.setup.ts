import { test as setup } from '@playwright/test';

import { setupTestEnvironment } from '../utils/database';

setup('authenticate', async ({ page }) => {
  console.log('Setting up test environment...');

  // Setup test data (this cleans old data and creates fresh data)
  const testData = await setupTestEnvironment();

  console.log('✅ Test environment ready');

  // Mock authentication for provider user
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
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
  console.log('Auth state saved');
});
