# Integration Validation Runbook

## Purpose

Validate that completed features integrate properly with existing system functionality.

## Integration Test Scenarios

### 1. Cross-Feature Dependencies

#### Data Flow Validation

```bash
# Test data flow between features
# Example: Booking feature → Calendar update → Notification trigger

# 1. Create test booking
npm run test:integration -- --grep "booking creation"

# 2. Verify calendar updated
npm run test:integration -- --grep "calendar availability"

# 3. Check notifications sent
npm run test:integration -- --grep "notification delivery"
```

#### State Management

```typescript
// Verify shared state updates correctly
// Test in browser console:
// 1. Trigger action in Feature A
// 2. Verify state change in Feature B
// 3. Check no unintended side effects
```

### 2. API Integration Points

#### Endpoint Compatibility

```bash
# Test all related endpoints still work
./scripts/test-api-endpoints.sh

# Verify backwards compatibility
curl -X POST http://localhost:3000/api/[old-endpoint]
# Expected: Still functions or returns deprecation notice
```

#### Database Transaction Integrity

```sql
-- Verify related tables updated atomically
BEGIN;
-- Test feature operations
-- Check all related tables
ROLLBACK; -- or COMMIT if safe
```

### 3. User Flow Testing

#### End-to-End Scenarios

```bash
# Run full user journey tests
npx playwright test e2e/user-journeys/

# Critical paths to test:
# - Guest booking flow
# - Provider availability management
# - Admin dashboard updates
```

#### Permission Boundaries

```typescript
// Test as different user roles
const testRoles = ['guest', 'provider', 'admin'];
for (const role of testRoles) {
  // Attempt feature access
  // Verify appropriate permissions
}
```

### 4. Performance Integration

#### Load Testing

```bash
# Test feature under load
npm run test:load -- --feature=[feature-name]

# Metrics to monitor:
# - Response time < 200ms
# - Database queries < 10 per request
# - Memory usage stable
```

#### Concurrent Operations

```javascript
// Test concurrent user actions
Promise.all([
  createBooking(slot1),
  createBooking(slot1), // Same slot
  updateAvailability(slot1),
]);
// Verify: Only one booking succeeds
```

### 5. External Service Integration

#### Email/SMS Validation

```bash
# Test notification services
npm run test:notifications

# Verify:
# - Emails queued correctly
# - SMS delivery attempted
# - Fallback behavior on service failure
```

#### Third-party API Resilience

```javascript
// Test with service failures
// Mock service timeout/error
// Verify graceful degradation
```

### Integration Checkpoints

#### Pre-Release Validation

[ ] All integration tests pass
[ ] No regression in existing features
[ ] Performance benchmarks maintained
[ ] Security scans pass
[ ] Accessibility standards met

#### Staging Environment Tests

```bash
# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke:staging

# Monitor for 24 hours
# Check error logs
# Review performance metrics
```

### Rollback Plan

#### Quick Rollback

```bash
# If critical issue found
git revert HEAD
npm run deploy:hotfix
```

#### Feature Flag Disable

```javascript
// If using feature flags
setFeatureFlag('new-feature', false);
// Monitor and fix offline
```

### Monitoring Post-Integration

#### Metrics to Track

- Error rate increase
- Performance degradation
- User abandonment rate
- Support ticket spike

#### Alert Thresholds

```yaml
alerts:
  error_rate: > 1%
  response_time: > 500ms
  failed_bookings: > 5%
  database_connections: > 80%
```

### Sign-off Checklist

#### Technical Lead Review

[ ] Code architecture approved
[ ] Performance acceptable
[ ] Security review passed
[ ] Database changes approved

#### Product Owner Review

[ ] Feature meets requirements
[ ] User experience validated
[ ] Business logic correct
[ ] Ready for production

## Commands Summary

```bash
# Full integration validation
./scripts/run-integration-validation.sh [feature-name]

# Quick validation
npm run validate:integration

# Generate report
npm run report:integration > integration-report.md
```
