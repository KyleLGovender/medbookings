import { expect, test } from '@playwright/test';

import { APPROVAL_NOTES, REJECTION_REASONS } from '../../fixtures/test-data';
import { createTestProvider, createTestUsers, setupTestEnvironment } from '../../utils/database';
import { adminApproveProvider, adminRejectProvider } from '../../utils/test-helpers';

test.describe('Provider Approval Workflow', () => {
  let testUsers: any;
  let testProvider: any;

  test.beforeEach(async ({ page }) => {
    // Setup clean test environment
    await setupTestEnvironment();
    testUsers = await createTestUsers();
    testProvider = await createTestProvider(testUsers.provider.id);
  });

  test.describe('Admin Provider Review', () => {
    test.beforeEach(async ({ page }) => {
      // Mock admin authentication
      await page.route('**/api/auth/session', async (route) => {
        const json = {
          user: {
            name: 'Test Admin',
            email: 'admin@test.com',
            image: 'https://via.placeholder.com/40',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        await route.fulfill({ json });
      });
    });

    test('should display pending providers for admin review', async ({ page }) => {
      await page.goto('/admin/providers');

      // Check page loaded correctly
      await expect(page.locator('h1')).toContainText('Provider Management');

      // Should show pending providers by default
      await expect(page.locator('[data-testid="status-filter"]')).toHaveValue('PENDING_APPROVAL');

      // Should display the test provider
      const providerCard = page.locator(`[data-testid="provider-${testProvider.id}"]`);
      await expect(providerCard).toBeVisible();
      await expect(providerCard.locator('[data-testid="provider-name"]')).toContainText(
        'Dr. John Doe'
      );
      await expect(providerCard.locator('[data-testid="provider-status"]')).toContainText(
        'Pending Approval'
      );
    });

    test('should show provider details for admin review', async ({ page }) => {
      await page.goto(`/admin/providers/${testProvider.id}`);

      // Check provider details are displayed
      await expect(page.locator('[data-testid="provider-name"]')).toContainText('Dr. John Doe');
      await expect(page.locator('[data-testid="provider-email"]')).toContainText(
        'provider@test.com'
      );
      await expect(page.locator('[data-testid="provider-phone"]')).toContainText('+1234567890');
      await expect(page.locator('[data-testid="provider-experience"]')).toContainText('10 years');

      // Should show approval actions
      await expect(page.locator('[data-testid="approve-provider-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="reject-provider-button"]')).toBeVisible();

      // Should show requirements section
      await expect(page.locator('[data-testid="requirements-section"]')).toBeVisible();
    });

    test('should successfully approve provider', async ({ page }) => {
      await page.goto(`/admin/providers/${testProvider.id}`);

      // Click approve button
      await page.click('[data-testid="approve-provider-button"]');

      // Should show approval modal
      await expect(page.locator('[data-testid="approval-modal"]')).toBeVisible();

      // Fill approval notes
      await page.fill('[data-testid="approval-notes"]', APPROVAL_NOTES.provider);

      // Confirm approval
      await page.click('[data-testid="confirm-approve-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="approval-success"]')).toContainText(
        'Provider approved successfully'
      );

      // Status should be updated
      await expect(page.locator('[data-testid="provider-status"]')).toContainText('Approved');

      // Approval actions should be hidden
      await expect(page.locator('[data-testid="approve-provider-button"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="reject-provider-button"]')).not.toBeVisible();
    });

    test('should successfully reject provider with reason', async ({ page }) => {
      await page.goto(`/admin/providers/${testProvider.id}`);

      // Click reject button
      await page.click('[data-testid="reject-provider-button"]');

      // Should show rejection modal
      await expect(page.locator('[data-testid="rejection-modal"]')).toBeVisible();

      // Fill rejection reason (required)
      await page.fill('[data-testid="rejection-reason"]', REJECTION_REASONS.provider);

      // Confirm rejection
      await page.click('[data-testid="confirm-reject-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="rejection-success"]')).toContainText(
        'Provider rejected'
      );

      // Status should be updated
      await expect(page.locator('[data-testid="provider-status"]')).toContainText('Rejected');

      // Should show rejection reason
      await expect(page.locator('[data-testid="rejection-reason-display"]')).toContainText(
        REJECTION_REASONS.provider
      );
    });

    test('should require rejection reason', async ({ page }) => {
      await page.goto(`/admin/providers/${testProvider.id}`);

      // Click reject button
      await page.click('[data-testid="reject-provider-button"]');

      // Try to confirm without reason
      await page.click('[data-testid="confirm-reject-button"]');

      // Should show validation error
      await expect(page.locator('[data-testid="rejection-reason-error"]')).toContainText(
        'Rejection reason is required'
      );

      // Modal should still be open
      await expect(page.locator('[data-testid="rejection-modal"]')).toBeVisible();
    });

    test('should filter providers by status', async ({ page }) => {
      // Create approved provider for testing
      const approvedProvider = await createTestProvider(testUsers.regular.id, 'APPROVED');

      await page.goto('/admin/providers');

      // Test pending filter (default)
      await expect(page.locator(`[data-testid="provider-${testProvider.id}"]`)).toBeVisible();
      await expect(
        page.locator(`[data-testid="provider-${approvedProvider.id}"]`)
      ).not.toBeVisible();

      // Switch to approved filter
      await page.selectOption('[data-testid="status-filter"]', 'APPROVED');

      // Should show approved provider, hide pending
      await expect(page.locator(`[data-testid="provider-${approvedProvider.id}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="provider-${testProvider.id}"]`)).not.toBeVisible();

      // Switch to all providers
      await page.selectOption('[data-testid="status-filter"]', 'ALL');

      // Should show both providers
      await expect(page.locator(`[data-testid="provider-${testProvider.id}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="provider-${approvedProvider.id}"]`)).toBeVisible();
    });

    test('should search providers by name', async ({ page }) => {
      await page.goto('/admin/providers');

      // Search for specific provider
      await page.fill('[data-testid="provider-search"]', 'John');

      // Should show matching provider
      await expect(page.locator(`[data-testid="provider-${testProvider.id}"]`)).toBeVisible();

      // Search for non-existent provider
      await page.fill('[data-testid="provider-search"]', 'NonExistent');

      // Should show no results
      await expect(page.locator(`[data-testid="provider-${testProvider.id}"]`)).not.toBeVisible();
      await expect(page.locator('[data-testid="no-providers-found"]')).toContainText(
        'No providers found'
      );
    });
  });

  test.describe('Provider Notifications', () => {
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

    test('should show approval notification to provider', async ({ page }) => {
      // First approve the provider as admin
      const adminPage = await page.context().newPage();
      await adminPage.route('**/api/auth/session', async (route) => {
        const json = {
          user: {
            name: 'Test Admin',
            email: 'admin@test.com',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        await route.fulfill({ json });
      });

      await adminApproveProvider(adminPage, testProvider.id);
      await adminPage.close();

      // Now check provider's view
      await page.goto('/providers/current');

      // Should show approval status
      await expect(page.locator('[data-testid="provider-status"]')).toContainText('Approved');
      await expect(page.locator('[data-testid="approval-notification"]')).toContainText(
        'Congratulations! Your provider application has been approved'
      );

      // Should show next steps
      await expect(page.locator('[data-testid="next-steps"]')).toBeVisible();
    });

    test('should show rejection notification with reason', async ({ page }) => {
      // First reject the provider as admin
      const adminPage = await page.context().newPage();
      await adminPage.route('**/api/auth/session', async (route) => {
        const json = {
          user: {
            name: 'Test Admin',
            email: 'admin@test.com',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        await route.fulfill({ json });
      });

      await adminRejectProvider(adminPage, testProvider.id, REJECTION_REASONS.provider);
      await adminPage.close();

      // Now check provider's view
      await page.goto('/providers/current');

      // Should show rejection status and reason
      await expect(page.locator('[data-testid="provider-status"]')).toContainText('Rejected');
      await expect(page.locator('[data-testid="rejection-notification"]')).toContainText(
        'Unfortunately, your provider application was not approved'
      );
      await expect(page.locator('[data-testid="rejection-reason"]')).toContainText(
        REJECTION_REASONS.provider
      );

      // Should show resubmission option
      await expect(page.locator('[data-testid="resubmit-button"]')).toBeVisible();
    });
  });
});
