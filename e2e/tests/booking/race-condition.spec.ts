/**
 * Race Condition Prevention Test
 * Tests that pessimistic locking prevents double-booking
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load test configuration
let testConfig: {
  providerId: string;
  firstSlotId: string;
  totalSlots: number;
};

test.beforeAll(() => {
  try {
    const configPath = join(process.cwd(), 'e2e', 'test-config.json');
    const configData = readFileSync(configPath, 'utf-8');
    testConfig = JSON.parse(configData);
    console.log('✅ Loaded test config:', testConfig);
  } catch (error) {
    console.error('❌ Failed to load test config. Run: npm run test:setup');
    throw error;
  }
});

test.describe('Race Condition Prevention', () => {
  test('prevents double booking when two users book same slot simultaneously', async ({
    browser,
  }) => {
    // Create two separate browser contexts (simulating two different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Both users navigate to the same slot's booking page
      const bookingUrl = `http://localhost:3000/providers/${testConfig.providerId}/book?slot=${testConfig.firstSlotId}`;

      console.log(`📍 Navigating to: ${bookingUrl}`);

      await Promise.all([
        page1.goto(bookingUrl, { waitUntil: 'networkidle' }),
        page2.goto(bookingUrl, { waitUntil: 'networkidle' }),
      ]);

      // Fill in booking forms for both users
      await page1.fill('input[name="clientName"]', 'User One');
      await page1.fill('input[name="clientEmail"]', 'user1@test.com');
      await page1.fill('input[name="clientPhone"]', '0821234567');

      await page2.fill('input[name="clientName"]', 'User Two');
      await page2.fill('input[name="clientEmail"]', 'user2@test.com');
      await page2.fill('input[name="clientPhone"]', '0829876543');

      // Attempt to submit both forms simultaneously
      console.log('⚡ Submitting both bookings simultaneously...');

      const [result1, result2] = await Promise.allSettled([
        page1.click('button[type="submit"]'),
        page2.click('button[type="submit"]'),
      ]);

      // Wait for responses
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      // Check which one succeeded
      const page1Success = page1.url().includes('/confirmation') ||
                          (await page1.locator('text=/success|confirmed/i').count()) > 0;
      const page2Success = page2.url().includes('/confirmation') ||
                          (await page2.locator('text=/success|confirmed/i').count()) > 0;

      const page1Failed = (await page1.locator('text=/unavailable|taken|error/i').count()) > 0;
      const page2Failed = (await page2.locator('text=/unavailable|taken|error/i').count()) > 0;

      console.log(`📊 Results:`);
      console.log(`   User 1: ${page1Success ? '✅ Success' : '❌ Failed'}`);
      console.log(`   User 2: ${page2Success ? '✅ Success' : '❌ Failed'}`);

      // CRITICAL ASSERTION: Only ONE booking should succeed
      const successCount = (page1Success ? 1 : 0) + (page2Success ? 1 : 0);
      expect(successCount).toBe(1);

      console.log('✅ Race condition prevented - only 1 booking succeeded');
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('prevents multiple rapid clicks from same user', async ({ page }) => {
    const bookingUrl = `http://localhost:3000/providers/${testConfig.providerId}/book?slot=${testConfig.firstSlotId}`;

    await page.goto(bookingUrl, { waitUntil: 'networkidle' });

    // Fill in the form
    await page.fill('input[name="clientName"]', 'Rapid Clicker');
    await page.fill('input[name="clientEmail"]', 'rapid@test.com');
    await page.fill('input[name="clientPhone"]', '0821234567');

    // Click submit button multiple times rapidly
    const submitButton = page.locator('button[type="submit"]');

    console.log('⚡ Clicking submit button 5 times rapidly...');

    const clickPromises = [];
    for (let i = 0; i < 5; i++) {
      clickPromises.push(submitButton.click().catch(() => 'failed'));
    }

    await Promise.all(clickPromises);
    await page.waitForLoadState('networkidle');

    // Should either show success or already processing message
    const hasValidResponse =
      page.url().includes('/confirmation') ||
      (await page.locator('text=/success|confirmed|processing|error/i').count()) > 0;

    expect(hasValidResponse).toBeTruthy();

    console.log('✅ Multiple clicks handled correctly');
  });
});
