import type { Page } from '@playwright/test';

/**
 * Mock Google OAuth login by directly setting session
 */
export async function mockGoogleLogin(page: Page, userEmail: string) {
  // Navigate to login page
  await page.goto('/login');
  
  // Mock the OAuth flow by directly calling the auth callback
  // This simulates a successful Google OAuth login
  await page.evaluate(async (email) => {
    // Create a mock session
    const mockSession = {
      user: {
        email,
        name: email.split('@')[0],
        image: 'https://via.placeholder.com/40',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // Store session in localStorage (Next-Auth session handling)
    localStorage.setItem('next-auth.session-token', JSON.stringify(mockSession));
    
    // Also set a cookie for server-side session
    document.cookie = `next-auth.session-token=${JSON.stringify(mockSession)}; path=/; secure; samesite=lax`;
  }, userEmail);

  // Navigate to profile to complete login
  await page.goto('/profile');
  
  // Wait for successful navigation
  await page.waitForURL('/profile');
}

/**
 * Fill out provider registration form
 */
export async function fillProviderRegistrationForm(page: Page, providerData: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  bio: string;
  yearsOfExperience: number;
  serviceProviderType: string;
}) {
  // Fill basic info
  await page.fill('[data-testid="firstName"]', providerData.firstName);
  await page.fill('[data-testid="lastName"]', providerData.lastName);
  await page.fill('[data-testid="phoneNumber"]', providerData.phoneNumber);
  await page.fill('[data-testid="bio"]', providerData.bio);
  await page.fill('[data-testid="yearsOfExperience"]', providerData.yearsOfExperience.toString());
  
  // Select service provider type
  await page.click('[data-testid="serviceProviderType-trigger"]');
  await page.click(`[data-testid="serviceProviderType-option-${providerData.serviceProviderType}"]`);
}

/**
 * Fill out organization registration form
 */
export async function fillOrganizationRegistrationForm(page: Page, orgData: {
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  website?: string;
  address: string;
}) {
  await page.fill('[data-testid="organizationName"]', orgData.name);
  await page.fill('[data-testid="organizationDescription"]', orgData.description);
  await page.fill('[data-testid="organizationPhone"]', orgData.phoneNumber);
  await page.fill('[data-testid="organizationEmail"]', orgData.email);
  
  if (orgData.website) {
    await page.fill('[data-testid="organizationWebsite"]', orgData.website);
  }
  
  await page.fill('[data-testid="organizationAddress"]', orgData.address);
}

/**
 * Create availability slot
 */
export async function createAvailabilitySlot(page: Page, slotData: {
  date: string;
  startTime: string;
  endTime: string;
  service: string;
  type: 'ONLINE' | 'IN_PERSON';
}) {
  await page.click('[data-testid="create-availability-button"]');
  
  // Fill availability form
  await page.fill('[data-testid="availability-date"]', slotData.date);
  await page.fill('[data-testid="availability-start-time"]', slotData.startTime);
  await page.fill('[data-testid="availability-end-time"]', slotData.endTime);
  
  // Select service
  await page.click('[data-testid="availability-service-trigger"]');
  await page.click(`[data-testid="availability-service-option-${slotData.service}"]`);
  
  // Select type
  await page.click(`[data-testid="availability-type-${slotData.type.toLowerCase()}"]`);
  
  // Save availability
  await page.click('[data-testid="save-availability-button"]');
}

/**
 * Upload requirement document
 */
export async function uploadRequirementDocument(page: Page, requirementName: string, filePath: string) {
  const requirementSection = page.locator(`[data-testid="requirement-${requirementName}"]`);
  
  // Click upload button
  await requirementSection.locator('[data-testid="upload-button"]').click();
  
  // Upload file
  const fileInput = requirementSection.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  
  // Wait for upload to complete
  await requirementSection.locator('[data-testid="upload-success"]').waitFor();
}

/**
 * Admin approve/reject actions
 */
export async function adminApproveProvider(page: Page, providerId: string) {
  await page.goto(`/admin/providers/${providerId}`);
  await page.click('[data-testid="approve-provider-button"]');
  await page.fill('[data-testid="approval-notes"]', 'Provider approved for testing');
  await page.click('[data-testid="confirm-approve-button"]');
  
  // Wait for success message
  await page.locator('[data-testid="approval-success"]').waitFor();
}

export async function adminRejectProvider(page: Page, providerId: string, reason: string) {
  await page.goto(`/admin/providers/${providerId}`);
  await page.click('[data-testid="reject-provider-button"]');
  await page.fill('[data-testid="rejection-reason"]', reason);
  await page.click('[data-testid="confirm-reject-button"]');
  
  // Wait for success message  
  await page.locator('[data-testid="rejection-success"]').waitFor();
}

/**
 * Delete operations for cleanup
 */
export async function deleteAvailability(page: Page, availabilityId: string) {
  const availabilityCard = page.locator(`[data-testid="availability-${availabilityId}"]`);
  await availabilityCard.locator('[data-testid="delete-availability-button"]').click();
  
  // Confirm deletion
  await page.click('[data-testid="confirm-delete-availability"]');
  
  // Wait for deletion to complete
  await availabilityCard.waitFor({ state: 'detached' });
}

export async function deleteProviderProfile(page: Page) {
  await page.goto('/providers/current/edit');
  await page.click('[data-testid="delete-provider-button"]');
  
  // Type confirmation
  await page.fill('[data-testid="delete-confirmation-input"]', 'DELETE');
  await page.click('[data-testid="confirm-delete-provider"]');
  
  // Should redirect to home page
  await page.waitForURL('/');
}

export async function deleteOrganization(page: Page, organizationId: string) {
  await page.goto(`/organizations/${organizationId}/edit`);
  await page.click('[data-testid="delete-organization-button"]');
  
  // Type confirmation
  await page.fill('[data-testid="delete-confirmation-input"]', 'DELETE');
  await page.click('[data-testid="confirm-delete-organization"]');
  
  // Should redirect to organizations list
  await page.waitForURL('/organizations');
}

/**
 * Wait for element with timeout and error message
 */
export async function waitForElement(page: Page, selector: string, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch (error) {
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
  }
}

/**
 * Take screenshot for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `e2e/debug-screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}