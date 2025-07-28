import { expect, test } from '@playwright/test';

import {
  cleanCalendarTestData,
  getCalendarTestDataCounts,
  setupCalendarTestData,
} from '../../utils/calendar-database';

test.describe('Calendar Test Data Management', () => {
  test('should show current calendar test data counts', async ({ page }) => {
    const counts = await getCalendarTestDataCounts();

    console.log('📊 Current calendar test data in database:');
    console.log(`  Users: ${counts.users}`);
    console.log(`  Providers: ${counts.providers}`);
    console.log(`  Availability: ${counts.availability}`);
    console.log(`  Bookings: ${counts.bookings}`);

    // This test always passes - it's just for information
    expect(true).toBe(true);
  });

  test('should clean up calendar test data', async ({ page }) => {
    // First, create some test data to clean up
    await setupCalendarTestData();

    // Verify test data exists
    const beforeCounts = await getCalendarTestDataCounts();
    expect(beforeCounts.users).toBeGreaterThan(0);

    // Clean up calendar test data
    await cleanCalendarTestData();

    // Verify test data is gone
    const afterCounts = await getCalendarTestDataCounts();
    expect(afterCounts.users).toBe(0);
    expect(afterCounts.providers).toBe(0);
    expect(afterCounts.availability).toBe(0);
    expect(afterCounts.bookings).toBe(0);

    console.log('✅ All calendar test data cleaned up successfully');
  });
});
