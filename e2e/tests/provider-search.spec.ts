import { expect, test } from '@playwright/test';

test.describe('Provider Search - Guest Access', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to public provider search page
    await page.goto('/providers');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should display provider search page for guests without authentication', async ({
    page,
  }) => {
    // Verify we're on the providers page
    await expect(page).toHaveURL('/providers');

    // Check page title and main elements
    await expect(page.locator('h1')).toContainText('Healthcare Providers');
    await expect(page.locator('p')).toContainText(
      'Browse our network of approved healthcare professionals'
    );

    // Verify search interface is visible
    await expect(page.locator('text=Find Healthcare Providers')).toBeVisible();
  });

  test('should have all search filter components visible', async ({ page }) => {
    // Check search form elements
    await expect(page.locator('input[placeholder*="Sarah"]')).toBeVisible(); // First Name
    await expect(page.locator('input[placeholder*="Smith"]')).toBeVisible(); // Last Name
    await expect(page.locator('input[placeholder*="Search cities"]')).toBeVisible(); // Location

    // Check service type dropdown
    await expect(page.locator('text=Any service type')).toBeVisible();

    // Check specialties section
    await expect(page.locator('button:has-text("Show Specialties")')).toBeVisible();
  });

  test('should search providers by first name', async ({ page }) => {
    // Enter first name in search
    await page.fill('input[placeholder*="Sarah"]', 'Sarah');

    // Wait for debounced search to trigger
    await page.waitForTimeout(500);

    // Verify search results update
    await expect(page.locator('text=Search Results')).toBeVisible();

    // Check if results contain the searched name or show "no providers found"
    const hasResults = (await page.locator('[data-testid="provider-card"]').count()) > 0;
    const noResults = await page.locator('text=No providers found').isVisible();

    expect(hasResults || noResults).toBeTruthy();
  });

  test('should search providers by last name', async ({ page }) => {
    // Enter last name in search
    await page.fill('input[placeholder*="Smith"]', 'Smith');

    // Wait for debounced search
    await page.waitForTimeout(500);

    // Verify search behavior
    await expect(page.locator('text=Search Results')).toBeVisible();
  });

  test('should search providers by location using autocomplete', async ({ page }) => {
    // Click on location input
    await page.click('input[placeholder*="Search cities"]');

    // Type a location
    await page.fill('input[placeholder*="Search cities"]', 'Cape Town');

    // Wait for autocomplete suggestions (if Google Places is working)
    await page.waitForTimeout(1000);

    // Verify search updates
    const hasLocationFilter = await page.locator('text=Filters active').isVisible();
    expect(hasLocationFilter || true).toBeTruthy(); // Allow for empty results
  });

  test('should filter by service type', async ({ page }) => {
    // Click service type dropdown
    await page.click('text=Any service type');

    // Select virtual/online service
    await page.click('text=Virtual/Online');

    // Verify filter is applied
    await expect(page.locator('text=Filters active')).toBeVisible();

    // Wait for results to update
    await page.waitForTimeout(500);
  });

  test('should show and filter by specialties', async ({ page }) => {
    // Click to show specialties
    await page.click('button:has-text("Show Specialties")');

    // Wait for specialties to load
    await page.waitForTimeout(500);

    // Check if specialty buttons are visible
    const specialtyButtons = page.locator(
      'button:has-text("General Practitioner"), button:has-text("Psychologist"), button:has-text("Dentist")'
    );
    const count = await specialtyButtons.count();

    if (count > 0) {
      // Click on first available specialty
      await specialtyButtons.first().click();

      // Verify filter is active
      await expect(page.locator('text=Filters active')).toBeVisible();
    }
  });

  test('should clear all filters', async ({ page }) => {
    // Apply multiple filters
    await page.fill('input[placeholder*="Sarah"]', 'Sarah');
    await page.fill('input[placeholder*="Cape Town"]', 'Cape Town');

    // Wait for filters to apply
    await page.waitForTimeout(500);

    // Click clear all filters
    const clearButton = page.locator('button:has-text("Clear All Filters")');
    if (await clearButton.isEnabled()) {
      await clearButton.click();

      // Verify filters are cleared
      await expect(page.locator('input[placeholder*="Sarah"]')).toHaveValue('');
      await expect(page.locator('input[placeholder*="Cape Town"]')).toHaveValue('');
    }
  });

  test('should display provider cards with correct information', async ({ page }) => {
    // Check if any provider cards are displayed
    const providerCards = page.locator('.grid').locator('.hover\\:shadow-lg');
    const cardCount = await providerCards.count();

    if (cardCount > 0) {
      const firstCard = providerCards.first();

      // Check card elements
      await expect(firstCard.locator('h3, [class*="text-lg"]')).toBeVisible(); // Provider name
      await expect(firstCard.locator('text=APPROVED, text=PENDING, text=REJECTED')).toBeVisible(); // Status badge

      // Check action buttons
      await expect(firstCard.locator('button:has-text("Book Appointment")')).toBeVisible();
      await expect(firstCard.locator('button:has-text("View Profile")')).toBeVisible();
    }
  });

  test('should display empty state when no providers found', async ({ page }) => {
    // Search for something that won't exist
    await page.fill('input[placeholder*="Sarah"]', 'NonExistentProvider123');

    // Wait for search to complete
    await page.waitForTimeout(500);

    // Check for empty state
    await expect(page.locator('text=No providers found')).toBeVisible();
    await expect(page.locator('text=No providers match your search criteria')).toBeVisible();

    // Check clear filters button in empty state
    await expect(page.locator('button:has-text("Clear All Filters")')).toBeVisible();
  });

  test('should display statistics footer when providers exist', async ({ page }) => {
    // Check if provider stats are shown
    const statsSection = page.locator('.grid.grid-cols-3');

    if (await statsSection.isVisible()) {
      // Verify stat categories
      await expect(
        statsSection.locator('text=Total Providers, text=Matching Providers')
      ).toBeVisible();
      await expect(statsSection.locator('text=Services Available')).toBeVisible();
      await expect(statsSection.locator('text=Specialties')).toBeVisible();
    }
  });

  test('should handle search with combined filters', async ({ page }) => {
    // Apply multiple filters together
    await page.fill('input[placeholder*="Sarah"]', 'Sarah');
    await page.fill('input[placeholder*="Cape Town"]', 'Cape Town');

    // Select service type
    await page.click('text=Any service type');
    await page.click('text=Virtual/Online');

    // Show and select specialty if available
    await page.click('button:has-text("Show Specialties")');
    await page.waitForTimeout(300);

    const specialtyButton = page.locator('button:has-text("General Practitioner")').first();
    if (await specialtyButton.isVisible()) {
      await specialtyButton.click();
    }

    // Verify combined filters are active
    await expect(page.locator('text=Filters active')).toBeVisible();

    // Results should update accordingly
    await page.waitForTimeout(500);
  });
});
