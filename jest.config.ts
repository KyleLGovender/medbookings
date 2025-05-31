import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // if you have one
  testEnvironment: 'jest-environment-jsdom',
  // preset: 'ts-jest', // next/jest should handle this
  moduleNameMapper: {
    // Handle CSS imports (if you're using them in your components)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    // Add other aliases here if you have them
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // For global jest-dom extensions etc.
  // If you're using SWC, next/jest handles this automatically.
  // If you want to explicitly use ts-jest for transformation:
  // transform: {
  //   '^.+\\.(ts|tsx)$': ['ts-jest', {
  //     tsconfig: 'tsconfig.jest.json', // Optional: separate tsconfig for tests
  //   }],
  // },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
