import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear any existing authentication
    await context.clearCookies();
    await context.clearPermissions();
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('Sign In to MedBookings');
    await expect(page.locator('button:has-text("Sign In with Google")')).toBeVisible();
    
    // Check Google icon is present
    await expect(page.locator('svg')).toBeVisible();
  });

  test('should show error message for authentication errors', async ({ page }) => {
    // Navigate with error parameter
    await page.goto('/login?error=OAuthAccountNotLinked');
    
    // Check error message is displayed
    await expect(page.locator('[data-testid="auth-error"]')).toContainText('Authentication Error');
    await expect(page.locator('[data-testid="auth-error"]')).toContainText('This email is already associated with another account');
  });

  test('should successfully login with Google OAuth', async ({ page }) => {
    // Mock successful Google OAuth flow
    await page.route('**/api/auth/session', async (route) => {
      const json = {
        user: {
          name: 'Test User',
          email: 'user@test.com',
          image: 'https://via.placeholder.com/40',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      await route.fulfill({ json });
    });

    await page.route('**/api/auth/signin/google**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/profile',
        },
      });
    });

    await page.goto('/login');
    
    // Click Google sign-in button
    await page.click('button:has-text("Sign In with Google")');
    
    // Should redirect to profile page
    await page.waitForURL('/profile');
    
    // Verify successful login
    await expect(page.locator('h1')).toContainText('Profile');
  });

  test('should handle OAuth callback errors', async ({ page }) => {
    // Mock OAuth error
    await page.route('**/api/auth/callback/google**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/login?error=OAuthCallback',
        },
      });
    });

    await page.goto('/login');
    await page.click('button:has-text("Sign In with Google")');
    
    // Should redirect back to login with error
    await page.waitForURL('/login?error=OAuthCallback');
    
    // Check error message
    await expect(page.locator('[data-testid="auth-error"]')).toContainText('There was an error during the authentication process');
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/session', async (route) => {
      const json = {
        user: {
          name: 'Test User',
          email: 'user@test.com',
          image: 'https://via.placeholder.com/40',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      await route.fulfill({ json });
    });

    await page.route('**/api/auth/signin/google**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/calendar',
        },
      });
    });

    // Try to access protected page while not authenticated
    await page.goto('/calendar');
    
    // Should redirect to login
    await page.waitForURL('/login');
    
    // Login
    await page.click('button:has-text("Sign In with Google")');
    
    // Should redirect back to intended page
    await page.waitForURL('/calendar');
    await expect(page.locator('h1')).toContainText('Manage Your Calendar');
  });

  test('should handle session expiration', async ({ page, context }) => {
    // Set up expired session
    await page.route('**/api/auth/session', async (route) => {
      const json = {
        user: null,
        expires: new Date(Date.now() - 1000).toISOString(), // Expired
      };
      await route.fulfill({ json });
    });

    // Try to access protected page
    await page.goto('/profile');
    
    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('Sign In to MedBookings');
  });
});