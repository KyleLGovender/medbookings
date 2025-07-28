import { expect, test } from '@playwright/test';

import { TEST_AVAILABILITY_DATA, TEST_ORGANIZATION_DATA } from '../../fixtures/test-data';
import {
  createTestOrganization,
  createTestProvider,
  createTestUsers,
  setupTestEnvironment,
} from '../../utils/database';
import {
  createAvailabilitySlot,
  deleteAvailability,
  deleteOrganization,
  deleteProviderProfile,
} from '../../utils/test-helpers';

test.describe('Deletion and Cleanup Journeys', () => {
  let testUsers: any;
  let testProvider: any;
  let testOrganization: any;

  test.beforeEach(async ({ page }) => {
    // Setup clean test environment
    await setupTestEnvironment();
    testUsers = await createTestUsers();
    testProvider = await createTestProvider(testUsers.provider.id, 'APPROVED');
    testOrganization = await createTestOrganization(testUsers.orgOwner.id, 'APPROVED');
  });

  test.describe('Availability Deletion', () => {
    test.beforeEach(async ({ page }) => {
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

    test('should delete single availability slot', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Create availability first
      await createAvailabilitySlot(page, TEST_AVAILABILITY_DATA);
      await expect(page.locator('[data-testid="availability-created-success"]')).toBeVisible();

      // Find and delete the availability
      const availabilitySlot = page.locator(
        `[data-testid="availability-slot-${TEST_AVAILABILITY_DATA.date}"]`
      );
      await availabilitySlot.click();

      await page.click('[data-testid="delete-availability-button"]');
      await page.click('[data-testid="confirm-delete-availability"]');

      // Verify deletion
      await expect(page.locator('[data-testid="availability-deleted-success"]')).toContainText(
        'Availability deleted successfully'
      );
      await expect(availabilitySlot).not.toBeVisible();
    });

    test('should delete recurring availability series', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Create recurring availability
      await page.click('[data-testid="create-availability-button"]');
      await page.fill('[data-testid="availability-date"]', '2024-12-01');
      await page.fill('[data-testid="availability-start-time"]', '09:00');
      await page.fill('[data-testid="availability-end-time"]', '10:00');

      await page.click('[data-testid="availability-service-trigger"]');
      await page.click('[data-testid="availability-service-option-General Consultation"]');

      // Enable recurring
      await page.check('[data-testid="recurring-availability-checkbox"]');
      await page.selectOption('[data-testid="recurrence-pattern"]', 'WEEKLY');
      await page.fill('[data-testid="recurrence-count"]', '3');
      await page.check('[data-testid="recurrence-monday"]');

      await page.click('[data-testid="save-availability-button"]');
      await expect(page.locator('[data-testid="recurring-availability-success"]')).toBeVisible();

      // Delete entire series
      const firstSlot = page.locator('[data-testid^="availability-slot-2024-12"]').first();
      await firstSlot.click();

      await page.click('[data-testid="delete-availability-button"]');

      // Should show series deletion option
      await expect(page.locator('[data-testid="delete-series-option"]')).toBeVisible();
      await page.click('[data-testid="delete-entire-series"]');

      await page.click('[data-testid="confirm-delete-series"]');

      // All recurring instances should be deleted
      await expect(page.locator('[data-testid="series-deleted-success"]')).toContainText(
        'Recurring availability series deleted successfully'
      );
      await expect(page.locator('[data-testid^="availability-slot-2024-12"]')).toHaveCount(0);
    });

    test('should delete single occurrence from recurring series', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Create recurring availability (3 weeks)
      await page.click('[data-testid="create-availability-button"]');
      await page.fill('[data-testid="availability-date"]', '2024-12-01');
      await page.fill('[data-testid="availability-start-time"]', '09:00');
      await page.fill('[data-testid="availability-end-time"]', '10:00');

      await page.click('[data-testid="availability-service-trigger"]');
      await page.click('[data-testid="availability-service-option-General Consultation"]');

      await page.check('[data-testid="recurring-availability-checkbox"]');
      await page.selectOption('[data-testid="recurrence-pattern"]', 'WEEKLY');
      await page.fill('[data-testid="recurrence-count"]', '3');
      await page.check('[data-testid="recurrence-monday"]');

      await page.click('[data-testid="save-availability-button"]');

      // Delete only one occurrence
      const secondSlot = page.locator('[data-testid="availability-slot-2024-12-08"]'); // Second Monday
      await secondSlot.click();

      await page.click('[data-testid="delete-availability-button"]');
      await page.click('[data-testid="delete-single-occurrence"]');
      await page.click('[data-testid="confirm-delete-occurrence"]');

      // Only the selected occurrence should be deleted
      await expect(page.locator('[data-testid="occurrence-deleted-success"]')).toContainText(
        'Availability occurrence deleted'
      );
      await expect(secondSlot).not.toBeVisible();

      // Other occurrences should remain
      await expect(page.locator('[data-testid="availability-slot-2024-12-01"]')).toBeVisible();
      await expect(page.locator('[data-testid="availability-slot-2024-12-15"]')).toBeVisible();
    });

    test('should prevent deletion of booked availability', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Mock availability with bookings
      await page.route('**/api/calendar/availability/*/delete', async (route) => {
        await route.fulfill({
          status: 400,
          json: {
            error: 'Cannot delete availability with existing bookings',
            bookingsCount: 2,
          },
        });
      });

      // Create availability
      await createAvailabilitySlot(page, TEST_AVAILABILITY_DATA);

      // Try to delete
      const availabilitySlot = page.locator(
        `[data-testid="availability-slot-${TEST_AVAILABILITY_DATA.date}"]`
      );
      await availabilitySlot.click();
      await page.click('[data-testid="delete-availability-button"]');
      await page.click('[data-testid="confirm-delete-availability"]');

      // Should show error message
      await expect(page.locator('[data-testid="deletion-error"]')).toContainText(
        'Cannot delete availability with existing bookings'
      );
      await expect(page.locator('[data-testid="bookings-count"]')).toContainText(
        '2 active bookings'
      );

      // Should offer to cancel bookings first
      await expect(page.locator('[data-testid="cancel-bookings-option"]')).toBeVisible();
    });

    test('should bulk delete multiple availability slots', async ({ page }) => {
      await page.goto('/calendar/availability');

      // Create multiple availability slots
      const dates = ['2024-12-01', '2024-12-02', '2024-12-03'];
      for (const date of dates) {
        await createAvailabilitySlot(page, { ...TEST_AVAILABILITY_DATA, date });
      }

      // Enter bulk selection mode
      await page.click('[data-testid="bulk-actions-button"]');
      await expect(page.locator('[data-testid="bulk-selection-mode"]')).toBeVisible();

      // Select multiple slots
      for (const date of dates) {
        await page.check(`[data-testid="select-availability-${date}"]`);
      }

      // Delete selected slots
      await page.click('[data-testid="bulk-delete-button"]');
      await page.click('[data-testid="confirm-bulk-delete"]');

      // All selected slots should be deleted
      await expect(page.locator('[data-testid="bulk-delete-success"]')).toContainText(
        '3 availability slots deleted successfully'
      );

      for (const date of dates) {
        await expect(page.locator(`[data-testid="availability-slot-${date}"]`)).not.toBeVisible();
      }
    });
  });

  test.describe('Provider Profile Deletion', () => {
    test.beforeEach(async ({ page }) => {
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

    test('should delete provider profile completely', async ({ page }) => {
      await page.goto('/providers/current/edit');

      // Navigate to danger zone
      await page.click('[data-testid="danger-zone-tab"]');

      // Should show deletion warning
      await expect(page.locator('[data-testid="deletion-warning"]')).toContainText(
        'This action cannot be undone'
      );
      await expect(page.locator('[data-testid="deletion-consequences"]')).toContainText(
        'All your availability, bookings, and profile data will be permanently deleted'
      );

      // Click delete profile button
      await page.click('[data-testid="delete-provider-button"]');

      // Should show confirmation modal
      await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-confirmation-text"]')).toContainText(
        'Type DELETE to confirm'
      );

      // Type confirmation
      await page.fill('[data-testid="delete-confirmation-input"]', 'DELETE');

      // Confirm deletion
      await page.click('[data-testid="confirm-delete-provider"]');

      // Should redirect to home page
      await page.waitForURL('/');
      await expect(page.locator('[data-testid="profile-deleted-message"]')).toContainText(
        'Your provider profile has been deleted successfully'
      );
    });

    test('should require exact confirmation text', async ({ page }) => {
      await page.goto('/providers/current/edit');

      await page.click('[data-testid="danger-zone-tab"]');
      await page.click('[data-testid="delete-provider-button"]');

      // Try with wrong confirmation text
      await page.fill('[data-testid="delete-confirmation-input"]', 'delete');
      await page.click('[data-testid="confirm-delete-provider"]');

      // Should show error
      await expect(page.locator('[data-testid="confirmation-error"]')).toContainText(
        'Please type DELETE exactly as shown'
      );

      // Modal should remain open
      await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
    });

    test('should prevent deletion with active bookings', async ({ page }) => {
      // Mock provider with active bookings
      await page.route('**/api/providers/current/delete', async (route) => {
        await route.fulfill({
          status: 400,
          json: {
            error: 'Cannot delete provider profile with active bookings',
            activeBookings: 3,
            nextBookingDate: '2024-12-01T09:00:00Z',
          },
        });
      });

      await page.goto('/providers/current/edit');
      await page.click('[data-testid="danger-zone-tab"]');
      await page.click('[data-testid="delete-provider-button"]');

      await page.fill('[data-testid="delete-confirmation-input"]', 'DELETE');
      await page.click('[data-testid="confirm-delete-provider"]');

      // Should show blocking error
      await expect(page.locator('[data-testid="deletion-blocked-error"]')).toContainText(
        'Cannot delete provider profile with active bookings'
      );
      await expect(page.locator('[data-testid="active-bookings-count"]')).toContainText(
        '3 active bookings'
      );

      // Should show next steps
      await expect(page.locator('[data-testid="cancel-bookings-first"]')).toContainText(
        'You must cancel all active bookings first'
      );
    });

    test('should export data before deletion', async ({ page }) => {
      await page.goto('/providers/current/edit');
      await page.click('[data-testid="danger-zone-tab"]');

      // Should show data export option
      await expect(page.locator('[data-testid="export-data-section"]')).toBeVisible();

      // Export data
      await page.click('[data-testid="export-data-button"]');

      // Should trigger download
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('provider-data-export');

      // Should show export success
      await expect(page.locator('[data-testid="export-success"]')).toContainText(
        'Data exported successfully'
      );
    });
  });

  test.describe('Organization Deletion', () => {
    test.beforeEach(async ({ page }) => {
      // Mock organization owner authentication
      await page.route('**/api/auth/session', async (route) => {
        const json = {
          user: {
            name: 'Test Org Owner',
            email: 'orgowner@test.com',
            image: 'https://via.placeholder.com/40',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        await route.fulfill({ json });
      });
    });

    test('should delete organization with confirmation', async ({ page }) => {
      await page.goto(`/organizations/${testOrganization.id}/edit`);

      // Navigate to danger zone
      await page.click('[data-testid="danger-zone-tab"]');

      // Should show deletion warnings
      await expect(page.locator('[data-testid="organization-deletion-warning"]')).toContainText(
        'This will permanently delete the organization'
      );
      await expect(page.locator('[data-testid="deletion-impact"]')).toContainText(
        'All members will lose access'
      );

      // Click delete organization
      await page.click('[data-testid="delete-organization-button"]');

      // Should show comprehensive confirmation modal
      await expect(page.locator('[data-testid="organization-delete-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="organization-name-confirmation"]')).toContainText(
        testOrganization.name
      );

      // Type organization name to confirm
      await page.fill('[data-testid="organization-name-input"]', testOrganization.name);

      // Final confirmation
      await page.click('[data-testid="final-delete-confirmation"]');

      // Should redirect to organizations list
      await page.waitForURL('/organizations');
      await expect(page.locator('[data-testid="organization-deleted-success"]')).toContainText(
        'Organization deleted successfully'
      );
    });

    test('should require exact organization name', async ({ page }) => {
      await page.goto(`/organizations/${testOrganization.id}/edit`);

      await page.click('[data-testid="danger-zone-tab"]');
      await page.click('[data-testid="delete-organization-button"]');

      // Try with wrong organization name
      await page.fill('[data-testid="organization-name-input"]', 'Wrong Name');
      await page.click('[data-testid="final-delete-confirmation"]');

      // Should show error
      await expect(page.locator('[data-testid="name-mismatch-error"]')).toContainText(
        'Organization name does not match'
      );
    });

    test('should prevent deletion with active members', async ({ page }) => {
      // Mock organization with active members
      await page.route(`**/api/organizations/${testOrganization.id}/delete`, async (route) => {
        await route.fulfill({
          status: 400,
          json: {
            error: 'Cannot delete organization with active members',
            activeMembersCount: 5,
            activeProvidersCount: 3,
          },
        });
      });

      await page.goto(`/organizations/${testOrganization.id}/edit`);
      await page.click('[data-testid="danger-zone-tab"]');
      await page.click('[data-testid="delete-organization-button"]');

      await page.fill('[data-testid="organization-name-input"]', testOrganization.name);
      await page.click('[data-testid="final-delete-confirmation"]');

      // Should show blocking error
      await expect(page.locator('[data-testid="deletion-blocked"]')).toContainText(
        'Cannot delete organization with active members'
      );
      await expect(page.locator('[data-testid="members-count"]')).toContainText('5 active members');
      await expect(page.locator('[data-testid="providers-count"]')).toContainText(
        '3 connected providers'
      );

      // Should show required actions
      await expect(page.locator('[data-testid="required-actions"]')).toContainText(
        'Remove all members and disconnect all providers first'
      );
    });

    test('should transfer organization ownership before deletion', async ({ page }) => {
      await page.goto(`/organizations/${testOrganization.id}/edit`);
      await page.click('[data-testid="danger-zone-tab"]');

      // Should show ownership transfer section
      await expect(page.locator('[data-testid="transfer-ownership-section"]')).toBeVisible();

      // Transfer ownership first
      await page.click('[data-testid="transfer-ownership-button"]');

      // Select new owner
      await page.selectOption('[data-testid="new-owner-select"]', 'admin@test.com');
      await page.fill('[data-testid="transfer-reason"]', 'Transferring before account deletion');

      await page.click('[data-testid="confirm-transfer"]');

      // Should show transfer success
      await expect(page.locator('[data-testid="ownership-transferred"]')).toContainText(
        'Ownership transferred successfully'
      );

      // Now deletion should be available
      await expect(page.locator('[data-testid="delete-organization-button"]')).toBeEnabled();
    });

    test('should export organization data before deletion', async ({ page }) => {
      await page.goto(`/organizations/${testOrganization.id}/edit`);
      await page.click('[data-testid="danger-zone-tab"]');

      // Export organization data
      await page.click('[data-testid="export-organization-data"]');

      // Should trigger download
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('organization-data-export');
      expect(download.suggestedFilename()).toContain(
        testOrganization.name.toLowerCase().replace(/\s+/g, '-')
      );

      // Should show export confirmation
      await expect(page.locator('[data-testid="organization-export-success"]')).toContainText(
        'Organization data exported successfully'
      );
    });
  });

  test.describe('Cascade Deletion Verification', () => {
    test('should verify all related data is cleaned up after provider deletion', async ({
      page,
    }) => {
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

      // Create availability and other provider data
      await page.goto('/calendar/availability');
      await createAvailabilitySlot(page, TEST_AVAILABILITY_DATA);

      // Delete provider profile
      await deleteProviderProfile(page);

      // Verify all data is cleaned up by trying to access provider resources
      await page.goto('/providers/current');

      // Should redirect to registration since provider no longer exists
      await page.waitForURL('/providers/new');
      await expect(page.locator('h1')).toContainText('Provider Registration');
    });

    test('should verify organization deletion cleans up all related resources', async ({
      page,
    }) => {
      // Mock organization owner authentication
      await page.route('**/api/auth/session', async (route) => {
        const json = {
          user: {
            name: 'Test Org Owner',
            email: 'orgowner@test.com',
            image: 'https://via.placeholder.com/40',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        await route.fulfill({ json });
      });

      // Delete organization
      await deleteOrganization(page, testOrganization.id);

      // Verify organization is no longer accessible
      await page.goto(`/organizations/${testOrganization.id}`);

      // Should show 404 or redirect to organizations list
      await expect(page.locator('[data-testid="organization-not-found"]'))
        .toBeVisible()
        .or(page.waitForURL('/organizations'));
    });
  });
});
