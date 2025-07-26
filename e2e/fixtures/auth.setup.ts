import { test as setup, expect } from '@playwright/test';
import { setupTestEnvironment, createTestUsers } from '../utils/database';

const authFile = 'e2e/.auth/user.json';

// Simple session mocking - no OAuth complexity
async function setupSessionMocking(page: any, userInfo: any) {
  // Mock the session API - this is what the app checks for authentication
  await page.route('**/api/auth/session', async (route: any) => {
    const json = {
      user: userInfo,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    await route.fulfill({ 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      json 
    });
  });

  // Mock CSRF token (sometimes needed)
  await page.route('**/api/auth/csrf', async (route: any) => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      json: { csrfToken: 'mock-csrf-token' }
    });
  });
}

setup('authenticate', async ({ page }) => {
  // Setup test environment
  console.log('Setting up test environment...');
  const testEnv = await setupTestEnvironment();
  console.log('Test environment ready');

  // Mock session as authenticated user
  await setupSessionMocking(page, {
    name: 'Test User',
    email: 'user@test.com',
    image: 'https://via.placeholder.com/40',
  });

  // Navigate to home page first 
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Save the state with session mocking active - this is what other tests will use
  await page.context().storageState({ path: authFile });
  
  console.log('Auth state saved for regular user');
});

setup('authenticate as admin', async ({ page }) => {
  await setupSessionMocking(page, {
    name: 'Test Admin',
    email: 'admin@test.com',
    image: 'https://via.placeholder.com/40',
    role: 'ADMIN',
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
  console.log('Auth state saved for admin');
});

setup('authenticate as provider', async ({ page }) => {
  await setupSessionMocking(page, {
    name: 'Test Provider',
    email: 'provider@test.com',
    image: 'https://via.placeholder.com/40',
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: 'e2e/.auth/provider.json' });
  console.log('Auth state saved for provider');
});

setup('authenticate as org owner', async ({ page }) => {
  await setupSessionMocking(page, {
    name: 'Test Org Owner',
    email: 'orgowner@test.com',
    image: 'https://via.placeholder.com/40',
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: 'e2e/.auth/orgowner.json' });
  console.log('Auth state saved for org owner');
});