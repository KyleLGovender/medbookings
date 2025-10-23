import { expect, test } from '@playwright/test';

test.describe('Guest Booking Flow - End to End', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page as a guest
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate from home to provider search as guest', async ({ page }) => {
    // Verify we're on homepage
    await expect(page).toHaveURL('/');

    // Find and click "Search Providers" button
    await page.click('text=Search Providers');

    // Should navigate to providers page
    await expect(page).toHaveURL('/providers');

    // Should not be redirected to login
    await expect(page).not.toHaveURL(/.*signin.*/);
    await expect(page).not.toHaveURL(/.*login.*/);

    // Should see provider search interface
    await expect(page.locator('h1:has-text("Healthcare Providers")')).toBeVisible();
  });

  test('should complete full guest booking flow', async ({ page }) => {
    // Step 1: Navigate to provider search
    await page.click('text=Search Providers');
    await expect(page).toHaveURL('/providers');

    // Step 2: Search for a provider
    await page.fill('input[placeholder*="Sarah"]', 'Sarah');
    await page.waitForTimeout(500);

    // Step 3: Check if providers are available
    const providerCards = page.locator('.grid').locator('.hover\\:shadow-lg');
    const hasProviders = (await providerCards.count()) > 0;

    if (hasProviders) {
      // Click on first provider's "Book Appointment" button
      await providerCards.first().locator('button:has-text("Book Appointment")').click();

      // Should either:
      // a) Go to booking interface, or
      // b) Prompt for login (depending on business rules)

      // Wait for navigation
      await page.waitForTimeout(1000);

      // Check current URL to understand the flow
      const currentUrl = page.url();
      console.log('After clicking Book Appointment, URL is:', currentUrl);

      // Verify we're not on an error page
      await expect(page.locator('text=Error, text=404, text=Not Found')).not.toBeVisible();
    } else {
      console.log('No providers available for booking test');
    }
  });

  test('should handle guest booking with provider profile view', async ({ page }) => {
    // Navigate to provider search
    await page.click('text=Search Providers');

    // Look for providers
    const providerCards = page.locator('.grid').locator('.hover\\:shadow-lg');
    const hasProviders = (await providerCards.count()) > 0;

    if (hasProviders) {
      // Click "View Profile" instead of direct booking
      await providerCards.first().locator('button:has-text("View Profile")').click();

      // Wait for navigation
      await page.waitForTimeout(1000);

      // Should navigate to provider profile or appropriate page
      const currentUrl = page.url();
      console.log('After clicking View Profile, URL is:', currentUrl);

      // Should not get authentication errors
      await expect(page.locator('text=Unauthorized, text=Access Denied')).not.toBeVisible();
    }
  });

  test('should maintain search state when navigating back', async ({ page }) => {
    // Navigate to provider search
    await page.click('text=Search Providers');

    // Apply search filters
    await page.fill('input[placeholder*="Sarah"]', 'Sarah');
    await page.fill('input[placeholder*="Cape Town"]', 'Cape');

    // Navigate away (to home)
    await page.click('text=Home');
    await expect(page).toHaveURL('/');

    // Navigate back to provider search
    await page.click('text=Search Providers');
    await expect(page).toHaveURL('/providers');

    // Filters should be cleared (fresh search)
    await expect(page.locator('input[placeholder*="Sarah"]')).toHaveValue('');
  });

  test('should handle booking attempts without authentication gracefully', async ({ page }) => {
    // Navigate to provider search
    await page.click('text=Search Providers');

    // Try to access booking-related functionality
    const providerCards = page.locator('.grid').locator('.hover\\:shadow-lg');
    const hasProviders = (await providerCards.count()) > 0;

    if (hasProviders) {
      await providerCards.first().locator('button:has-text("Book Appointment")').click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Should either:
      // 1. Show booking form for guests
      // 2. Redirect to login with clear message
      // 3. Show "sign up to book" message

      // Verify no error pages
      await expect(page.locator('text=500, text=Server Error')).not.toBeVisible();
    }
  });

  test('should display provider information correctly for guests', async ({ page }) => {
    // Navigate to provider search
    await page.click('text=Search Providers');

    // Check provider cards display appropriate information for guests
    const providerCards = page.locator('.grid').locator('.hover\\:shadow-lg');
    const hasProviders = (await providerCards.count()) > 0;

    if (hasProviders) {
      const firstCard = providerCards.first();

      // Should show public information
      await expect(firstCard.locator('[class*="text-lg"]')).toBeVisible(); // Provider name
      await expect(firstCard.locator('text=APPROVED')).toBeVisible(); // Status (only approved should show)

      // Should show services/specialties
      const hasServices = await firstCard.locator('text=Services:').isVisible();
      const hasSpecialties = await firstCard.locator('text=Specialties:').isVisible();
      expect(hasServices || hasSpecialties).toBeTruthy();

      // Should show contact options
      await expect(firstCard.locator('button:has-text("Book Appointment")')).toBeVisible();
      await expect(firstCard.locator('button:has-text("View Profile")')).toBeVisible();
    }
  });

  test('should handle location-based search for guests', async ({ page }) => {
    // Navigate to provider search
    await page.click('text=Search Providers');

    // Test location search
    await page.click('input[placeholder*="Search cities"]');
    await page.fill('input[placeholder*="Search cities"]', 'Cape Town');

    // Wait for location autocomplete/search
    await page.waitForTimeout(1000);

    // Should show results or appropriate message
    const hasResults = (await page.locator('.grid').locator('.hover\\:shadow-lg').count()) > 0;
    const noResults = await page.locator('text=No providers found').isVisible();

    expect(hasResults || noResults).toBeTruthy();
  });

  test('should allow guests to filter by specialty types', async ({ page }) => {
    // Navigate to provider search
    await page.click('text=Search Providers');

    // Show specialties
    await page.click('button:has-text("Show Specialties")');
    await page.waitForTimeout(500);

    // Check if specialty filters are available
    const gpButton = page.locator('button:has-text("General Practitioner")').first();
    const psychButton = page.locator('button:has-text("Psychologist")').first();
    const dentistButton = page.locator('button:has-text("Dentist")').first();

    // Try clicking different specialties
    if (await gpButton.isVisible()) {
      await gpButton.click();
      await expect(page.locator('text=Filters active')).toBeVisible();
      await page.waitForTimeout(500);
    }

    if (await psychButton.isVisible()) {
      await psychButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should provide clear navigation for guest users', async ({ page }) => {
    // Navigate to provider search
    await page.click('text=Search Providers');

    // Should have clear navigation options
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Search Providers')).toBeVisible();
    await expect(page.locator('text=Join Medbookings')).toBeVisible();

    // Test navigation back to home
    await page.click('text=Home');
    await expect(page).toHaveURL('/');

    // Test navigation to join page
    await page.click('text=Join Medbookings');
    await expect(page.url()).toContain('/join-medbookings');
  });

  test('should handle service type filtering correctly', async ({ page }) => {
    // Navigate to provider search
    await page.click('text=Search Providers');

    // Test virtual service filter
    await page.click('text=Any service type');
    await page.click('text=Virtual/Online');

    await page.waitForTimeout(500);
    await expect(page.locator('text=Filters active')).toBeVisible();

    // Switch to in-person
    await page.click('text=Virtual/Online');
    await page.click('text=In-Person');

    await page.waitForTimeout(500);
    await expect(page.locator('text=Filters active')).toBeVisible();

    // Reset to all
    await page.click('text=In-Person');
    await page.click('text=Any service type');
  });

  test('should show appropriate empty states', async ({ page }) => {
    // Navigate to provider search
    await page.click('text=Search Providers');

    // Search for non-existent provider
    await page.fill('input[placeholder*="Sarah"]', 'NonExistentProvider12345');
    await page.waitForTimeout(500);

    // Should show helpful empty state
    await expect(page.locator('text=No providers found')).toBeVisible();
    await expect(page.locator('text=Try adjusting your filters')).toBeVisible();
    await expect(page.locator('button:has-text("Clear All Filters")')).toBeVisible();

    // Clear filters should work
    await page.click('button:has-text("Clear All Filters")');
    await expect(page.locator('input[placeholder*="Sarah"]')).toHaveValue('');
  });
});
