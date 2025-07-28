import { expect, test } from '@playwright/test';

import { getTestDataCounts, prisma } from '../../utils/database';

test.describe('Database Connection Test', () => {
  test('should connect to dev database', async () => {
    // Simple database connection test
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in dev database: ${userCount}`);

    // This should work if database connection is successful
    expect(userCount).toBeGreaterThanOrEqual(0);
  });

  test('should show test data counts', async () => {
    const counts = await getTestDataCounts();

    console.log('📊 Current test data in database:');
    console.log(`  Test Users: ${counts.users}`);
    console.log(`  Test Providers: ${counts.providers}`);
    console.log(`  Test Organizations: ${counts.organizations}`);

    // Test passes regardless of counts - this is just for information
    expect(true).toBe(true);
  });

  test('should verify environment variables', async () => {
    console.log('🔧 Environment check:');
    console.log(`  DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);

    // Verify we have a database URL
    expect(process.env.DATABASE_URL).toBeDefined();
  });
});
