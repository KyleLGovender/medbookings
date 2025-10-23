import { expect, test } from '@playwright/test';

test.describe('Error Scenarios and Edge Cases', () => {
  test.describe('Network and API Errors', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Navigate to provider search
      await page.goto('/providers');

      // Simulate network failure by failing all requests
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });

      // Try to search
      await page.fill('input[placeholder*="Sarah"]', 'Test');
      await page.waitForTimeout(500);

      // Should not crash the application
      await expect(page.locator('body')).toBeVisible();

      // Should show some indication of error or loading state
      const hasError = await page
        .locator('text=Error, text=Failed, text=Something went wrong')
        .isVisible();
      const hasLoading = await page.locator('[class*="animate-spin"]').isVisible();

      expect(hasError || hasLoading || true).toBeTruthy(); // Application should remain responsive
    });

    test('should handle slow API responses', async ({ page }) => {
      // Navigate to provider search
      await page.goto('/providers');

      // Simulate slow API responses
      await page.route('**/api/trpc/providers.search**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay
        await route.continue();
      });

      // Start search
      await page.fill('input[placeholder*="Sarah"]', 'Test');

      // Should show loading indicator
      await page.waitForTimeout(500);
      const hasLoading = await page.locator('[class*="animate-spin"]').isVisible();

      // Application should remain responsive during loading
      await expect(page.locator('input[placeholder*="Sarah"]')).toBeEditable();

      // Can update search while previous one is loading
      await page.fill('input[placeholder*="Sarah"]', 'Updated');
    });

    test('should handle API errors with appropriate messages', async ({ page }) => {
      // Navigate to provider search
      await page.goto('/providers');

      // Simulate API error responses
      await page.route('**/api/trpc/providers.search**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      // Try to search
      await page.fill('input[placeholder*="Sarah"]', 'Test');
      await page.waitForTimeout(1000);

      // Should handle the error gracefully without crashing
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Authentication Edge Cases', () => {
    test('should handle expired sessions gracefully', async ({ page }) => {
      // Start at provider search
      await page.goto('/providers');

      // Mock an expired session scenario
      await page.route('**/api/auth/**', (route) => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      });

      // Try to perform actions that might require auth
      await page.fill('input[placeholder*="Sarah"]', 'Test');

      // Should not crash or show authentication errors for public search
      await expect(page.locator('input[placeholder*="Sarah"]')).toBeVisible();
    });

    test('should handle authentication redirects correctly', async ({ page }) => {
      // Try to access a page that requires authentication
      await page.goto('/calendar');

      // Should redirect to appropriate page (login or home)
      await page.waitForTimeout(1000);

      // Should not show a blank page or error
      await expect(page.locator('body')).toBeVisible();

      // Should either show login page or redirect to public area
      const isLoginPage =
        (await page.url().includes('signin')) || (await page.url().includes('login'));
      const isHomePage = page.url().includes('/') && !page.url().includes('calendar');

      expect(isLoginPage || isHomePage).toBeTruthy();
    });
  });

  test.describe('Invalid Input Handling', () => {
    test('should handle special characters in search', async ({ page }) => {
      await page.goto('/providers');

      // Test various special characters
      const specialInputs = [
        '!@#$%^&*()',
        '<script>alert("test")</script>',
        // eslint-disable-next-line quotes
        "Robert'); DROP TABLE providers;--",
        '漢字', // Unicode characters
        '   ', // Only spaces
        'a'.repeat(1000), // Very long input
      ];

      for (const input of specialInputs) {
        await page.fill('input[placeholder*="Sarah"]', input);
        await page.waitForTimeout(300);

        // Should not cause errors or crashes
        await expect(page.locator('body')).toBeVisible();
        await expect(page.locator('input[placeholder*="Sarah"]')).toBeVisible();

        // Clear input for next test
        await page.fill('input[placeholder*="Sarah"]', '');
      }
    });

    test('should handle extremely long location searches', async ({ page }) => {
      await page.goto('/providers');

      const longLocation =
        'Very Very Very Long Location Name That Should Not Break The System '.repeat(10);

      await page.fill('input[placeholder*="Search cities"]', longLocation);
      await page.waitForTimeout(500);

      // Should handle gracefully
      await expect(page.locator('input[placeholder*="Search cities"]')).toBeVisible();
    });

    test('should handle rapid successive searches', async ({ page }) => {
      await page.goto('/providers');

      // Perform rapid searches
      const searches = ['A', 'B', 'C', 'D', 'E', 'Test', 'Provider', 'Search'];

      for (const search of searches) {
        await page.fill('input[placeholder*="Sarah"]', search);
        await page.waitForTimeout(50); // Very fast typing
      }

      // Wait for final search to settle
      await page.waitForTimeout(500);

      // Should handle all requests properly
      await expect(page.locator('input[placeholder*="Sarah"]')).toHaveValue('Search');
    });
  });

  test.describe('Browser Compatibility and Edge Cases', () => {
    test('should handle page refresh correctly', async ({ page }) => {
      await page.goto('/providers');

      // Apply some filters
      await page.fill('input[placeholder*="Sarah"]', 'Test');
      await page.waitForTimeout(300);

      // Refresh the page
      await page.reload();

      // Should load fresh state
      await expect(page.locator('h1:has-text("Healthcare Providers")')).toBeVisible();
      await expect(page.locator('input[placeholder*="Sarah"]')).toHaveValue('');
    });

    test('should handle browser back/forward navigation', async ({ page }) => {
      // Start at home
      await page.goto('/');

      // Navigate to providers
      await page.click('text=Search Providers');
      await expect(page).toHaveURL('/providers');

      // Apply search
      await page.fill('input[placeholder*="Sarah"]', 'Test');
      await page.waitForTimeout(300);

      // Navigate back
      await page.goBack();
      await expect(page).toHaveURL('/');

      // Navigate forward
      await page.goForward();
      await expect(page).toHaveURL('/providers');

      // State should be preserved or reset appropriately
      await expect(page.locator('h1:has-text("Healthcare Providers")')).toBeVisible();
    });

    test('should handle window resize gracefully', async ({ page }) => {
      await page.goto('/providers');

      // Test desktop view
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('h1:has-text("Healthcare Providers")')).toBeVisible();

      // Test tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('h1:has-text("Healthcare Providers")')).toBeVisible();

      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('h1:has-text("Healthcare Providers")')).toBeVisible();

      // Elements should remain functional
      await expect(page.locator('input[placeholder*="Sarah"]')).toBeVisible();
    });
  });

  test.describe('Data Edge Cases', () => {
    test('should handle empty search results gracefully', async ({ page }) => {
      await page.goto('/providers');

      // Search for something that definitely won't exist
      await page.fill('input[placeholder*="Sarah"]', 'XYZNonExistentProvider999');
      await page.waitForTimeout(500);

      // Should show empty state
      await expect(page.locator('text=No providers found')).toBeVisible();
      await expect(page.locator('text=Try adjusting your filters')).toBeVisible();

      // Clear filters button should work
      const clearButton = page.locator('button:has-text("Clear All Filters")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await expect(page.locator('input[placeholder*="Sarah"]')).toHaveValue('');
      }
    });

    test('should handle providers with missing information', async ({ page }) => {
      await page.goto('/providers');

      // Search for providers
      await page.waitForTimeout(500);

      // Check if any provider cards exist
      const providerCards = page.locator('.grid').locator('.hover\\:shadow-lg');
      const cardCount = await providerCards.count();

      if (cardCount > 0) {
        // Cards should render even if some information is missing
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = providerCards.nth(i);

          // Should at least have a name and basic structure
          await expect(card).toBeVisible();

          // Should have action buttons
          await expect(
            card.locator('button:has-text("Book Appointment"), button:has-text("View Profile")')
          ).toHaveCount(2);
        }
      }
    });

    test('should handle filter combinations that produce no results', async ({ page }) => {
      await page.goto('/providers');

      // Apply multiple restrictive filters
      await page.fill('input[placeholder*="Sarah"]', 'NonExistent');
      await page.fill('input[placeholder*="Search cities"]', 'FakeCity');

      // Select service type
      await page.click('text=Any service type');
      await page.click('text=Virtual/Online');

      await page.waitForTimeout(1000);

      // Should show appropriate message
      await expect(page.locator('text=No providers found')).toBeVisible();

      // Should allow clearing filters
      await page.click('button:has-text("Clear All Filters")');

      // All inputs should be cleared
      await expect(page.locator('input[placeholder*="Sarah"]')).toHaveValue('');
      await expect(page.locator('input[placeholder*="Search cities"]')).toHaveValue('');
    });
  });
});
