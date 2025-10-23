import { Locator, Page, expect } from '@playwright/test';

export class BasePage {
  constructor(public page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a debug screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `e2e/debug-screenshots/${name}-${Math.floor(Math.random() * 1000000000)}.png`,
      fullPage: true,
    });
  }

  /**
   * Fill form field with retry logic
   */
  async fillField(selector: string, value: string) {
    const field = this.page.locator(selector);
    await field.waitFor({ state: 'visible' });
    await field.clear();
    await field.fill(value);
  }

  /**
   * Click with retry logic
   */
  async clickElement(selector: string) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    await element.click();
  }

  /**
   * Wait for element to appear
   */
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.locator(selector).waitFor({
      state: 'visible',
      timeout,
    });
  }

  /**
   * Verify page title
   */
  async verifyTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Verify URL contains path
   */
  async verifyURL(expectedPath: string) {
    await expect(this.page).toHaveURL(new RegExp(expectedPath));
  }
}
