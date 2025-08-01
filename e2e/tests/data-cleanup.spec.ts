import { expect, test } from '@playwright/test';

import { cleanTestData, getTestDataCounts, setupTestData } from '../utils/database';

test.describe('Test Data Management', () => {
  test('should show current test data counts', async ({ page }) => {
    const counts = await getTestDataCounts();

    console.log('📊 Current test data in database:');
    console.log(`  Users: ${counts.users}`);
    console.log(`  Providers: ${counts.providers}`);
    console.log(`  Availability: ${counts.availability}`);
    console.log(`  Bookings: ${counts.bookings}`);

    // This test always passes - it's just for information
    expect(true).toBe(true);
  });

  test('should clean up test data', async ({ page }) => {
    // First, create some test data to clean up
    await setupTestData();

    // Verify test data exists
    const beforeCounts = await getTestDataCounts();
    expect(beforeCounts.users).toBeGreaterThan(0);

    // Clean up test data
    await cleanTestData();

    // Verify test data is gone
    const afterCounts = await getTestDataCounts();
    expect(afterCounts.users).toBe(0);
    expect(afterCounts.providers).toBe(0);
    expect(afterCounts.availability).toBe(0);
    expect(afterCounts.bookings).toBe(0);

    console.log('✅ All test data cleaned up successfully');
  });
});
