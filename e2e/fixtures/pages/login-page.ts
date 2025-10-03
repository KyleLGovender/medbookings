import { Page, expect } from '@playwright/test';
import { nowUTC } from '../../../src/lib/timezone';

import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors
  private selectors = {
    googleLoginButton:
      '[data-testid="google-login"], button:has-text("Google"), .google-signin-button',
    emailInput: '[data-testid="email"], input[name="email"], input[type="email"]',
    passwordInput: '[data-testid="password"], input[name="password"], input[type="password"]',
    loginButton: '[data-testid="login-button"], button[type="submit"], button:has-text("Sign")',
    errorMessage: '[data-testid="login-error"], .error-message, .alert-error',
    loadingSpinner: '[data-testid="loading"], .loading, .spinner',
  };

  /**
   * Navigate to login page
   */
  async navigateToLogin() {
    await this.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Click Google login button
   */
  async clickGoogleLogin() {
    await this.waitForElement(this.selectors.googleLoginButton);
    await this.clickElement(this.selectors.googleLoginButton);
  }

  /**
   * Mock Google OAuth flow for testing
   */
  async mockGoogleOAuth(userInfo: { email: string; name: string; id: string }) {
    // Set up route interception for OAuth callback
    await this.page.route('**/api/auth/callback/google*', async (route) => {
      // Mock successful OAuth response
      await route.fulfill({
        status: 302,
        headers: {
          Location: '/dashboard',
          'Set-Cookie': `next-auth.session-token=mock-session-${userInfo.id}; Path=/; HttpOnly; SameSite=lax`,
        },
      });
    });

    // Mock session endpoint
    await this.page.route('**/api/auth/session', async (route) => {
      const json = {
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
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
  }

  /**
   * Perform login with email/password (if implemented)
   */
  async loginWithCredentials(email: string, password: string) {
    await this.fillField(this.selectors.emailInput, email);
    await this.fillField(this.selectors.passwordInput, password);
    await this.clickElement(this.selectors.loginButton);

    // Wait for navigation or error
    await Promise.race([
      this.page.waitForURL(/\/dashboard|\/profile/, { timeout: 10000 }),
      this.waitForElement(this.selectors.errorMessage, 5000),
    ]);
  }

  /**
   * Verify login was successful
   */
  async verifyLoginSuccess() {
    // Should be redirected to dashboard or profile
    await expect(this.page).toHaveURL(/\/dashboard|\/profile/);
  }

  /**
   * Verify login failed
   */
  async verifyLoginError() {
    await expect(this.page.locator(this.selectors.errorMessage)).toBeVisible();
  }

  /**
   * Check if user is already logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Check if session exists
      const response = await this.page.request.get('/api/auth/session');
      const session = await response.json();
      return !!session.user;
    } catch {
      return false;
    }
  }

  /**
   * Complete OAuth login flow for testing
   */
  async performTestLogin(userInfo: { email: string; name: string; id: string }) {
    await this.navigateToLogin();
    await this.mockGoogleOAuth(userInfo);
    await this.clickGoogleLogin();

    // Wait for redirect
    await this.page.waitForURL(/\/dashboard|\/profile/, { timeout: 15000 });
    await this.waitForPageLoad();
  }

  /**
   * Logout user
   */
  async logout() {
    // Navigate to logout endpoint
    await this.goto('/api/auth/signout');
    await this.page.waitForURL('/login', { timeout: 10000 });
  }
}
