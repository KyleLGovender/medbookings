# Logging Guide for MedBookings

This guide explains how to use the structured logging system in MedBookings.

## Table of Contents

- [Overview](#overview)
- [Logger Methods](#logger-methods)
- [Debug Logging with Feature Flags](#debug-logging-with-feature-flags)
- [Adding Debug Logging for New Features](#adding-debug-logging-for-new-features)
- [PHI Protection](#phi-protection)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

MedBookings uses a structured logging system located in `/src/lib/logger.ts` that provides:

- **Structured logging** - All logs go through one consistent system
- **Feature-level control** - Enable/disable debug logs by feature
- **PHI protection** - Built-in sanitization for sensitive data
- **Environment awareness** - Different behavior in development vs production
- **ESLint compliance** - No eslint warnings for using the logger

## Logger Methods

### `logger.debug(feature, message, context?)`

**Use for:** Verbose debugging information that you want to turn on/off

**Behavior:**

- ✅ **Development**: Enabled by default (unless explicitly disabled)
- ❌ **Production**: Disabled by default (unless explicitly enabled)

**Parameters:**

- `feature`: The feature category (`'forms'`, `'maps'`, `'admin'`, etc.)
- `message`: A clear, concise description of what's happening
- `context?`: Optional object with additional data

**Example:**

```typescript
logger.debug('forms', 'Form validation started', {
  formName: 'registration',
  currentStep: 2,
  errors: form.formState.errors,
});
```

### `logger.info(message, context?)`

**Use for:** General informational messages (e.g., successful operations)

**Behavior:**

- ✅ **Development**: Always shown
- ❌ **Production**: Suppressed (unless explicitly configured)

**Example:**

```typescript
logger.info('Booking created successfully', {
  bookingId: data.booking?.id,
  bookingReference: data.booking?.id?.substring(0, 8).toUpperCase(),
  guestName: sanitizeName(data.booking?.guestName),
  startTime: data.booking?.slot?.startTime,
});
```

### `logger.warn(message, context?)`

**Use for:** Warnings that need attention but aren't errors

**Behavior:**

- ✅ **Always shown** in all environments

**Example:**

```typescript
logger.warn('Invalid phone number for WhatsApp', {
  phone: sanitizePhone(phoneNumber),
});
```

### `logger.error(message, error?, context?)`

**Use for:** Errors that need investigation

**Behavior:**

- ✅ **Always shown** in all environments
- Automatically extracts error message and stack trace

**Example:**

```typescript
logger.error('Booking creation failed', error, {
  slotId: variables.slotId,
  guestName: sanitizeName(variables.clientName),
});
```

### `logger.audit(message, context?)`

**Use for:** Security-sensitive operations for compliance

**Behavior:**

- ✅ **Always logged** in all environments
- Includes environment information automatically

**Example:**

```typescript
logger.audit('Admin accessed provider PHI', {
  adminId: sanitizeUserId(session.user.id),
  providerId: sanitizeProviderId(providerId),
  action: 'view_provider_details',
});
```

## Debug Logging with Feature Flags

### Available Debug Features

Debug logging is organized by feature categories:

| Feature           | Description                    | When to Use                                |
| ----------------- | ------------------------------ | ------------------------------------------ |
| `'forms'`         | Form validation and submission | Debugging form issues, validation errors   |
| `'maps'`          | Google Maps initialization     | Map loading issues, location selection     |
| `'admin'`         | Admin operations               | Optimistic updates, admin actions          |
| `'calendar'`      | Calendar operations            | Slot management, availability issues       |
| `'bookings'`      | Booking operations             | Booking creation, cancellation, reschedule |
| `'organizations'` | Organization management        | Org registration, approval workflows       |
| `'providers'`     | Provider management            | Provider registration, updates             |

### Controlling Debug Logs

#### Development Mode (Default Behavior)

By default, **all debug logs are enabled** in development:

```bash
# No configuration needed - debug logs will show
npm run dev
```

To **disable specific features** in development:

```bash
# Add to .env.local
DEBUG_FORMS=false
DEBUG_MAPS=false
```

#### Production Mode (Default Behavior)

By default, **all debug logs are disabled** in production.

To **enable specific features** in production:

```bash
# Add to .env (or set in deployment platform)
DEBUG_FORMS=true
DEBUG_MAPS=true
```

To **enable ALL debug logs** in production (use sparingly):

```bash
DEBUG_ALL=true
```

### Environment Variables Reference

```bash
# Enable all debug logging (development and production)
DEBUG_ALL=true

# Enable specific features (production only)
DEBUG_FORMS=true           # Form validation and submission
DEBUG_MAPS=true            # Google Maps initialization
DEBUG_ADMIN=true           # Admin operations
DEBUG_CALENDAR=true        # Calendar operations
DEBUG_BOOKINGS=true        # Booking operations
DEBUG_ORGANIZATIONS=true   # Organization operations
DEBUG_PROVIDERS=true       # Provider operations

# Disable specific features (development only)
DEBUG_FORMS=false          # Turn off form debug logs in dev
```

## Adding Debug Logging for New Features

When you add a new feature to your codebase, you can easily add debug logging support by following these steps:

### Step 1: Update the Logger Type Definition

Edit `/src/lib/logger.ts` around line 16-36 and add your new feature to the `DebugFeature` type:

```typescript
/**
 * Debug feature flags - enable specific debug logging in development or production
 * Set these in your .env file to enable debug logging for specific features:
 *
 * DEBUG_ALL=true              - Enable all debug logs
 * DEBUG_FORMS=true            - Form validation and submission
 * DEBUG_MAPS=true             - Google Maps initialization and location selection
 * DEBUG_ADMIN=true            - Admin operations and optimistic updates
 * DEBUG_CALENDAR=true         - Calendar operations
 * DEBUG_BOOKINGS=true         - Booking operations
 * DEBUG_ORGANIZATIONS=true    - Organization operations
 * DEBUG_PROVIDERS=true        - Provider operations
 * DEBUG_PAYMENTS=true         - Payment processing (NEW!)
 * DEBUG_NOTIFICATIONS=true    - Notification system (NEW!)
 */
export type DebugFeature =
  | 'forms'
  | 'maps'
  | 'admin'
  | 'calendar'
  | 'bookings'
  | 'organizations'
  | 'providers'
  | 'payments' // ← Add your new feature here
  | 'notifications'; // ← And here
```

**That's it!** The logger automatically:

- ✅ Recognizes the new feature name
- ✅ Enables it by default in development
- ✅ Disables it by default in production
- ✅ Responds to `DEBUG_PAYMENTS=true` environment variable

### Step 2: Use in Your New Feature Code

```typescript
// src/features/payments/hooks/use-process-payment.ts
import { logger } from '@/lib/logger';

export function useProcessPayment() {
  return useMutation({
    onMutate: (variables) => {
      logger.debug('payments', 'Processing payment', {
        amount: variables.amount,
        currency: variables.currency,
      });
    },
    onSuccess: (data) => {
      logger.info('Payment processed successfully', {
        paymentId: data.id,
        status: data.status,
      });
    },
    onError: (error) => {
      logger.error('Payment processing failed', error);
    },
  });
}
```

### Step 3: Update Documentation (Optional but Recommended)

Update the "Available Debug Features" table in this document to include your new feature.

### Real Example: Adding "Payments" Feature

Let's walk through adding a complete payments feature with debug logging:

**1. Update Logger Type**

```typescript
// src/lib/logger.ts (line ~36)
export type DebugFeature =
  | 'forms'
  | 'maps'
  | 'admin'
  | 'calendar'
  | 'bookings'
  | 'organizations'
  | 'providers'
  | 'payments'; // ← NEW
```

**2. Add to Documentation Comments**

```typescript
// src/lib/logger.ts (line ~27)
/**
 * DEBUG_PAYMENTS=true         - Payment processing
 */
```

**3. Use in Your Code**

```typescript
// src/features/payments/lib/stripe-handler.ts
import { logger, sanitizeUserId } from '@/lib/logger';

export async function processPayment(userId: string, amount: number) {
  logger.debug('payments', 'Starting payment process', {
    userId: sanitizeUserId(userId),
    amount,
  });

  try {
    logger.debug('payments', 'Creating Stripe payment intent');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'zar',
    });

    logger.debug('payments', 'Payment intent created', {
      intentId: paymentIntent.id,
      status: paymentIntent.status,
    });

    logger.info('Payment processed successfully', {
      intentId: paymentIntent.id,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Payment processing failed', error, {
      userId: sanitizeUserId(userId),
      amount,
    });
    throw error;
  }
}
```

**4. Control in Environment**

```bash
# Development - payments debug logs show by default
npm run dev

# Production - enable payments debugging only
DEBUG_PAYMENTS=true

# Disable in development (if too noisy)
DEBUG_PAYMENTS=false
```

### TypeScript Benefits

Because we're using TypeScript, you get:

**1. Autocomplete**

```typescript
logger.debug('pay|'); // ← TypeScript suggests: 'payments'
```

**2. Type Safety**

```typescript
logger.debug('paymentss', 'msg'); // ← TypeScript error: 'paymentss' is not a valid feature
logger.debug('payments', 'msg'); // ← ✅ Valid
```

**3. Refactoring Support**

If you rename `'payments'` to `'billing'` in the type definition, TypeScript will show errors everywhere it's used, making it easy to update all usages.

### Checklist for Adding New Features

When adding a new feature module to your codebase:

- [ ] **1.** Add feature to `DebugFeature` type in `/src/lib/logger.ts`
- [ ] **2.** Add documentation comment in logger.ts with `DEBUG_FEATURENAME=true`
- [ ] **3.** Import logger in your feature files: `import { logger } from '@/lib/logger'`
- [ ] **4.** Add debug logs at key decision points in your code
- [ ] **5.** Update `/docs/compliance/LOGGING.md` (optional but recommended)
- [ ] **6.** Test in development - verify logs appear
- [ ] **7.** Test flag control - verify `DEBUG_FEATURENAME=false` disables logs

### Best Practices for New Features

#### Feature Naming Convention

Use **singular, lowercase, descriptive** names:

```typescript
// ✅ GOOD
'payments';
'notifications';
'analytics';
'search';
'auth';

// ❌ BAD
'payment-processing'; // No dashes
'Notifications'; // No capitals
'notifs'; // Too abbreviated
```

#### Feature Granularity

**Prefer feature-level over module-level:**

```typescript
// ✅ GOOD - Feature-level
'payments'     // All payment-related code
'notifications' // All notification code

// ❌ TOO GRANULAR - Module-level
'stripe-payments'
'paypal-payments'
'email-notifications'
'sms-notifications'

// Use context to differentiate:
logger.debug('payments', 'Processing Stripe payment', {...});
logger.debug('payments', 'Processing PayPal payment', {...});
```

### Advanced: Dynamic Feature Registration

If you want to make it even more dynamic (for plugins/modules), you could extend the logger:

```typescript
// src/lib/logger.ts

// Allow runtime feature registration
class Logger {
  private customFeatures = new Set<string>();

  registerFeature(feature: string) {
    this.customFeatures.add(feature);
  }

  private isDebugEnabled(feature?: DebugFeature | string): boolean {
    // Check if it's a custom registered feature
    if (feature && this.customFeatures.has(feature)) {
      const envVar = `DEBUG_${feature.toUpperCase()}`;
      return process.env[envVar] === 'true';
    }

    // Normal feature flag logic...
  }
}

// Usage:
logger.registerFeature('my-plugin');
logger.debug('my-plugin' as any, 'Plugin initialized');
```

**However, we recommend sticking with the TypeScript type approach** because it provides better type safety and IDE support.

### Summary

**Adding debug logging for new features is a 3-step process:**

1. ✏️ **Edit** `/src/lib/logger.ts` - Add feature to `DebugFeature` type
2. 💻 **Use** `logger.debug('your-feature', ...)` in your code
3. 🎛️ **Control** via `DEBUG_YOUR_FEATURE=true/false` environment variable

**No other configuration needed!** The logger automatically handles:

- Environment detection (dev vs prod)
- Default behavior (enabled in dev, disabled in prod)
- Feature flag parsing (`DEBUG_*` environment variables)
- Output formatting

This makes it extremely easy to add comprehensive debug logging to any new feature you build! 🚀

## PHI Protection

**CRITICAL:** Always sanitize PHI before logging!

### Sanitization Functions

Import from `@/lib/logger`:

```typescript
import {
  logger,
  sanitizeContext,
  sanitizeEmail,
  sanitizeName,
  sanitizeOrgId,
  sanitizePhone,
  sanitizeProviderId,
  sanitizeToken,
  sanitizeUserId,
} from '@/lib/logger';
```

### Sanitization Examples

```typescript
// Names: "John Doe" → "Jo** Do*"
logger.info('User registered', {
  userName: sanitizeName(user.name),
});

// Emails: "john@example.com" → "jo***@example.com"
logger.debug('forms', 'Email validation', {
  email: sanitizeEmail(formData.email),
});

// Phone numbers: "+27821234567" → "+2782***4567"
logger.warn('Invalid phone number', {
  phone: sanitizePhone(phoneNumber),
});

// IDs: "abc123" → "[USER:abc123]"
logger.audit('Admin action', {
  userId: sanitizeUserId(userId),
  providerId: sanitizeProviderId(providerId),
});

// Entire context objects
logger.debug(
  'forms',
  'Form data',
  sanitizeContext({
    email: 'john@example.com', // Will be sanitized
    phone: '+27821234567', // Will be sanitized
    name: 'John Doe', // Will be sanitized
    password: 'secret123', // Will be [REDACTED]
    token: 'abc123xyz', // Will be [REDACTED]
  })
);
```

### What Gets Sanitized Automatically

`sanitizeContext()` automatically:

- ✅ **Redacts**: `password`, `token`, `secret`, `key` fields
- ✅ **Sanitizes**: `email`, `phone`, `name` fields
- ✅ **Sanitizes**: `userId` fields

---

## 🔒 POPIA Compliance Requirements (Sprint 4)

**STATUS**: As of Sprint 4 (2025-10-02), **100% PHI sanitization compliance** achieved.

### Mandatory PHI Sanitization

**ALL** logging that includes Protected Health Information (PHI) **MUST** use sanitization helpers.

#### PHI Fields by Model

| Model            | PHI Fields                                        | Sanitization Function                                                        |
| ---------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| **User**         | `email`, `name`                                   | `sanitizeEmail()`, `sanitizeName()`                                          |
| **Provider**     | `contactEmail`, `contactPhone`, `bio`             | `sanitizeEmail()`, `sanitizePhone()`                                         |
| **Organization** | `name`, `contactEmail`, `contactPhone`, `address` | `sanitizeName()`, `sanitizeEmail()`, `sanitizePhone()`                       |
| **Booking**      | `guestName`, `guestEmail`, `guestPhone`, `notes`  | `sanitizeName()`, `sanitizeEmail()`, `sanitizePhone()`, **DO NOT LOG** notes |

#### Critical Rules

1. **NEVER log raw PHI fields** in production logs (`info`, `warn`, `error`, `audit`)
2. **Debug logs** should also sanitize PHI (even though disabled in production)
3. **Booking notes** contain sensitive medical info - **NEVER log them**
4. **Email addresses** in error messages must be sanitized
5. **Phone numbers** in any context must be sanitized

### Common Violations & Fixes

#### Violation 1: Raw Email in Logs

```typescript
// ✅ CORRECT - Sanitized email
import { sanitizeEmail } from '@/lib/logger';

// ❌ WRONG - Exposes raw email (POPIA violation)
logger.info('Testing email delivery to:', to);
logger.warn('Invitation email mismatch', {
  invitationEmail: invitation.email,
  userEmail: ctx.session.user.email,
});

logger.info('Testing email delivery', {
  to: sanitizeEmail(to),
  environment: process.env.NODE_ENV,
});

logger.warn('Invitation email mismatch', {
  invitationEmail: sanitizeEmail(invitation.email),
  userEmail: sanitizeEmail(ctx.session.user.email || ''),
});
```

#### Violation 2: Names in Error Logs

```typescript
// ✅ CORRECT - Sanitized name
import { sanitizeName } from '@/lib/logger';

// ❌ WRONG - Raw patient name
logger.error('Booking failed', {
  patientName: booking.guestName,
});

logger.error('Booking failed', {
  patientName: sanitizeName(booking.guestName),
});
```

#### Violation 3: Phone Numbers

```typescript
// ✅ CORRECT - Sanitized phone
import { sanitizePhone } from '@/lib/logger';

// ❌ WRONG - Raw phone number
logger.warn('Invalid WhatsApp number', {
  phone: user.phone,
});

logger.warn('Invalid WhatsApp number', {
  phone: sanitizePhone(user.phone),
});
```

### Audit Checklist

When writing new logging statements:

- [ ] Does the log include `email`? → Use `sanitizeEmail()`
- [ ] Does the log include `name` or `guestName`? → Use `sanitizeName()`
- [ ] Does the log include `phone` or `contactPhone`? → Use `sanitizePhone()`
- [ ] Does the log include `userId` or `providerId`? → Use `sanitizeUserId()` / `sanitizeProviderId()`
- [ ] Does the log include booking `notes`? → **DO NOT LOG**
- [ ] Is this a debug endpoint? → Still sanitize PHI
- [ ] Is this an error handler? → Sanitize any PHI in error context

### Sprint 4 Fixes Applied

The following files were updated in Sprint 4 to achieve 100% compliance:

1. ✅ `/src/app/api/debug/test-email/route.ts` - Email sanitization in debug endpoint
2. ✅ `/src/server/api/routers/organizations.ts` - Invitation email mismatch logs
3. ✅ `/src/server/api/routers/providers.ts` - Provider invitation email mismatch logs

**Result**: Zero PHI exposure violations remaining (was 2, now 0).

### PHI Sanitization Format Reference

| Helper Function                     | Input Example      | Output Example     | Use Case                    |
| ----------------------------------- | ------------------ | ------------------ | --------------------------- |
| `sanitizeEmail('user@example.com')` | `user@example.com` | `user_***@***.com` | All email fields            |
| `sanitizeName('John Doe')`          | `John Doe`         | `J*** D***`        | User, provider, guest names |
| `sanitizePhone('+27123456789')`     | `+27123456789`     | `***6789`          | All phone numbers           |
| `sanitizeUserId('uuid-123-456')`    | `uuid-123-456`     | `user_***456`      | User IDs in audit logs      |
| `sanitizeProviderId('uuid-789')`    | `uuid-789-012`     | `provider_***012`  | Provider IDs in audit logs  |

---

## Best Practices

### 1. Choose the Right Log Level

```typescript
// ❌ BAD: Using info for debugging
logger.info('Form values', { values: form.getValues() });

// ✅ GOOD: Using debug for debugging
logger.debug('forms', 'Form values', { values: form.getValues() });

// ❌ BAD: Using debug for important events
logger.debug('bookings', 'Payment processed');

// ✅ GOOD: Using info for important events
logger.info('Payment processed successfully', {
  bookingId,
  amount: sanitizeContext({ amount }),
});
```

### 2. Always Sanitize PHI

```typescript
// ❌ BAD: Logging raw PHI
logger.debug('forms', 'User data', {
  name: user.name,
  email: user.email,
  phone: user.phone,
});

// ✅ GOOD: Sanitizing PHI
logger.debug('forms', 'User data', {
  name: sanitizeName(user.name),
  email: sanitizeEmail(user.email),
  phone: sanitizePhone(user.phone),
});

// ✅ BETTER: Using sanitizeContext
logger.debug(
  'forms',
  'User data',
  sanitizeContext({
    name: user.name,
    email: user.email,
    phone: user.phone,
  })
);
```

### 3. Provide Useful Context

```typescript
// ❌ BAD: No context
logger.debug('maps', 'Location selected');

// ✅ GOOD: Useful context
logger.debug('maps', 'Location selected', {
  placeId: location.googlePlaceId,
  address: location.formattedAddress,
  coordinates: location.coordinates,
});
```

### 4. Use Descriptive Messages

```typescript
// ❌ BAD: Vague message
logger.debug('forms', 'Error');

// ✅ GOOD: Specific message
logger.debug('forms', 'Location validation failed', {
  locationIndex: i,
  errors: form.formState.errors.locations?.[i],
});
```

### 5. Log at Key Decision Points

```typescript
const nextStep = async () => {
  // Log before validation
  logger.debug('forms', 'Attempting to go to next step', {
    currentStep,
    formValues: form.getValues(),
  });

  const isValid = await validateStep(currentStep);

  // Log validation result
  logger.debug('forms', 'Step validation result', { isValid });

  if (isValid) {
    // Success path
  } else {
    logger.debug('forms', 'Validation failed, staying on current step');
  }
};
```

## Examples

### Form Validation Debug Logging

```typescript
import { logger } from '@/lib/logger';

const validateStep = async (stepNumber: number) => {
  logger.debug('forms', 'Validating step', { stepNumber });

  if (stepNumber === 2) {
    const locations = form.getValues('locations');
    for (let i = 0; i < locations.length; i++) {
      const isLocationValid = await form.trigger([
        `locations.${i}.name`,
        `locations.${i}.googlePlaceId`,
      ]);

      if (!isLocationValid) {
        logger.debug('forms', `Location ${i} validation failed`, {
          errors: form.formState.errors.locations?.[i],
        });
        return false;
      }
    }
  }

  return true;
};
```

### Google Maps Initialization Debug Logging

```typescript
import { logger } from '@/lib/logger';

const initializeMap = async () => {
  logger.debug('maps', 'Attempting to initialize map');

  // Wait for map container
  while (!mapRef.current && retries < maxRetries) {
    logger.debug('maps', `Waiting for map ref... attempt ${retries + 1}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries++;
  }

  logger.debug('maps', 'Creating map instance', {
    center: defaultCenter,
  });

  const mapInstance = new window.google.maps.Map(mapRef.current, {
    center: defaultCenter,
    zoom: 13,
  });

  logger.debug('maps', 'Map instance created successfully');
};
```

### Booking Operations Logging

```typescript
import { logger, sanitizeName } from '@/lib/logger';

export function useCreateBooking(options?: UseCreateBookingOptions) {
  return api.calendar.createPublicBooking.useMutation({
    onSuccess: async (data, variables) => {
      logger.info('Booking created successfully', {
        bookingId: data.booking?.id,
        bookingReference: data.booking?.id?.substring(0, 8).toUpperCase(),
        guestName: sanitizeName(data.booking?.guestName),
        providerName: sanitizeName(data.booking?.slot?.availability?.provider?.user?.name),
        startTime: data.booking?.slot?.startTime,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      logger.error('Booking creation failed', error, {
        slotId: variables.slotId,
        guestName: sanitizeName(variables.clientName),
      });

      options?.onError?.(new Error(error.message));
    },
  });
}
```

### Admin Operations Debug Logging

```typescript
import { logger } from '@/lib/logger';

const mutation = useMutation({
  onMutate: async ({ id }) => {
    logger.debug('admin', 'Optimistic update - resetting organization status', {
      organizationId: id,
    });

    // Snapshot previous data
    const previousData = queryClient.getQueryData(['org', id]);

    if (!previousData) {
      logger.warn('Could not find organization data to snapshot');
      return null;
    }

    logger.debug('admin', 'Found organization data', {
      actualKey: ['org', id],
    });

    // Optimistic update
    queryClient.setQueryData(['org', id], (old) => ({
      ...old,
      status: 'PENDING_APPROVAL',
    }));

    logger.debug('admin', 'Optimistically updated organization');

    return { previousData };
  },
});
```

## Troubleshooting

### Debug logs not showing in development

Check that you haven't explicitly disabled them:

```bash
# In .env.local - remove these lines if present:
# DEBUG_FORMS=false
# DEBUG_MAPS=false
```

### Debug logs showing in production

This is intentional only if you've enabled them. To disable:

```bash
# Remove from .env or deployment platform:
# DEBUG_ALL=true
# DEBUG_FORMS=true
# etc.
```

### Want to see debug logs for one feature only in production

```bash
# Enable just one feature in production
DEBUG_FORMS=true
```

### Console.error still being used

Check for:

```typescript
// ❌ BAD: Direct console use
console.error('Invalid coordinates');

// ✅ GOOD: Use logger.error
logger.error('Invalid coordinates in result');
```

The logger's `console.error` statements (inside logger.ts) are allowed by ESLint - they're the only place console should be used.

---

## Summary

**Quick Reference:**

| Need              | Use This                          | Example                              |
| ----------------- | --------------------------------- | ------------------------------------ |
| Verbose debugging | `logger.debug(feature, msg, ctx)` | Form validation, map loading         |
| Success messages  | `logger.info(msg, ctx)`           | "Booking created", "User registered" |
| Warnings          | `logger.warn(msg, ctx)`           | Invalid data, deprecated usage       |
| Errors            | `logger.error(msg, error, ctx)`   | Failed operations, caught exceptions |
| Compliance        | `logger.audit(msg, ctx)`          | PHI access, admin actions            |

**Remember:**

- ✅ Always use `logger.*` instead of `console.*`
- ✅ Always sanitize PHI with `sanitize*` functions
- ✅ Use `logger.debug()` with feature flags for verbose debugging
- ✅ Control debug logs via environment variables
