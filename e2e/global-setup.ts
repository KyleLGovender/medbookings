import { FullConfig } from '@playwright/test';
import { setupTestEnvironment } from './utils/database';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Starting global test setup...');

  // Validate environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Setup test database
  console.log('🗃️  Setting up test database...');
  await setupTestEnvironment();

  console.log('✅ Global test setup complete');
}

export default globalSetup;