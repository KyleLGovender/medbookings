/**
 * E2E Tests for Race Condition Prevention in Booking System
 *
 * These tests verify that the pessimistic locking implementation
 * successfully prevents double-booking when multiple users attempt
 * to book the same slot simultaneously.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { testData } from '../../fixtures/test-data';

test.describe('Concurrent Booking Prevention', () => {
  let slotId: string;
  let providerEmail: string;

  test.beforeAll(async ({ browser }) => {
    // Setup: Create a provider with availability for testing
    // In a real scenario, you would set this up through your test data fixtures
    providerEmail = testData.provider.email;

    // Note: You'll need to implement a helper to create test availability
    // and get the slot ID. For now, using a placeholder
    slotId = 'test-slot-' + Date.now();
  });

  test('prevents double booking when two users book simultaneously', async ({ browser }) => {
    // Create two separate browser contexts (simulating two different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Navigate both users to the same booking page
      await Promise.all([
        navigateToBookingPage(page1, slotId),
        navigateToBookingPage(page2, slotId)
      ]);

      // Fill in booking forms for both users
      await Promise.all([
        fillBookingForm(page1, 'User One', 'user1@test.com', '0821234567'),
        fillBookingForm(page2, 'User Two', 'user2@test.com', '0829876543')
      ]);

      // Attempt to submit both forms simultaneously
      const [result1, result2] = await Promise.allSettled([
        submitBookingForm(page1),
        submitBookingForm(page2)
      ]);

      // Analyze results
      let successCount = 0;
      let failureCount = 0;

      for (const result of [result1, result2]) {
        if (result.status === 'fulfilled' && result.value === 'success') {
          successCount++;
        } else {
          failureCount++;
        }
      }

      // CRITICAL ASSERTION: Only one booking should succeed
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);

      // Verify the failed booking shows appropriate error message
      const failedPage = result1.status === 'rejected' || result1.value === 'error' ? page1 : page2;
      await expect(failedPage.locator('text=/slot is no longer available/i')).toBeVisible();

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('prevents double booking with multiple concurrent users', async ({ browser }) => {
    const numberOfUsers = 5;
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];

    try {
      // Create multiple browser contexts
      for (let i = 0; i < numberOfUsers; i++) {
        const context = await browser.newContext();
        contexts.push(context);
        const page = await context.newPage();
        pages.push(page);
      }

      // Navigate all users to the same booking page
      await Promise.all(
        pages.map(page => navigateToBookingPage(page, slotId))
      );

      // Fill in forms for all users
      await Promise.all(
        pages.map((page, index) =>
          fillBookingForm(
            page,
            `Test User ${index + 1}`,
            `user${index + 1}@test.com`,
            `082000000${index}`
          )
        )
      );

      // Submit all forms simultaneously
      const results = await Promise.allSettled(
        pages.map(page => submitBookingForm(page))
      );

      // Count successes and failures
      const successCount = results.filter(
        r => r.status === 'fulfilled' && r.value === 'success'
      ).length;

      // CRITICAL ASSERTION: Only one booking should succeed
      expect(successCount).toBe(1);
      expect(results.length - successCount).toBe(numberOfUsers - 1);

      // Log results for debugging
      console.log(`Concurrent booking test with ${numberOfUsers} users:`);
      console.log(`  - Successful bookings: ${successCount}`);
      console.log(`  - Failed bookings: ${results.length - successCount}`);

    } finally {
      // Clean up all contexts
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('handles rapid sequential booking attempts correctly', async ({ page }) => {
    // This test simulates a user rapidly clicking the submit button multiple times
    await navigateToBookingPage(page, slotId);
    await fillBookingForm(page, 'Rapid Clicker', 'rapid@test.com', '0821234567');

    // Click submit button multiple times rapidly
    const submitButton = page.locator('button[type="submit"]');

    // Attempt to click 5 times in rapid succession
    const clickPromises = [];
    for (let i = 0; i < 5; i++) {
      clickPromises.push(submitButton.click().catch(() => 'failed'));
    }

    await Promise.all(clickPromises);

    // Wait for navigation or error message
    await page.waitForLoadState('networkidle');

    // Should either show success or "already processing" message
    const successMessage = page.locator('text=/booking confirmed/i');
    const processingMessage = page.locator('text=/processing your request/i');
    const errorMessage = page.locator('text=/already being processed/i');

    const hasValidResponse =
      await successMessage.isVisible() ||
      await processingMessage.isVisible() ||
      await errorMessage.isVisible();

    expect(hasValidResponse).toBeTruthy();
  });

  test('verifies database integrity after concurrent attempts', async ({ request }) => {
    // This test would typically be run after the concurrent booking tests
    // to verify that the database state is correct

    // Make API call to check booking count for the slot
    const response = await request.get(`/api/admin/slots/${slotId}/bookings`);

    if (response.ok()) {
      const bookings = await response.json();

      // Should have exactly one booking for this slot
      expect(bookings.length).toBeLessThanOrEqual(1);

      if (bookings.length === 1) {
        // Verify booking details
        expect(bookings[0]).toHaveProperty('id');
        expect(bookings[0]).toHaveProperty('slotId', slotId);
        expect(bookings[0]).toHaveProperty('status');
      }
    }
  });
});

// Helper Functions

async function navigateToBookingPage(page: Page, slotId: string) {
  // Navigate to the booking page for a specific slot
  // Adjust URL based on your application's routing
  await page.goto(`/providers/${testData.provider.id}/book?slot=${slotId}`);

  // Wait for the page to be ready
  await page.waitForLoadState('networkidle');

  // Verify we're on the correct page
  await expect(page.locator('h1, h2').first()).toContainText(/book.*appointment/i);
}

async function fillBookingForm(page: Page, name: string, email: string, phone: string) {
  // Fill in the guest booking form
  await page.fill('input[name="guestName"]', name);
  await page.fill('input[name="guestEmail"]', email);
  await page.fill('input[name="guestPhone"]', phone);

  // Add any additional required fields
  const notesField = page.locator('textarea[name="notes"]');
  if (await notesField.isVisible()) {
    await notesField.fill(`Booking test for ${name}`);
  }

  // Accept terms if present
  const termsCheckbox = page.locator('input[type="checkbox"][name="terms"]');
  if (await termsCheckbox.isVisible()) {
    await termsCheckbox.check();
  }
}

async function submitBookingForm(page: Page): Promise<'success' | 'error'> {
  try {
    // Click the submit button
    await page.click('button[type="submit"]:has-text("Book"), button[type="submit"]:has-text("Confirm")');

    // Wait for either success or error response
    const result = await Promise.race([
      page.waitForURL('**/booking/confirmation/**', { timeout: 10000 })
        .then(() => 'success' as const),
      page.waitForSelector('text=/slot is no longer available/i', { timeout: 10000 })
        .then(() => 'error' as const),
      page.waitForSelector('text=/error|failed/i', { timeout: 10000 })
        .then(() => 'error' as const)
    ]);

    return result;
  } catch (error) {
    console.error('Booking submission error:', error);
    return 'error';
  }
}

// Additional test utilities for load testing scenarios
export const concurrentBookingScenarios = {
  /**
   * Simulates a flash sale scenario where many users try to book
   * limited slots at exactly the same time
   */
  async flashSaleScenario(browser: any, slotIds: string[], userCount: number) {
    const contexts = [];
    const results = { successful: 0, failed: 0 };

    for (let i = 0; i < userCount; i++) {
      const context = await browser.newContext();
      contexts.push(context);

      const page = await context.newPage();
      const randomSlot = slotIds[Math.floor(Math.random() * slotIds.length)];

      await navigateToBookingPage(page, randomSlot);
      await fillBookingForm(
        page,
        `Flash Sale User ${i}`,
        `flash${i}@test.com`,
        `083000000${i}`
      );
    }

    // Submit all at once
    const submissions = contexts.map(async (context) => {
      const page = context.pages()[0];
      return submitBookingForm(page);
    });

    const allResults = await Promise.allSettled(submissions);

    allResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value === 'success') {
        results.successful++;
      } else {
        results.failed++;
      }
    });

    // Clean up
    for (const context of contexts) {
      await context.close();
    }

    return results;
  },

  /**
   * Simulates gradual load increase to find the breaking point
   */
  async gradualLoadTest(browser: any, slotId: string, maxUsers: number = 20) {
    const results = [];

    for (let userCount = 2; userCount <= maxUsers; userCount += 2) {
      console.log(`Testing with ${userCount} concurrent users...`);

      const contexts = [];
      for (let i = 0; i < userCount; i++) {
        contexts.push(await browser.newContext());
      }

      // Measure response time
      const startTime = Date.now();

      const pages = await Promise.all(
        contexts.map(ctx => ctx.newPage())
      );

      await Promise.all(
        pages.map((page, i) =>
          navigateToBookingPage(page, slotId)
            .then(() => fillBookingForm(
              page,
              `Load Test ${i}`,
              `load${i}@test.com`,
              `084000000${i}`
            ))
        )
      );

      const submissions = await Promise.allSettled(
        pages.map(page => submitBookingForm(page))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = submissions.filter(
        r => r.status === 'fulfilled' && r.value === 'success'
      ).length;

      results.push({
        userCount,
        successCount,
        failureCount: userCount - successCount,
        duration,
        avgResponseTime: duration / userCount
      });

      // Clean up
      for (const context of contexts) {
        await context.close();
      }

      // Brief pause between test rounds
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }
};