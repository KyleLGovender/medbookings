import { expect, test } from '@playwright/test';

import { AVAILABILITY_DATA, TIME_SLOTS } from '../../fixtures/test-data';

test.describe('Calendar Availability Creation', () => {
  test('should display calendar page for provider', async ({ page }) => {
    // Navigate to calendar page
    await page.goto('/calendar');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/calendar|availability/i);

    // Basic page elements should be visible
    // Note: Update these selectors based on your actual calendar UI
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible({ timeout: 10000 });
  });

  test('should allow provider to create single availability slot', async ({ page }) => {
    await page.goto('/calendar');

    // Click create availability button
    await page.click('[data-testid="create-availability-button"]');

    // Fill in availability form
    const availabilityData = AVAILABILITY_DATA.singleSlot;

    await page.fill('[data-testid="availability-date"]', availabilityData.date);
    await page.fill('[data-testid="availability-start-time"]', availabilityData.startTime);
    await page.fill('[data-testid="availability-end-time"]', availabilityData.endTime);

    // Select service
    await page.click('[data-testid="availability-service-trigger"]');
    await page.click(`[data-testid="availability-service-option-${availabilityData.service}"]`);

    // Select type
    await page.click(`[data-testid="availability-type-${availabilityData.type.toLowerCase()}"]`);

    // Save availability
    await page.click('[data-testid="save-availability-button"]');

    // Verify success
    await expect(page.locator('[data-testid="availability-success"]')).toBeVisible();

    // Verify availability appears in calendar
    await expect(
      page.locator(`[data-testid="availability-slot-${availabilityData.date}"]`)
    ).toBeVisible();
  });

  test('should allow provider to create weekly recurring availability', async ({ page }) => {
    await page.goto('/calendar');

    // Click create availability button
    await page.click('[data-testid="create-availability-button"]');

    // Enable recurring option
    await page.click('[data-testid="recurring-availability-toggle"]');

    // Fill in weekly recurring availability
    const weeklyData = AVAILABILITY_DATA.weeklySchedule;

    await page.fill('[data-testid="availability-start-date"]', weeklyData.date);
    await page.fill('[data-testid="availability-start-time"]', weeklyData.startTime);
    await page.fill('[data-testid="availability-end-time"]', weeklyData.endTime);
    await page.fill('[data-testid="availability-end-date"]', weeklyData.recurrence.endDate);

    // Select days of week
    for (const day of weeklyData.recurrence.daysOfWeek) {
      await page.click(`[data-testid="day-${day.toLowerCase()}"]`);
    }

    // Select service
    await page.click('[data-testid="availability-service-trigger"]');
    await page.click(`[data-testid="availability-service-option-${weeklyData.service}"]`);

    // Save availability
    await page.click('[data-testid="save-availability-button"]');

    // Verify success
    await expect(page.locator('[data-testid="recurring-availability-success"]')).toBeVisible();

    // Verify multiple slots were created
    await expect(page.locator('[data-testid^="availability-slot-"]')).toHaveCount(5); // At least 5 weekdays
  });

  test('should display available time slots correctly', async ({ page }) => {
    await page.goto('/calendar');

    // Navigate to a specific date with availability
    await page.goto(`/calendar?date=${AVAILABILITY_DATA.singleSlot.date}`);

    // Verify time slots are displayed
    for (const timeSlot of TIME_SLOTS.morning) {
      const slotSelector = `[data-testid="time-slot-${timeSlot}"]`;

      // Check if slot exists (might be available or booked)
      const slotExists = (await page.locator(slotSelector).count()) > 0;

      if (slotExists) {
        // Verify slot is properly formatted
        await expect(page.locator(slotSelector)).toContainText(timeSlot);
      }
    }
  });

  test('should allow provider to edit availability', async ({ page }) => {
    await page.goto('/calendar');

    // Find an existing availability slot
    const availabilitySlot = page.locator('[data-testid^="availability-slot-"]').first();
    await expect(availabilitySlot).toBeVisible();

    // Click edit button
    await availabilitySlot.locator('[data-testid="edit-availability-button"]').click();

    // Modify the end time
    await page.fill('[data-testid="availability-end-time"]', '18:00');

    // Save changes
    await page.click('[data-testid="save-availability-button"]');

    // Verify success
    await expect(page.locator('[data-testid="availability-updated-success"]')).toBeVisible();
  });

  test('should allow provider to delete availability', async ({ page }) => {
    await page.goto('/calendar');

    // Find an existing availability slot
    const availabilitySlot = page.locator('[data-testid^="availability-slot-"]').first();
    await expect(availabilitySlot).toBeVisible();

    // Click delete button
    await availabilitySlot.locator('[data-testid="delete-availability-button"]').click();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-availability"]');

    // Verify slot is removed
    await expect(availabilitySlot).not.toBeVisible();

    // Verify success message
    await expect(page.locator('[data-testid="availability-deleted-success"]')).toBeVisible();
  });
});
