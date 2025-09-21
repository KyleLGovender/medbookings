import { FullConfig } from '@playwright/test';
import { cleanTestData } from './utils/database';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  // Clean up test data
  console.log('🗃️  Cleaning up test database...');
  await cleanTestData();

  console.log('✅ Global test teardown complete');
}

export default globalTeardown;