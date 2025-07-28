import { expect, test } from '@playwright/test';

import { TEST_AVAILABILITY_DATA } from '../../fixtures/test-data';
import { createTestProvider, createTestUsers, setupTestEnvironment } from '../../utils/database';
import { createAvailabilitySlot, deleteAvailability } from '../../utils/test-helpers';

test.describe('Provider Calendar Management', () => {
  let testUsers: any;
  let testProvider: any;

  test.beforeEach(async ({ page }) => {
    // Setup clean test environment
    await setupTestEnvironment();
    testUsers = await createTestUsers();
    testProvider = await createTestProvider(testUsers.provider.id, 'APPROVED');

    // Mock provider authentication
    await page.route('**/api/auth/session', async (route) => {
      const json = {
        user: {
          name: 'Test Provider',
          email: 'provider@test.com',
          image: 'https://via.placeholder.com/40',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      await route.fulfill({ json });
    });
  });

  test.describe('Availability Creation', () => {
    test('should display calendar management page', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Check page loaded correctly
      await expect(page.locator('h1')).toContainText('Manage Your Calendar');
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();

      // Should show create availability button
      await expect(page.locator('[data-testid="create-availability-button"]')).toBeVisible();

      // Should show calendar controls
      await expect(page.locator('[data-testid="calendar-month-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="calendar-view-selector"]')).toBeVisible();
    });

    test('should create single availability slot', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Click create availability
      await page.click('[data-testid="create-availability-button"]');

      // Should open availability creation modal
      await expect(page.locator('[data-testid="availability-creation-modal"]')).toBeVisible();

      // Fill availability details
      await createAvailabilitySlot(page, TEST_AVAILABILITY_DATA);

      // Should show success message
      await expect(page.locator('[data-testid="availability-created-success"]')).toContainText(
        'Availability created successfully'
      );

      // Should close modal
      await expect(page.locator('[data-testid="availability-creation-modal"]')).not.toBeVisible();

      // Should show availability in calendar
      const availabilitySlot = page.locator(
        `[data-testid="availability-slot-${TEST_AVAILABILITY_DATA.date}"]`
      );
      await expect(availabilitySlot).toBeVisible();
      await expect(availabilitySlot).toContainText(TEST_AVAILABILITY_DATA.service);
    });

    test('should create recurring availability slots', async ({ page }) => {
      await page.goto('/calendar/availability');

      await page.click('[data-testid="create-availability-button"]');

      // Fill basic availability details
      await page.fill('[data-testid="availability-date"]', '2024-12-01');
      await page.fill('[data-testid="availability-start-time"]', '09:00');
      await page.fill('[data-testid="availability-end-time"]', '17:00');

      // Select service
      await page.click('[data-testid="availability-service-trigger"]');
      await page.click('[data-testid="availability-service-option-General Consultation"]');

      // Enable recurring availability
      await page.check('[data-testid="recurring-availability-checkbox"]');

      // Configure recurrence pattern
      await page.selectOption('[data-testid="recurrence-pattern"]', 'WEEKLY');
      await page.fill('[data-testid="recurrence-count"]', '4');

      // Select recurring days
      await page.check('[data-testid="recurrence-monday"]');
      await page.check('[data-testid="recurrence-wednesday"]');
      await page.check('[data-testid="recurrence-friday"]');

      // Save recurring availability
      await page.click('[data-testid="save-availability-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="recurring-availability-success"]')).toContainText(
        'Recurring availability created successfully'
      );

      // Should show multiple slots in calendar
      await expect(page.locator('[data-testid^="availability-slot-2024-12"]')).toHaveCount(12); // 4 weeks × 3 days
    });

    test('should validate availability form', async ({ page }) => {
      await page.goto('/calendar/availability');

      await page.click('[data-testid="create-availability-button"]');

      // Try to save without required fields
      await page.click('[data-testid="save-availability-button"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="availability-date-error"]')).toContainText(
        'Date is required'
      );
      await expect(page.locator('[data-testid="availability-start-time-error"]')).toContainText(
        'Start time is required'
      );
      await expect(page.locator('[data-testid="availability-end-time-error"]')).toContainText(
        'End time is required'
      );
      await expect(page.locator('[data-testid="availability-service-error"]')).toContainText(
        'Service is required'
      );
    });

    test('should validate time range', async ({ page }) => {
      await page.goto('/calendar/availability');

      await page.click('[data-testid="create-availability-button"]');

      // Set end time before start time
      await page.fill('[data-testid="availability-date"]', '2024-12-01');
      await page.fill('[data-testid="availability-start-time"]', '17:00');
      await page.fill('[data-testid="availability-end-time"]', '09:00');

      await page.click('[data-testid="save-availability-button"]');

      // Should show validation error
      await expect(page.locator('[data-testid="time-range-error"]')).toContainText(
        'End time must be after start time'
      );
    });

    test('should prevent past date availability', async ({ page }) => {
      await page.goto('/calendar/availability');

      await page.click('[data-testid="create-availability-button"]');

      // Try to set availability for past date
      const pastDate = '2020-01-01';
      await page.fill('[data-testid="availability-date"]', pastDate);

      // Should show validation error
      await expect(page.locator('[data-testid="past-date-error"]')).toContainText(
        'Cannot create availability for past dates'
      );
    });
  });

  test.describe('Availability Management', () => {
    let availabilityId: string;

    test.beforeEach(async ({ page }) => {
      // Create a test availability slot
      await page.goto('/calendar/availability');
      await createAvailabilitySlot(page, TEST_AVAILABILITY_DATA);

      // Get the created availability ID (mock for testing)
      availabilityId = 'test-availability-123';
    });

    test('should view availability details', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Click on availability slot
      const availabilitySlot = page.locator(
        `[data-testid="availability-slot-${TEST_AVAILABILITY_DATA.date}"]`
      );
      await availabilitySlot.click();

      // Should open availability details modal
      await expect(page.locator('[data-testid="availability-details-modal"]')).toBeVisible();

      // Should show availability information
      await expect(page.locator('[data-testid="availability-service"]')).toContainText(
        TEST_AVAILABILITY_DATA.service
      );
      await expect(page.locator('[data-testid="availability-time"]')).toContainText(
        `${TEST_AVAILABILITY_DATA.startTime} - ${TEST_AVAILABILITY_DATA.endTime}`
      );
      await expect(page.locator('[data-testid="availability-type"]')).toContainText(
        TEST_AVAILABILITY_DATA.type
      );

      // Should show management buttons
      await expect(page.locator('[data-testid="edit-availability-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-availability-button"]')).toBeVisible();
    });

    test('should edit availability slot', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Click on availability slot
      const availabilitySlot = page.locator(
        `[data-testid="availability-slot-${TEST_AVAILABILITY_DATA.date}"]`
      );
      await availabilitySlot.click();

      // Click edit button
      await page.click('[data-testid="edit-availability-button"]');

      // Should open edit form
      await expect(page.locator('[data-testid="edit-availability-modal"]')).toBeVisible();

      // Update time range
      await page.fill('[data-testid="availability-start-time"]', '10:00');
      await page.fill('[data-testid="availability-end-time"]', '16:00');

      // Save changes
      await page.click('[data-testid="save-availability-changes-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="availability-updated-success"]')).toContainText(
        'Availability updated successfully'
      );

      // Should update display
      await availabilitySlot.click();
      await expect(page.locator('[data-testid="availability-time"]')).toContainText(
        '10:00 - 16:00'
      );
    });

    test('should delete availability slot', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Click on availability slot
      const availabilitySlot = page.locator(
        `[data-testid="availability-slot-${TEST_AVAILABILITY_DATA.date}"]`
      );
      await availabilitySlot.click();

      // Click delete button
      await page.click('[data-testid="delete-availability-button"]');

      // Should show confirmation dialog
      await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-confirmation-message"]')).toContainText(
        'Are you sure you want to delete this availability slot?'
      );

      // Confirm deletion
      await page.click('[data-testid="confirm-delete-availability"]');

      // Should show success message
      await expect(page.locator('[data-testid="availability-deleted-success"]')).toContainText(
        'Availability deleted successfully'
      );

      // Availability slot should be removed from calendar
      await expect(availabilitySlot).not.toBeVisible();
    });

    test('should cancel delete operation', async ({ page }) => {
      await page.goto('/calendar/availability');

      const availabilitySlot = page.locator(
        `[data-testid="availability-slot-${TEST_AVAILABILITY_DATA.date}"]`
      );
      await availabilitySlot.click();

      await page.click('[data-testid="delete-availability-button"]');

      // Cancel deletion
      await page.click('[data-testid="cancel-delete-availability"]');

      // Modal should close and availability should remain
      await expect(page.locator('[data-testid="delete-confirmation-modal"]')).not.toBeVisible();
      await expect(availabilitySlot).toBeVisible();
    });
  });

  test.describe('Calendar Views and Navigation', () => {
    test('should switch between calendar views', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Should default to month view
      await expect(page.locator('[data-testid="calendar-month-view"]')).toBeVisible();

      // Switch to week view
      await page.click('[data-testid="calendar-view-week"]');
      await expect(page.locator('[data-testid="calendar-week-view"]')).toBeVisible();

      // Switch to day view
      await page.click('[data-testid="calendar-view-day"]');
      await expect(page.locator('[data-testid="calendar-day-view"]')).toBeVisible();

      // Switch back to month view
      await page.click('[data-testid="calendar-view-month"]');
      await expect(page.locator('[data-testid="calendar-month-view"]')).toBeVisible();
    });

    test('should navigate between months', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Get current month
      const currentMonth = await page.locator('[data-testid="current-month-year"]').textContent();

      // Navigate to next month
      await page.click('[data-testid="next-month-button"]');

      // Should show different month
      const nextMonth = await page.locator('[data-testid="current-month-year"]').textContent();
      expect(nextMonth).not.toBe(currentMonth);

      // Navigate back to previous month
      await page.click('[data-testid="previous-month-button"]');

      // Should return to original month
      const returnedMonth = await page.locator('[data-testid="current-month-year"]').textContent();
      expect(returnedMonth).toBe(currentMonth);
    });

    test('should jump to specific month', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Click month selector
      await page.click('[data-testid="month-selector"]');

      // Should show month picker
      await expect(page.locator('[data-testid="month-picker"]')).toBeVisible();

      // Select different month
      await page.click('[data-testid="month-option-March"]');
      await page.click('[data-testid="year-option-2025"]');

      // Should navigate to selected month
      await expect(page.locator('[data-testid="current-month-year"]')).toContainText('March 2025');
    });

    test('should show today indicator', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Should highlight today's date
      const today = new Date().toISOString().split('T')[0];
      await expect(page.locator(`[data-testid="calendar-day-${today}"]`)).toHaveClass(/today/);
    });
  });

  test.describe('Availability Conflicts', () => {
    test('should detect overlapping availability', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Create first availability slot
      await createAvailabilitySlot(page, {
        date: '2024-12-01',
        startTime: '09:00',
        endTime: '12:00',
        service: 'General Consultation',
        type: 'ONLINE',
      });

      // Try to create overlapping slot
      await page.click('[data-testid="create-availability-button"]');
      await page.fill('[data-testid="availability-date"]', '2024-12-01');
      await page.fill('[data-testid="availability-start-time"]', '11:00');
      await page.fill('[data-testid="availability-end-time"]', '15:00');

      await page.click('[data-testid="save-availability-button"]');

      // Should show conflict warning
      await expect(page.locator('[data-testid="availability-conflict-warning"]')).toContainText(
        'This time slot overlaps with existing availability'
      );

      // Should offer to merge or replace options
      await expect(page.locator('[data-testid="merge-availability-option"]')).toBeVisible();
      await expect(page.locator('[data-testid="replace-availability-option"]')).toBeVisible();
    });

    test('should detect Google Calendar conflicts', async ({ page }) => {
      // Mock Google Calendar integration
      await page.route('**/api/calendar/google/events', async (route) => {
        const json = {
          events: [
            {
              id: 'google-event-1',
              summary: 'Doctor Appointment',
              start: { dateTime: '2024-12-01T14:00:00Z' },
              end: { dateTime: '2024-12-01T15:00:00Z' },
            },
          ],
        };
        await route.fulfill({ json });
      });

      await page.goto('/calendar/availability');

      // Try to create availability that conflicts with Google Calendar event
      await page.click('[data-testid="create-availability-button"]');
      await page.fill('[data-testid="availability-date"]', '2024-12-01');
      await page.fill('[data-testid="availability-start-time"]', '13:00');
      await page.fill('[data-testid="availability-end-time"]', '16:00');

      await page.click('[data-testid="save-availability-button"]');

      // Should show Google Calendar conflict warning
      await expect(page.locator('[data-testid="google-calendar-conflict"]')).toContainText(
        'This conflicts with your Google Calendar event: Doctor Appointment'
      );

      // Should allow to proceed anyway or cancel
      await expect(page.locator('[data-testid="proceed-anyway-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancel-creation-button"]')).toBeVisible();
    });
  });
});
