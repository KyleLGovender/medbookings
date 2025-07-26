import { test, expect } from '@playwright/test';
import { 
  setupTestEnvironment, 
  createTestUsers, 
  createTestProvider 
} from '../../utils/database';
import { uploadRequirementDocument } from '../../utils/test-helpers';
import { TEST_PROVIDER_DATA } from '../../fixtures/test-data';

test.describe('Provider Profile Editing', () => {
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

  test.describe('Basic Information Editing', () => {
    test('should display current provider information', async ({ page }) => {
      await page.goto('/providers/current/edit/basic-info');
      
      // Check page loaded correctly
      await expect(page.locator('h1')).toContainText('Edit Basic Information');
      
      // Check current values are displayed
      await expect(page.locator('[data-testid="firstName"]')).toHaveValue('Dr. John');
      await expect(page.locator('[data-testid="lastName"]')).toHaveValue('Doe');
      await expect(page.locator('[data-testid="phoneNumber"]')).toHaveValue('+1234567890');
      await expect(page.locator('[data-testid="bio"]')).toHaveValue('Experienced general practitioner');
      await expect(page.locator('[data-testid="yearsOfExperience"]')).toHaveValue('10');
    });

    test('should successfully update basic information', async ({ page }) => {
      await page.goto('/providers/current/edit/basic-info');
      
      // Update fields
      const updatedData = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        phoneNumber: '+1-555-0199',
        bio: 'Updated bio with more detailed experience information and specializations.',
        yearsOfExperience: '15',
      };
      
      await page.fill('[data-testid="firstName"]', updatedData.firstName);
      await page.fill('[data-testid="lastName"]', updatedData.lastName);
      await page.fill('[data-testid="phoneNumber"]', updatedData.phoneNumber);
      await page.fill('[data-testid="bio"]', updatedData.bio);
      await page.fill('[data-testid="yearsOfExperience"]', updatedData.yearsOfExperience);
      
      // Save changes
      await page.click('[data-testid="save-basic-info-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="save-success"]')).toContainText('Basic information updated successfully');
      
      // Verify changes are saved (refresh and check)
      await page.reload();
      await expect(page.locator('[data-testid="firstName"]')).toHaveValue(updatedData.firstName);
      await expect(page.locator('[data-testid="lastName"]')).toHaveValue(updatedData.lastName);
      await expect(page.locator('[data-testid="bio"]')).toHaveValue(updatedData.bio);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/providers/current/edit/basic-info');
      
      // Clear required fields
      await page.fill('[data-testid="firstName"]', '');
      await page.fill('[data-testid="lastName"]', '');
      await page.fill('[data-testid="phoneNumber"]', '');
      
      // Try to save
      await page.click('[data-testid="save-basic-info-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="firstName-error"]')).toContainText('First name is required');
      await expect(page.locator('[data-testid="lastName-error"]')).toContainText('Last name is required');
      await expect(page.locator('[data-testid="phoneNumber-error"]')).toContainText('Phone number is required');
    });

    test('should validate phone number format', async ({ page }) => {
      await page.goto('/providers/current/edit/basic-info');
      
      // Enter invalid phone number
      await page.fill('[data-testid="phoneNumber"]', 'invalid-phone');
      
      // Try to save
      await page.click('[data-testid="save-basic-info-button"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="phoneNumber-error"]')).toContainText('Please enter a valid phone number');
    });

    test('should validate years of experience', async ({ page }) => {
      await page.goto('/providers/current/edit/basic-info');
      
      // Enter invalid years of experience
      await page.fill('[data-testid="yearsOfExperience"]', '-5');
      
      // Try to save
      await page.click('[data-testid="save-basic-info-button"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="yearsOfExperience-error"]')).toContainText('Years of experience must be 0 or greater');
    });
  });

  test.describe('Services Management', () => {
    test('should display available services', async ({ page }) => {
      await page.goto('/providers/current/edit/services');
      
      // Check page loaded correctly
      await expect(page.locator('h1')).toContainText('Manage Services');
      
      // Should show available services
      await expect(page.locator('[data-testid="service-General Consultation"]')).toBeVisible();
      await expect(page.locator('[data-testid="service-Physical Therapy Session"]')).toBeVisible();
    });

    test('should add service with custom pricing', async ({ page }) => {
      await page.goto('/providers/current/edit/services');
      
      // Select a service
      const serviceCard = page.locator('[data-testid="service-General Consultation"]');
      await serviceCard.click();
      
      // Should expand service configuration panel
      await expect(page.locator('[data-testid="service-config-General Consultation"]')).toBeVisible();
      
      // Configure custom pricing
      await page.fill('[data-testid="custom-price-General Consultation"]', '175.00');
      await page.fill('[data-testid="custom-duration-General Consultation"]', '45');
      
      // Enable the service
      await page.check('[data-testid="enable-service-General Consultation"]');
      
      // Save changes
      await page.click('[data-testid="save-services-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="services-save-success"]')).toContainText('Services updated successfully');
      
      // Verify service is enabled
      await expect(page.locator('[data-testid="service-General Consultation"]')).toHaveClass(/enabled/);
    });

    test('should configure service availability types', async ({ page }) => {
      await page.goto('/providers/current/edit/services');
      
      // Select service
      const serviceCard = page.locator('[data-testid="service-General Consultation"]');
      await serviceCard.click();
      
      // Configure availability types
      await page.check('[data-testid="online-available-General Consultation"]');
      await page.check('[data-testid="in-person-available-General Consultation"]');
      
      // Enable service
      await page.check('[data-testid="enable-service-General Consultation"]');
      
      // Save
      await page.click('[data-testid="save-services-button"]');
      
      // Verify configuration
      await expect(page.locator('[data-testid="services-save-success"]')).toBeVisible();
      
      // Check that both availability types are saved
      await page.reload();
      await serviceCard.click();
      await expect(page.locator('[data-testid="online-available-General Consultation"]')).toBeChecked();
      await expect(page.locator('[data-testid="in-person-available-General Consultation"]')).toBeChecked();
    });

    test('should disable service', async ({ page }) => {
      // First enable a service
      await page.goto('/providers/current/edit/services');
      const serviceCard = page.locator('[data-testid="service-General Consultation"]');
      await serviceCard.click();
      await page.check('[data-testid="enable-service-General Consultation"]');
      await page.click('[data-testid="save-services-button"]');
      await expect(page.locator('[data-testid="services-save-success"]')).toBeVisible();
      
      // Now disable it
      await serviceCard.click();
      await page.uncheck('[data-testid="enable-service-General Consultation"]');
      await page.click('[data-testid="save-services-button"]');
      
      // Should show success and service should be disabled
      await expect(page.locator('[data-testid="services-save-success"]')).toContainText('Services updated successfully');
      await expect(page.locator('[data-testid="service-General Consultation"]')).not.toHaveClass(/enabled/);
    });
  });

  test.describe('Regulatory Requirements', () => {
    test('should display requirement submission status', async ({ page }) => {
      await page.goto('/providers/current/edit/regulatory-requirements');
      
      // Check page loaded correctly
      await expect(page.locator('h1')).toContainText('Regulatory Requirements');
      
      // Should show requirement types
      await expect(page.locator('[data-testid="requirement-Medical License"]')).toBeVisible();
      await expect(page.locator('[data-testid="requirement-Professional Insurance"]')).toBeVisible();
      
      // Should show upload buttons for unsubmitted requirements
      await expect(page.locator('[data-testid="upload-Medical License"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-Professional Insurance"]')).toBeVisible();
    });

    test('should upload requirement document', async ({ page }) => {
      await page.goto('/providers/current/edit/regulatory-requirements');
      
      // Upload medical license
      await uploadRequirementDocument(page, 'Medical License', 'e2e/fixtures/files/medical-license.pdf');
      
      // Should show success message
      await expect(page.locator('[data-testid="upload-success-Medical License"]')).toContainText('Document uploaded successfully');
      
      // Should update requirement status
      await expect(page.locator('[data-testid="requirement-status-Medical License"]')).toContainText('Submitted');
      
      // Upload button should be replaced with view/replace options
      await expect(page.locator('[data-testid="view-document-Medical License"]')).toBeVisible();
      await expect(page.locator('[data-testid="replace-document-Medical License"]')).toBeVisible();
    });

    test('should replace existing requirement document', async ({ page }) => {
      await page.goto('/providers/current/edit/regulatory-requirements');
      
      // First upload a document
      await uploadRequirementDocument(page, 'Medical License', 'e2e/fixtures/files/medical-license.pdf');
      await expect(page.locator('[data-testid="upload-success-Medical License"]')).toBeVisible();
      
      // Now replace it
      await page.click('[data-testid="replace-document-Medical License"]');
      
      // Should show upload interface again
      await expect(page.locator('[data-testid="upload-Medical License"]')).toBeVisible();
      
      // Upload replacement
      await uploadRequirementDocument(page, 'Medical License', 'e2e/fixtures/files/medical-license.pdf');
      
      // Should show replacement success
      await expect(page.locator('[data-testid="replace-success-Medical License"]')).toContainText('Document updated successfully');
    });

    test('should view uploaded requirement document', async ({ page }) => {
      await page.goto('/providers/current/edit/regulatory-requirements');
      
      // Upload document first
      await uploadRequirementDocument(page, 'Medical License', 'e2e/fixtures/files/medical-license.pdf');
      
      // Click view document
      await page.click('[data-testid="view-document-Medical License"]');
      
      // Should open document viewer or new tab
      // Note: This depends on browser settings and document type
      await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();
    });

    test('should show requirement approval status', async ({ page }) => {
      // Mock requirement with approved status
      await page.route('**/api/providers/current/requirements', async (route) => {
        const json = {
          requirements: [
            {
              id: 'req-1',
              requirementType: { name: 'Medical License' },
              status: 'APPROVED',
              submittedAt: new Date().toISOString(),
              approvedAt: new Date().toISOString(),
              documentUrl: 'https://example.com/doc.pdf',
            },
          ],
        };
        await route.fulfill({ json });
      });

      await page.goto('/providers/current/edit/regulatory-requirements');
      
      // Should show approved status
      await expect(page.locator('[data-testid="requirement-status-Medical License"]')).toContainText('Approved');
      
      // Should show approval indicator
      await expect(page.locator('[data-testid="approval-checkmark-Medical License"]')).toBeVisible();
    });
  });

  test.describe('Profile Navigation', () => {
    test('should navigate between edit sections', async ({ page }) => {
      await page.goto('/providers/current/edit');
      
      // Should show navigation tabs
      await expect(page.locator('[data-testid="edit-nav-basic-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="edit-nav-services"]')).toBeVisible();
      await expect(page.locator('[data-testid="edit-nav-requirements"]')).toBeVisible();
      
      // Navigate to services
      await page.click('[data-testid="edit-nav-services"]');
      await page.waitForURL('/providers/current/edit/services');
      await expect(page.locator('h1')).toContainText('Manage Services');
      
      // Navigate to requirements
      await page.click('[data-testid="edit-nav-requirements"]');
      await page.waitForURL('/providers/current/edit/regulatory-requirements');
      await expect(page.locator('h1')).toContainText('Regulatory Requirements');
      
      // Navigate back to basic info
      await page.click('[data-testid="edit-nav-basic-info"]');
      await page.waitForURL('/providers/current/edit/basic-info');
      await expect(page.locator('h1')).toContainText('Edit Basic Information');
    });

    test('should return to provider profile from edit pages', async ({ page }) => {
      await page.goto('/providers/current/edit/basic-info');
      
      // Click back to profile button
      await page.click('[data-testid="back-to-profile-button"]');
      
      // Should navigate to provider profile
      await page.waitForURL('/providers/current');
      await expect(page.locator('h1')).toContainText('Provider Profile');
    });

    test('should show unsaved changes warning', async ({ page }) => {
      await page.goto('/providers/current/edit/basic-info');
      
      // Make changes
      await page.fill('[data-testid="firstName"]', 'Changed Name');
      
      // Try to navigate away
      await page.click('[data-testid="edit-nav-services"]');
      
      // Should show unsaved changes dialog
      await expect(page.locator('[data-testid="unsaved-changes-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="unsaved-changes-message"]')).toContainText('You have unsaved changes');
      
      // Can choose to discard changes
      await page.click('[data-testid="discard-changes-button"]');
      
      // Should navigate to services page
      await page.waitForURL('/providers/current/edit/services');
    });
  });
});