import { expect, test } from '@playwright/test';

import { LoginPage } from '../../fixtures/pages/login-page';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('guest can access provider search without authentication', async ({ page }) => {
    await page.goto('/providers');

    // Should be able to access providers page without login
    await expect(page).toHaveURL(/\/providers/);

    // Should see provider search interface
    await expect(page.locator('input, [role="searchbox"]')).toBeVisible();
  });

  test('login page is accessible', async ({ page }) => {
    await loginPage.navigateToLogin();

    // Should show login page
    await expect(page).toHaveURL(/\/login/);

    // Should show Google login option
    await expect(page.locator(loginPage['selectors'].googleLoginButton)).toBeVisible();
  });

  test('user can perform OAuth login flow', async ({ page }) => {
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    await loginPage.performTestLogin(testUser);

    // Should be redirected to dashboard or profile
    await expect(page).toHaveURL(/\/dashboard|\/profile|\/$/);

    // Should have active session
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
  });

  test('unauthenticated user is redirected to login for protected routes', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/calendar');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('authenticated user can access protected routes', async ({ page }) => {
    const testUser = {
      id: 'test-provider-123',
      email: 'provider@example.com',
      name: 'Test Provider',
    };

    // Login first
    await loginPage.performTestLogin(testUser);

    // Now try to access protected route
    await page.goto('/calendar');

    // Should be able to access calendar (assuming user has provider permissions)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('logout functionality works', async ({ page }) => {
    const testUser = {
      id: 'test-user-logout',
      email: 'logout@example.com',
      name: 'Logout Test User',
    };

    // Login first
    await loginPage.performTestLogin(testUser);

    // Verify logged in
    expect(await loginPage.isLoggedIn()).toBeTruthy();

    // Logout
    await loginPage.logout();

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);

    // Session should be cleared
    expect(await loginPage.isLoggedIn()).toBeFalsy();
  });
});
