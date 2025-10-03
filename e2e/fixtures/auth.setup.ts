import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { nowUTC } from '../../src/lib/timezone';

import { setupTestEnvironment } from '../utils/database';

setup('authenticate', async ({ page }) => {
  console.log('🔧 Setting up test environment...');

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
      expires: (() => {
        const expiry = nowUTC();
        expiry.setTime(expiry.getTime() + 24 * 60 * 60 * 1000);
        return expiry.toISOString();
      })(),
    };
    await route.fulfill({ json });
  });

  // Mock OAuth callback
  await page.route('**/api/auth/callback/google*', async (route) => {
    await route.fulfill({
      status: 302,
      headers: {
        Location: '/dashboard',
        'Set-Cookie': `next-auth.session-token=mock-session-${testData.provider.id}; Path=/; HttpOnly; SameSite=lax`,
      },
    });
  });

  // Navigate to a protected page to establish session
  await page.goto('/calendar');

  // Wait for page to load and ensure authentication is working
  await page.waitForLoadState('networkidle');

  // Ensure .auth directory exists
  const authDir = path.join(process.cwd(), 'e2e', '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Save authenticated state
  await page.context().storageState({
    path: path.join(authDir, 'user.json'),
  });

  console.log('🔐 Authentication state saved');

  // Store test data for use in other tests
  const testDataFile = path.join(authDir, 'test-data.json');
  fs.writeFileSync(testDataFile, JSON.stringify(testData, null, 2));

  console.log('📝 Test data saved for reuse');

  // Wait for successful authentication
  await page.waitForTimeout(1000);

  // Save authentication state
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
  console.log('Auth state saved');
});
