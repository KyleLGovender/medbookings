# E2E Testing with Playwright

This document provides a comprehensive guide for running and maintaining E2E tests for the MedBookings application.

## 🚀 Quick Start

### Initial Setup
```bash
# Run the setup script to configure everything
npm run test:setup

# Or manually:
npm install
npx playwright install
docker compose -f docker-compose.test.yml up -d postgres-test
```

### Running Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with browser UI (helpful for debugging)
npm run test:e2e:headed

# Run with Playwright UI (test explorer)
npm run test:e2e:ui

# Run in debug mode (step through tests)
npm run test:e2e:debug

# Run specific test suites
npm run test:e2e:auth        # Authentication & user onboarding
npm run test:e2e:provider    # Provider management workflows  
npm run test:e2e:cleanup     # Deletion and cleanup journeys

# View test report
npm run test:e2e:report
```

## 📁 Test Structure

```
e2e/
├── fixtures/
│   ├── auth.setup.ts          # Authentication setup for different user types
│   ├── test-data.ts           # Test data fixtures and constants
│   └── files/                 # Test files (PDFs, images, etc.)
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts      # Google OAuth login flow
│   │   └── registration.spec.ts # Provider/org registration & invitations
│   ├── provider/
│   │   ├── approval-workflow.spec.ts    # Admin approval/rejection
│   │   ├── profile-editing.spec.ts      # Provider profile management  
│   │   └── calendar-management.spec.ts  # Availability creation/editing
│   └── cleanup/
│       └── deletion-journeys.spec.ts    # Deletion workflows & cleanup
├── utils/
│   ├── database.ts            # Database utilities and seeding
│   └── test-helpers.ts        # Reusable test helper functions
└── playwright.config.ts       # Playwright configuration
```

## 🧪 Test Coverage

### 1. Authentication & User Onboarding
- ✅ Google OAuth login flow (`/login` → OAuth → `/profile`)
- ✅ Provider registration journey (`/providers/new` → form completion → approval workflow)
- ✅ Organization registration (`/organizations/new` → setup → approval)
- ✅ Invitation acceptance (`/invitation/[token]` → registration/login → connection)

### 2. Provider Management Workflows
- ✅ Provider approval workflow (Admin: pending → approve/reject → notifications)
- ✅ Provider profile editing (`/providers/[id]/edit/*` → basic info, services, requirements)
- ✅ Calendar availability setup (`/calendar/availability` → create/edit availability slots)

### 3. Deletion & Cleanup Journeys
- ✅ Delete availability slots (single, recurring, bulk operations)
- ✅ Delete provider profiles (with data export and confirmation)
- ✅ Delete organizations (with ownership transfer and member cleanup)
- ✅ Cascade deletion verification (ensure related data is cleaned up)

## 🔧 Configuration

### Environment Variables
Create `.env.test.local` from the `.env.test` template:

```bash
# Test Database - should be separate from development
TEST_DATABASE_URL="postgresql://medbookings_test:test_password@localhost:5433/medbookings_test"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key"

# Disable external services in tests
DISABLE_EMAILS="true"
DISABLE_SMS="true" 
DISABLE_GOOGLE_CALENDAR="true"
```

### Test Database
The tests use a separate PostgreSQL database to avoid interfering with development data:

```bash
# Start test database
docker compose -f docker-compose.test.yml up -d postgres-test

# Run migrations on test database
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
```

## 🎭 Test Patterns

### Authentication Mocking
Tests mock Google OAuth to avoid dependencies on external services:

```typescript
// Mock NextAuth session
await page.route('**/api/auth/session', async (route) => {
  const json = {
    user: {
      name: 'Test User',
      email: 'user@test.com',
      image: 'https://via.placeholder.com/40',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  await route.fulfill({ json });
});
```

### Database State Management
Each test suite starts with a clean database state:

```typescript
test.beforeEach(async ({ page }) => {
  // Setup clean test environment with fresh data
  await setupTestEnvironment();
  testUsers = await createTestUsers();
  testProvider = await createTestProvider(testUsers.provider.id);
});
```

### Page Object Patterns
Reusable helper functions encapsulate common user actions:

```typescript
// Helper function for filling registration forms
await fillProviderRegistrationForm(page, TEST_PROVIDER_DATA);

// Helper function for creating availability slots
await createAvailabilitySlot(page, TEST_AVAILABILITY_DATA);
```

## 🔍 Debugging Tests

### Visual Debugging
```bash
# Run with browser UI visible
npm run test:e2e:headed

# Run with Playwright's test UI
npm run test:e2e:ui
```

### Debug Screenshots
Tests automatically take screenshots on failure. Manual screenshots can be taken:

```typescript
await takeDebugScreenshot(page, 'after-form-submission');
```

### Console Logs
Check browser console messages:

```bash
# Console messages are captured and shown in test output
npx playwright test --reporter=line
```

## 🚦 CI/CD Integration

### GitHub Actions
The `.github/workflows/e2e-tests.yml` workflow runs tests on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Test Artifacts
- Test reports are uploaded as artifacts
- Screenshots from failed tests are preserved
- Videos of failed test runs are available

## 📊 Test Data Management

### Fixtures and Test Data
- Test data is defined in `e2e/fixtures/test-data.ts`
- Mock files (PDFs, images) are stored in `e2e/fixtures/files/`
- Database seeding functions create consistent test data

### Data Isolation
- Each test starts with a clean database state
- Tests don't depend on external services
- Deterministic test data ensures reliable results

## 🛠️ Maintenance

### Adding New Tests
1. Create test file in appropriate directory (`auth/`, `provider/`, `cleanup/`)
2. Follow existing patterns for authentication and data setup
3. Use helper functions for common actions
4. Add data cleanup if needed

### Updating Test Data
1. Modify fixtures in `e2e/fixtures/test-data.ts`
2. Update database seeding functions in `e2e/utils/database.ts`
3. Regenerate test files if needed

### Performance Optimization
- Tests run in parallel by default
- Database operations are optimized for speed
- Use `fullyParallel: true` in test configuration

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Ensure test database is running
docker compose -f docker-compose.test.yml up -d postgres-test

# Check database connection
DATABASE_URL="$TEST_DATABASE_URL" npx prisma db push
```

**Authentication Issues:**
```bash
# Verify mock authentication is properly set up
# Check that NextAuth routes are being mocked correctly
```

**Test Timeouts:**
```bash
# Increase timeout in playwright.config.ts
# Check for slow network requests or database queries
```

### Getting Help
- Review test logs and screenshots from failed tests
- Use `--debug` flag to step through tests interactively
- Check browser console for JavaScript errors
- Verify database state after failed tests

## 📈 Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clean State**: Always start with a clean database and authentication state
3. **Realistic Data**: Use realistic test data that matches production scenarios
4. **Error Handling**: Test both success and failure paths
5. **Performance**: Keep tests fast by mocking external services
6. **Maintainability**: Use helper functions and page objects for reusable code