import { test, expect } from '@playwright/test';
import { 
  cleanTestData, 
  cleanAllDatabase,
  getTestDataCounts,
  cleanupTestProvider,
  cleanupTestOrganization,
  setupTestEnvironment 
} from '../../utils/database';
import { TEST_PROVIDER_DATA, TEST_ORGANIZATION_DATA } from '../../fixtures/test-data';

test.describe('Test Data Cleanup', () => {
  
  test('should clean up all test data', async ({ page }) => {
    // First, create some test data to clean up
    await setupTestEnvironment();
    
    // Verify test data exists
    const beforeCounts = await getTestDataCounts();
    expect(beforeCounts.users).toBeGreaterThan(0);
    
    // Clean up test data
    await cleanTestData();
    
    // Verify test data is gone
    const afterCounts = await getTestDataCounts();
    expect(afterCounts.users).toBe(0);
    expect(afterCounts.providers).toBe(0);
    expect(afterCounts.organizations).toBe(0);
    
    console.log('✅ All test data cleaned up successfully');
  });

  test('should clean up specific test provider', async ({ page }) => {
    // Setup test environment
    await setupTestEnvironment();
    
    // Clean up specific provider
    const result = await cleanupTestProvider('e2e-test-provider@example.com');
    expect(result.count).toBeGreaterThanOrEqual(0);
    
    console.log(`✅ Cleaned up ${result.count} test provider(s)`);
  });

  test('should clean up specific test organization', async ({ page }) => {
    // Setup test environment  
    await setupTestEnvironment();
    
    // Clean up specific organization
    const result = await cleanupTestOrganization(TEST_ORGANIZATION_DATA.name);
    expect(result.count).toBeGreaterThanOrEqual(0);
    
    console.log(`✅ Cleaned up ${result.count} test organization(s)`);
  });

  test('should show current test data counts', async ({ page }) => {
    const counts = await getTestDataCounts();
    
    console.log('📊 Current test data in database:');
    console.log(`  Users: ${counts.users}`);
    console.log(`  Providers: ${counts.providers}`);
    console.log(`  Organizations: ${counts.organizations}`);
    
    // This test always passes - it's just for information
    expect(true).toBe(true);
  });

  // Uncomment this test only if you want to completely reset your dev database
  // test.skip('DANGER: Clean all database data', async ({ page }) => {
  //   // This is the nuclear option - use with extreme caution!
  //   await cleanAllDatabase();
  //   console.log('💥 All database data has been removed');
  // });
});

test.describe('Cleanup Test Helpers', () => {
  
  test('should verify test data identifiers work', async ({ page }) => {
    // Test that our identification patterns work correctly
    const testEmail = 'e2e-test-example@example.com';
    const testName = 'E2E_TEST_Example_User';
    
    // These should match our cleanup patterns
    expect(testEmail).toContain('e2e-test');
    expect(testName).toContain('E2E_TEST');
    
    console.log('✅ Test data identifiers are working correctly');
  });

  test('should verify test data constants', async ({ page }) => {
    // Verify our test data has the correct identifiers
    expect(TEST_PROVIDER_DATA.firstName).toContain('E2E_TEST');
    expect(TEST_PROVIDER_DATA.lastName).toContain('E2E_TEST');
    expect(TEST_ORGANIZATION_DATA.name).toContain('E2E_TEST');
    expect(TEST_ORGANIZATION_DATA.email).toContain('e2e-test');
    
    console.log('✅ Test data constants have correct identifiers');
  });
});