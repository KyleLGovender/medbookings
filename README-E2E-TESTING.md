# E2E Testing with Playwright

This document provides a comprehensive guide for running and maintaining E2E tests for the MedBookings application using our professional Playwright testing setup.

## 🚀 Quick Start

### Initial Setup

```bash
# Run the automated setup script (recommended)
./scripts/testing/setup-e2e.sh

# Or manually:
npm install
npm run test:install          # Install Playwright browsers
npm run test:db:setup         # Start test database
npm run test:db:migrate       # Run migrations
```

### Running Tests

```bash
# Run all E2E tests
npm run test

# Run with browser UI visible (helpful for debugging)
npm run test:headed

# Run with Playwright test explorer
npm run test:ui

# Run in debug mode (step through tests)
npm run test:debug

# Run specific test categories
npm run test:auth             # Authentication tests
npm run test:booking          # Booking flow tests
npm run test:provider         # Provider functionality tests
npm run test:calendar         # Calendar management tests

# Legacy tests (old structure)
npm run test:legacy           # Run old test files

# View test report
npm run test:report
```

## 📁 Modern Test Structure

```
e2e/
├── global-setup.ts             # Global test environment setup
├── global-teardown.ts          # Global cleanup
├── fixtures/
│   ├── auth.setup.ts           # Authentication setup with storage state
│   ├── test-data.ts            # Legacy test data (calendar-specific)
│   ├── test-data-new.ts        # Modern test data fixtures
│   └── pages/                  # Page Object Models
│       ├── base-page.ts        # Common page functionality
│       ├── booking-page.ts     # Guest booking flow
│       ├── login-page.ts       # Authentication and OAuth
│       └── calendar-page.ts    # Provider calendar management
├── tests/
│   ├── auth/
│   │   └── login.spec.ts       # Authentication and access control
│   ├── booking/
│   │   └── guest-booking.spec.ts # Complete booking flow
│   ├── provider/
│   │   └── availability.spec.ts  # Provider availability management
│   ├── calendar/               # Legacy calendar tests
│   ├── guest-booking-flow.spec.ts # Legacy booking test
│   ├── provider-search.spec.ts    # Legacy search test
│   ├── error-scenarios.spec.ts    # Legacy error handling
│   └── data-cleanup.spec.ts       # Legacy cleanup test
├── utils/
│   ├── database.ts             # Database utilities and seeding
│   └── mock-data.ts            # Dynamic test data generation
└── playwright.config.ts        # Playwright configuration with projects
```

## 🧪 Test Coverage

### 1. Authentication & Access Control (`auth/`)

- ✅ Public access to provider search (no login required)
- ✅ Login page accessibility and Google OAuth flow
- ✅ Protected route access control (redirects to login)
- ✅ Authenticated user access to protected areas
- ✅ Logout functionality and session clearing

### 2. Guest Booking Flow (`booking/`)

- ✅ Provider search functionality with location/service filters
- ✅ Provider search page display and empty results handling
- ✅ Booking form validation and error handling
- ✅ Guest information collection and form filling
- ✅ Booking confirmation flow and network error handling

### 3. Provider Management (`provider/`)

- ✅ Calendar page access for authenticated providers
- ✅ Availability creation page navigation and form display
- ✅ Availability form filling and validation
- ✅ Calendar navigation and existing availability viewing
- ✅ Online/offline toggle functionality
- ✅ API error handling for availability creation

### 4. Legacy Tests (Compatibility)

- ✅ Original calendar availability tests
- ✅ Original guest booking flow
- ✅ Original provider search functionality
- ✅ Original error scenarios and cleanup procedures

## 🔧 Configuration

### Environment Variables

The test environment uses `.env.test` with the following key settings:

```bash
# Test Database (separate from development)
DATABASE_URL="postgresql://medbookings_test:test_password@localhost:5433/medbookings_test"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key-for-playwright-testing"

# Mock OAuth (no real external calls)
GOOGLE_CLIENT_ID="mock-google-client-id"
GOOGLE_CLIENT_SECRET="mock-google-client-secret"

# Disable external services
DISABLE_EMAILS="true"
DISABLE_SMS="true"
DISABLE_WHATSAPP="true"
DISABLE_GOOGLE_CALENDAR="true"

# Test environment flags
NODE_ENV="test"
PLAYWRIGHT_TEST="true"
```

### Test Database Setup

Tests use an isolated PostgreSQL database via Docker:

```bash
# Start test database
npm run test:db:setup

# Run migrations
npm run test:db:migrate

# Seed test data (if needed)
npm run test:db:seed

# Full setup (all of the above)
npm run test:full
```

## 🎭 Modern Test Patterns

### Page Object Model

Tests use Page Object Models for maintainable, reusable code:

```typescript
import { BookingPage } from '../../fixtures/pages/booking-page';

test('complete booking flow', async ({ page }) => {
  const bookingPage = new BookingPage(page);

  await bookingPage.navigateToProviderSearch();
  await bookingPage.searchProviders('Cape Town', 'General Practitioner');
  await bookingPage.selectProvider('Dr. Smith');
  await bookingPage.selectTimeSlot('2024-12-31', '10:00');
  await bookingPage.fillBookingForm({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+27123456789'
  });
  await bookingPage.confirmBooking();
  await bookingPage.verifyBookingSuccess();
});
```

### Authentication Mocking

Robust OAuth mocking without external dependencies:

```typescript
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User'
};

await loginPage.performTestLogin(testUser);
// User is now authenticated for the test
```

### Robust Element Selection

Multiple fallback selectors for reliable element detection:

```typescript
// Automatically tries multiple selector strategies
private selectors = {
  searchButton: '[data-testid="search-button"], button[type="submit"], button:has-text("Search")',
  locationInput: '[data-testid="location-input"], input[name="location"], input[placeholder*="location" i]',
};
```

### Global Setup/Teardown

Automatic database management and authentication state:

```typescript
// Global setup creates test data and authenticated state
// Global teardown cleans up test data
// Individual tests start with clean, predictable state
```

## 🔍 Debugging Tests

### Visual Debugging

```bash
# Watch tests run in browser
npm run test:headed

# Interactive test explorer
npm run test:ui

# Step-by-step debugging
npm run test:debug
```

### Debug Tools

```typescript
// Built-in screenshot capability
await bookingPage.takeScreenshot('booking-form-filled');

// Page state inspection
const isLoggedIn = await loginPage.isLoggedIn();

// Element waiting with timeout
await bookingPage.waitForElement('[data-testid="success"]', 10000);
```

### Troubleshooting

**Test Database Issues:**
```bash
# Restart test database
docker-compose -f docker-compose.test.yml down
npm run test:db:setup

# Check database status
docker-compose -f docker-compose.test.yml ps
```

**Authentication Problems:**
```bash
# Clear authentication state
rm -rf e2e/.auth/

# Re-run setup
npm run test:auth
```

**Element Selection Issues:**
```bash
# Run in headed mode to see what's happening
npm run test:headed

# Use debug mode to inspect selectors
npm run test:debug
```

## 🚦 CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

```yaml
# .github/workflows/e2e-tests.yml includes:
- npm run test:ci          # Complete CI setup and test run
```

### Test Artifacts

- **HTML Reports**: Comprehensive test results with screenshots
- **JSON Results**: Machine-readable test data
- **JUnit XML**: CI/CD integration format
- **Screenshots**: Automatic capture on failures
- **Videos**: Recording of failed test runs

## 📊 Test Data Management

### Modern Fixtures

```typescript
// Structured test data with helpers
import { TEST_PROVIDERS, TEST_BOOKINGS, generateTestUser } from '../fixtures/test-data-new';

const testUser = generateTestUser({
  email: 'custom@test.com',
  name: 'Custom Test User'
});
```

### Database Utilities

```typescript
// Clean test data by pattern
await cleanupTestDataByEmail('test.com');

// Setup complete scenario
const scenario = await setupCompleteTestScenario();
// Returns: { user, provider, service, location, availability, slots }
```

### Isolation Strategy

- **Global Setup**: Creates base test environment
- **Test-specific Data**: Each test creates its own data
- **Automatic Cleanup**: Global teardown removes all test data
- **No Cross-test Dependencies**: Tests can run in any order

## 🛠️ Maintenance

### Adding New Tests

1. **Choose appropriate category** (`auth/`, `booking/`, `provider/`)
2. **Use existing Page Objects** or extend them
3. **Follow established patterns**:

```typescript
import { test, expect } from '@playwright/test';
import { SomePageObject } from '../../fixtures/pages/some-page';

test.describe('Feature Name', () => {
  let pageObject: SomePageObject;

  test.beforeEach(async ({ page }) => {
    pageObject = new SomePageObject(page);
  });

  test('should do something', async ({ page }) => {
    // Test implementation using page object
  });
});
```

### Extending Page Objects

```typescript
// Add new methods to existing page objects
export class BookingPage extends BasePage {
  async newFeatureMethod() {
    await this.clickElement('[data-testid="new-feature"]');
    await this.waitForElement('[data-testid="result"]');
  }
}
```

### Performance Optimization

- **Parallel Execution**: Tests run concurrently by default
- **Efficient Selectors**: Multiple fallback strategies
- **Minimal Setup**: Only create necessary test data
- **Smart Cleanup**: Bulk deletion with proper ordering

## 📈 Best Practices

### Test Design

1. **Test Independence**: Each test works standalone
2. **Clear Intent**: Test names describe what they verify
3. **Robust Selectors**: Multiple fallback strategies
4. **Appropriate Scope**: Test one feature per test file

### Code Quality

1. **Page Objects**: Encapsulate UI interactions
2. **Helper Functions**: Reuse common operations
3. **Type Safety**: Full TypeScript usage
4. **Error Handling**: Graceful failure scenarios

### Data Management

1. **Isolated Data**: Each test creates what it needs
2. **Realistic Scenarios**: Use production-like data
3. **Predictable State**: Consistent setup between runs
4. **Efficient Cleanup**: Bulk operations with proper ordering

## 🆕 Migration from Legacy Tests

### Script Updates

**Old commands → New commands:**
- `npm run test:e2e` → `npm run test`
- `npm run test:e2e:headed` → `npm run test:headed`
- `npm run test:e2e:auth` → `npm run test:auth`
- `npm run test:e2e:provider` → `npm run test:provider`

### Structure Changes

**Legacy tests** remain available via `npm run test:legacy` while new tests follow the modern structure in categorized directories.

### New Capabilities

- **Page Object Models** for maintainable test code
- **Global setup/teardown** for reliable test environments
- **Robust selectors** with multiple fallback strategies
- **Comprehensive debugging** tools and reporting
- **Professional CI/CD** integration

---

**For questions or issues:** Review test logs, check database status, or run tests in debug mode for detailed investigation.