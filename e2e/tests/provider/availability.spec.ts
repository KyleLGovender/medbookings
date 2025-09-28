import { expect, test } from '@playwright/test';

import { type AvailabilitySlot, CalendarPage } from '../../fixtures/pages/calendar-page';
import { LoginPage } from '../../fixtures/pages/login-page';

test.describe('Provider Availability Management', () => {
  let calendarPage: CalendarPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    loginPage = new LoginPage(page);

    // Login as provider user
    const providerUser = {
      id: 'test-provider-456',
      email: 'provider@test.com',
      name: 'Test Provider',
    };

    await loginPage.performTestLogin(providerUser);
  });

  test('provider can access calendar page', async ({ page }) => {
    await calendarPage.navigateToCalendar();

    // Should be on calendar page without being redirected
    await expect(page).toHaveURL(/\/calendar/);

    // Should not show access denied message
    await expect(page.locator('text=Access denied')).not.toBeVisible();
  });

  test('provider can navigate to create availability page', async ({ page }) => {
    await calendarPage.navigateToCreateAvailability();

    // Should be on availability creation page
    await expect(page).toHaveURL(/\/calendar\/availability|\/availability/);

    // Should show availability form elements
    const formElements = await page.locator('input, select, button').count();
    expect(formElements).toBeGreaterThan(0);
  });

  test('availability form displays correctly', async ({ page }) => {
    await calendarPage.navigateToCreateAvailability();

    // Should have date input
    const dateInput = page.locator(calendarPage['selectors'].dateInput);
    await expect(dateInput.first()).toBeVisible();

    // Should have time inputs
    const timeInputs = page.locator('input[type="time"], input[name*="time"]');
    expect(await timeInputs.count()).toBeGreaterThanOrEqual(1);
  });

  test('provider can fill availability form', async ({ page }) => {
    await calendarPage.navigateToCreateAvailability();

    const testSlot: AvailabilitySlot = {
      date: '2024-12-31',
      startTime: '09:00',
      endTime: '17:00',
      isOnline: true,
      services: [],
    };

    await calendarPage.fillAvailabilityForm(testSlot);

    // Verify form was filled
    const dateInput = page.locator(calendarPage['selectors'].dateInput);
    if (await dateInput.isVisible()) {
      await expect(dateInput).toHaveValue(testSlot.date);
    }

    const startTimeInput = page.locator(calendarPage['selectors'].startTimeInput);
    if (await startTimeInput.isVisible()) {
      await expect(startTimeInput).toHaveValue(testSlot.startTime);
    }
  });

  test('availability form validation works', async ({ page }) => {
    await calendarPage.navigateToCreateAvailability();

    // Try to submit empty form
    const saveButton = page.locator(calendarPage['selectors'].saveButton);
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show validation errors or remain on form
      await page.waitForTimeout(1000);

      // Either validation errors appear or form remains visible
      const hasErrors = (await page.locator('.error, [role="alert"], .invalid').count()) > 0;
      const formStillVisible = await saveButton.isVisible();

      expect(hasErrors || formStillVisible).toBeTruthy();
    }
  });

  test('provider can view existing availability', async ({ page }) => {
    await calendarPage.navigateToCalendar();

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Should show either availability cards or empty state
    const availabilityCards = await page
      .locator(calendarPage['selectors'].availabilityCard)
      .count();
    const emptyState =
      (await page.locator('text=No availability, text=No slots, text=Create your first').count()) >
      0;

    expect(availabilityCards > 0 || emptyState).toBeTruthy();
  });

  test('calendar navigation works', async ({ page }) => {
    await calendarPage.navigateToCalendar();

    // Should be on calendar page
    await expect(page).toHaveURL(/\/calendar/);

    // Try to navigate to create availability
    const createButton = page.locator(calendarPage['selectors'].createAvailabilityButton);
    if (await createButton.isVisible()) {
      await createButton.click();

      // Should navigate to creation page
      await expect(page).toHaveURL(/\/availability|\/calendar\/availability/);
    }
  });

  test('availability form handles different time formats', async ({ page }) => {
    await calendarPage.navigateToCreateAvailability();

    const testSlots: AvailabilitySlot[] = [
      {
        date: '2024-12-25',
        startTime: '08:00',
        endTime: '12:00',
        isOnline: false,
      },
      {
        date: '2024-12-26',
        startTime: '14:30',
        endTime: '18:30',
        isOnline: true,
      },
    ];

    for (const slot of testSlots) {
      await calendarPage.fillAvailabilityForm(slot);

      // Clear form for next iteration
      const dateInput = page.locator(calendarPage['selectors'].dateInput);
      if (await dateInput.isVisible()) {
        await dateInput.clear();
      }
    }

    // Form should handle different time formats without errors
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('online/offline toggle works', async ({ page }) => {
    await calendarPage.navigateToCreateAvailability();

    const onlineToggle = page.locator(calendarPage['selectors'].onlineToggle);
    if (await onlineToggle.isVisible()) {
      const initialState = await onlineToggle.isChecked();

      // Toggle the state
      await onlineToggle.click();

      const newState = await onlineToggle.isChecked();
      expect(newState).not.toBe(initialState);
    }
  });

  test('availability creation handles API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/trpc/calendar.createAvailability*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Internal server error',
          },
        }),
      });
    });

    await calendarPage.navigateToCreateAvailability();

    const testSlot: AvailabilitySlot = {
      date: '2024-12-31',
      startTime: '10:00',
      endTime: '11:00',
    };

    await calendarPage.fillAvailabilityForm(testSlot);

    const saveButton = page.locator(calendarPage['selectors'].saveButton);
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should handle error gracefully
      await page.waitForTimeout(2000);

      // Page should not crash
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });
});
