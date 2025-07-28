import { expect, test } from '@playwright/test';

import { TEST_ORGANIZATION_DATA, TEST_PROVIDER_DATA } from '../../fixtures/test-data';
import { createTestUsers, setupTestEnvironment } from '../../utils/database';
import {
  fillOrganizationRegistrationForm,
  fillProviderRegistrationForm,
  uploadRequirementDocument,
} from '../../utils/test-helpers';

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup clean test environment
    await setupTestEnvironment();

    // Mock authenticated session
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
  });

  test.describe('Provider Registration', () => {
    test('should complete provider registration successfully', async ({ page }) => {
      await page.goto('/providers/new');

      // Check page loaded correctly
      await expect(page.locator('h1')).toContainText('Provider Registration');

      // Fill out the registration form
      await fillProviderRegistrationForm(page, TEST_PROVIDER_DATA);

      // Submit the form
      await page.click('[data-testid="submit-provider-registration"]');

      // Should show success message
      await expect(page.locator('[data-testid="registration-success"]')).toContainText(
        'Registration submitted successfully'
      );

      // Should redirect to provider profile page
      await page.waitForURL('/providers/current');

      // Verify provider data is displayed
      await expect(page.locator('[data-testid="provider-name"]')).toContainText(
        `${TEST_PROVIDER_DATA.firstName} ${TEST_PROVIDER_DATA.lastName}`
      );
      await expect(page.locator('[data-testid="provider-status"]')).toContainText(
        'Pending Approval'
      );
    });

    test('should show validation errors for incomplete form', async ({ page }) => {
      await page.goto('/providers/new');

      // Try to submit without filling required fields
      await page.click('[data-testid="submit-provider-registration"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="firstName-error"]')).toContainText(
        'First name is required'
      );
      await expect(page.locator('[data-testid="lastName-error"]')).toContainText(
        'Last name is required'
      );
      await expect(page.locator('[data-testid="phoneNumber-error"]')).toContainText(
        'Phone number is required'
      );
    });

    test('should handle requirement document upload', async ({ page }) => {
      await page.goto('/providers/new');

      // Fill basic form
      await fillProviderRegistrationForm(page, TEST_PROVIDER_DATA);

      // Upload requirements
      await uploadRequirementDocument(
        page,
        'Medical License',
        'e2e/fixtures/files/medical-license.pdf'
      );
      await uploadRequirementDocument(
        page,
        'Professional Insurance',
        'e2e/fixtures/files/insurance-certificate.pdf'
      );

      // Submit registration
      await page.click('[data-testid="submit-provider-registration"]');

      // Verify success
      await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();

      // Check requirements are marked as submitted
      await page.waitForURL('/providers/current');
      await expect(
        page.locator('[data-testid="requirement-Medical License-status"]')
      ).toContainText('Submitted');
      await expect(
        page.locator('[data-testid="requirement-Professional Insurance-status"]')
      ).toContainText('Submitted');
    });

    test('should allow editing provider information after registration', async ({ page }) => {
      // First complete registration
      await page.goto('/providers/new');
      await fillProviderRegistrationForm(page, TEST_PROVIDER_DATA);
      await page.click('[data-testid="submit-provider-registration"]');
      await page.waitForURL('/providers/current');

      // Navigate to edit page
      await page.click('[data-testid="edit-provider-button"]');
      await page.waitForURL('/providers/current/edit');

      // Update bio
      const updatedBio = 'Updated bio for testing purposes';
      await page.fill('[data-testid="bio"]', updatedBio);

      // Save changes
      await page.click('[data-testid="save-changes-button"]');

      // Verify update
      await expect(page.locator('[data-testid="save-success"]')).toContainText(
        'Changes saved successfully'
      );
      await expect(page.locator('[data-testid="bio"]')).toHaveValue(updatedBio);
    });
  });

  test.describe('Organization Registration', () => {
    test('should complete organization registration successfully', async ({ page }) => {
      await page.goto('/organizations/new');

      // Check page loaded correctly
      await expect(page.locator('h1')).toContainText('Organization Registration');

      // Fill out the registration form
      await fillOrganizationRegistrationForm(page, TEST_ORGANIZATION_DATA);

      // Submit the form
      await page.click('[data-testid="submit-organization-registration"]');

      // Should show success message
      await expect(page.locator('[data-testid="registration-success"]')).toContainText(
        'Organization registered successfully'
      );

      // Should redirect to organization page
      await page.waitForURL(/\/organizations\/\d+/);

      // Verify organization data is displayed
      await expect(page.locator('[data-testid="organization-name"]')).toContainText(
        TEST_ORGANIZATION_DATA.name
      );
      await expect(page.locator('[data-testid="organization-status"]')).toContainText(
        'Pending Approval'
      );
    });

    test('should validate organization form fields', async ({ page }) => {
      await page.goto('/organizations/new');

      // Try to submit without filling required fields
      await page.click('[data-testid="submit-organization-registration"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="organizationName-error"]')).toContainText(
        'Organization name is required'
      );
      await expect(page.locator('[data-testid="organizationPhone-error"]')).toContainText(
        'Phone number is required'
      );
      await expect(page.locator('[data-testid="organizationEmail-error"]')).toContainText(
        'Email is required'
      );
    });

    test('should handle organization location setup', async ({ page }) => {
      await page.goto('/organizations/new');

      // Fill registration form
      await fillOrganizationRegistrationForm(page, TEST_ORGANIZATION_DATA);
      await page.click('[data-testid="submit-organization-registration"]');

      // Wait for redirect to organization page
      await page.waitForURL(/\/organizations\/\d+/);

      // Navigate to locations setup
      await page.click('[data-testid="setup-locations-button"]');
      await page.waitForURL(/\/organizations\/\d+\/edit\/locations/);

      // Add a location
      await page.click('[data-testid="add-location-button"]');
      await page.fill('[data-testid="location-name"]', 'Main Clinic');
      await page.fill('[data-testid="location-address"]', '456 Medical Ave, Health City, HC 67890');

      // Save location
      await page.click('[data-testid="save-location-button"]');

      // Verify location was added
      await expect(page.locator('[data-testid="location-Main Clinic"]')).toBeVisible();
      await expect(page.locator('[data-testid="location-success"]')).toContainText(
        'Location added successfully'
      );
    });
  });

  test.describe('Invitation Acceptance', () => {
    test('should accept provider invitation to organization', async ({ page }) => {
      // Setup: Create organization and invitation token
      const testUsers = await createTestUsers();

      // Mock invitation token validation
      await page.route('**/api/invitations/*/validate', async (route) => {
        const json = {
          valid: true,
          invitation: {
            id: 'test-invitation-id',
            type: 'PROVIDER_TO_ORGANIZATION',
            organizationName: 'Test Medical Clinic',
            inviterName: 'Dr. Admin',
            status: 'PENDING',
          },
        };
        await route.fulfill({ json });
      });

      // Navigate to invitation page
      await page.goto('/invitation/test-token-123');

      // Should show invitation details
      await expect(page.locator('[data-testid="invitation-type"]')).toContainText(
        'Organization Invitation'
      );
      await expect(page.locator('[data-testid="organization-name"]')).toContainText(
        'Test Medical Clinic'
      );
      await expect(page.locator('[data-testid="inviter-name"]')).toContainText('Dr. Admin');

      // Accept the invitation
      await page.click('[data-testid="accept-invitation-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="acceptance-success"]')).toContainText(
        'Invitation accepted successfully'
      );

      // Should redirect to organization page
      await page.waitForURL(/\/organizations\/\d+/);

      // Verify connection was created
      await expect(page.locator('[data-testid="member-status"]')).toContainText('Active Member');
    });

    test('should handle invalid invitation tokens', async ({ page }) => {
      // Mock invalid token response
      await page.route('**/api/invitations/*/validate', async (route) => {
        await route.fulfill({
          status: 404,
          json: { error: 'Invitation not found or expired' },
        });
      });

      await page.goto('/invitation/invalid-token');

      // Should show error message
      await expect(page.locator('[data-testid="invitation-error"]')).toContainText(
        'Invitation not found or expired'
      );

      // Should show link to go back
      await expect(page.locator('[data-testid="back-to-home-link"]')).toBeVisible();
    });

    test('should reject invitation', async ({ page }) => {
      // Mock valid invitation
      await page.route('**/api/invitations/*/validate', async (route) => {
        const json = {
          valid: true,
          invitation: {
            id: 'test-invitation-id',
            type: 'PROVIDER_TO_ORGANIZATION',
            organizationName: 'Test Medical Clinic',
            inviterName: 'Dr. Admin',
            status: 'PENDING',
          },
        };
        await route.fulfill({ json });
      });

      await page.goto('/invitation/test-token-123');

      // Reject the invitation
      await page.click('[data-testid="reject-invitation-button"]');

      // Should show confirmation dialog
      await expect(page.locator('[data-testid="reject-confirmation-dialog"]')).toBeVisible();

      // Confirm rejection
      await page.click('[data-testid="confirm-reject-button"]');

      // Should show rejection success
      await expect(page.locator('[data-testid="rejection-success"]')).toContainText(
        'Invitation rejected'
      );

      // Should redirect to home
      await page.waitForURL('/');
    });
  });
});
