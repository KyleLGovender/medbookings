# Warning Suppression Guide

**Purpose**: Learn how to resolve, suppress, and track validation warnings systematically.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [When to Suppress vs Fix](#when-to-suppress-vs-fix)
3. [PHI Sanitization Warnings](#phi-sanitization-warnings)
4. [Transaction Warnings](#transaction-warnings)
5. [Tracking Progress](#tracking-progress)
6. [Best Practices](#best-practices)

---

## Overview

### What Are Warnings?

**Warnings** are validation messages that:
- ✅ **Allow commits** to proceed
- ⚠️  **Require review** and decision
- 📝 **Should be resolved** over time
- 🔍 **May be false positives**

### Warning Categories

| Severity | Confidence | Action Required |
|----------|------------|-----------------|
| **CRITICAL** | 95%+ | Must fix - data integrity risk |
| **HIGH** | 80-95% | Should fix - likely real issue |
| **MEDIUM** | 50-80% | Review - may be false positive |
| **LOW** | <50% | Check - probably false positive |

---

## When to Suppress vs Fix

### ✅ Fix the Code (Recommended)

**Fix when**:
- Warning is **HIGH or CRITICAL** confidence
- Code actually contains a security/data integrity issue
- Sanitization/transaction is genuinely needed

**Example**:
```typescript
// ⚠️ WARNING: HIGH CONFIDENCE - Potential unsanitized PHI
logger.info('User registered', {
  email: user.email  // ← Real PHI exposure!
});

// ✅ FIX: Add sanitization
import { sanitizeEmail } from '@/lib/logger';
logger.info('User registered', {
  email: sanitizeEmail(user.email)
});
```

### 🔇 Suppress the Warning

**Suppress when**:
- Warning is **LOW or MEDIUM** confidence and you've reviewed it
- Code is correct but validator can't detect that
- False positive you've verified manually

**Example**:
```typescript
// ⚠️ WARNING: MEDIUM CONFIDENCE - Possible PHI
logger.info('Email verification status', {
  emailVerified: user.emailVerified  // ← Not PHI! It's a boolean
});

// ✅ SUPPRESS: Add documentation
// phi-safe: emailVerified is a boolean status, not the actual email address
logger.info('Email verification status', {
  emailVerified: user.emailVerified
});
```

---

## PHI Sanitization Warnings

### Understanding Confidence Levels

#### HIGH Confidence (Fix Immediately)

```typescript
// ⚠️ HIGH CONFIDENCE - Direct PHI access
logger.info('Booking created', {
  email: booking.guestEmail,      // ← Real PHI
  name: booking.guestName,        // ← Real PHI
  phone: booking.guestPhone,      // ← Real PHI
});

// ✅ FIX
import { sanitizeEmail, sanitizeName, sanitizePhone } from '@/lib/logger';
logger.info('Booking created', {
  email: sanitizeEmail(booking.guestEmail),
  name: sanitizeName(booking.guestName),
  phone: sanitizePhone(booking.guestPhone),
});
```

#### MEDIUM Confidence (Review Required)

```typescript
// ⚠️ MEDIUM CONFIDENCE - Ambiguous field
logger.debug('forms', 'Email validation', {
  email: formData.email  // Could be PHI or system field
});

// ✅ Option 1: If it IS PHI → Sanitize
import { sanitizeEmail } from '@/lib/logger';
logger.debug('forms', 'Email validation', {
  email: sanitizeEmail(formData.email)
});

// ✅ Option 2: If it's NOT PHI → Suppress
// phi-safe: formData.email is a configuration email for system notifications
logger.debug('forms', 'Email validation', {
  email: formData.email
});
```

#### LOW Confidence (Likely False Positive)

```typescript
// ⚠️ LOW CONFIDENCE - Keyword match, not actual PHI
logger.info('Email service initialized', {
  emailProvider: 'sendgrid',  // ← Not PHI, just contains word "email"
  emailsPerHour: 100,
});

// ✅ SUPPRESS: Obviously not PHI
// phi-safe: configuration values, not user data
logger.info('Email service initialized', {
  emailProvider: 'sendgrid',
  emailsPerHour: 100,
});
```

### Special Cases

#### Already Sanitized Upstream

```typescript
// Data already sanitized before logging
const sanitizedData = {
  email: sanitizeEmail(user.email),
  name: sanitizeName(user.name),
};

// phi-safe: data pre-sanitized upstream
logger.info('User data', sanitizedData);
```

#### Debug Code (Temporary)

```typescript
// phi-safe: debug code, will be removed before production
logger.debug('admin', 'Full user object', {
  user: user  // Normally would need sanitization
});
```

#### System/Configuration Values

```typescript
// phi-safe: ADMIN_EMAIL is system configuration, not user PHI
logger.info('Admin notification sent', {
  to: process.env.ADMIN_EMAIL
});
```

### Suppression Comment Format

```typescript
// phi-safe: [clear reason why this is not PHI]
logger.info(...)

// OR inline
logger.info('message', { field: value }); // phi-safe: [reason]
```

---

## Transaction Warnings

### Understanding Risk Levels

#### CRITICAL Risk (Must Fix)

**Pattern**: Check-then-act with booking/slot operations

```typescript
// ⚠️ CRITICAL RISK - Race condition: Double-booking possible
const slot = await ctx.prisma.slot.findUnique({ where: { id } });
if (slot.status !== 'AVAILABLE') {
  throw new Error('Unavailable');
}
await ctx.prisma.booking.create({ data: bookingData });
await ctx.prisma.slot.update({ where: { id }, data: { status: 'BOOKED' } });

// ✅ FIX: Use transaction
await ctx.prisma.$transaction(async (tx) => {
  const slot = await tx.slot.findUnique({ where: { id } });

  if (slot.status !== 'AVAILABLE') {
    throw new TRPCError({ code: 'CONFLICT', message: 'Slot unavailable' });
  }

  await tx.booking.create({ data: bookingData });
  await tx.slot.update({ where: { id }, data: { status: 'BOOKED' } });
}, {
  maxWait: 10000,
  timeout: 20000,
});
```

#### HIGH Risk (Should Fix)

**Pattern**: Multiple related writes

```typescript
// ⚠️ HIGH RISK - Multiple writes should be atomic
await ctx.prisma.provider.update({ where: { id }, data: { status: 'ACTIVE' } });
await ctx.prisma.subscription.create({ data: subscriptionData });
await ctx.prisma.notification.create({ data: notificationData });

// ✅ FIX: Wrap in transaction
await ctx.prisma.$transaction([
  ctx.prisma.provider.update({ where: { id }, data: { status: 'ACTIVE' } }),
  ctx.prisma.subscription.create({ data: subscriptionData }),
  ctx.prisma.notification.create({ data: notificationData }),
]);
```

#### MEDIUM Risk (Review Needed)

**Pattern**: Two writes, possibly independent

```typescript
// ⚠️ MEDIUM RISK - Two writes, but may be independent
await ctx.prisma.user.update({ where: { id }, data: userData });
await ctx.prisma.auditLog.create({ data: logData });

// ✅ Option 1: If audit is critical → Use transaction
await ctx.prisma.$transaction([
  ctx.prisma.user.update({ where: { id }, data: userData }),
  ctx.prisma.auditLog.create({ data: logData }),
]);

// ✅ Option 2: If audit can be eventual → Suppress
// tx-safe: audit log is best-effort, user update can succeed independently
await ctx.prisma.user.update({ where: { id }, data: userData });
await ctx.prisma.auditLog.create({ data: logData }).catch(err =>
  logger.warn('Audit log failed', { error: err.message })
);
```

#### LOW Risk (Usually Safe)

**Pattern**: Single write or read-only

```typescript
// ⚠️ LOW RISK - Single write, no dependencies
await ctx.prisma.auditLog.create({ data: logData });

// ✅ SUPPRESS: Single operation, no race condition
// tx-safe: single write operation, no concurrent modification risk
await ctx.prisma.auditLog.create({ data: logData });
```

```typescript
// ⚠️ LOW RISK - Read-only
const providers = await ctx.prisma.provider.findMany({ take: 50 });

// ✅ SUPPRESS: No writes
// tx-safe: read-only operation
const providers = await ctx.prisma.provider.findMany({ take: 50 });
```

### When Transactions Are NOT Needed

#### ✅ Idempotent Operations

```typescript
// tx-safe: idempotent operation, safe to retry, no race condition
await ctx.prisma.emailVerificationToken.upsert({
  where: { identifier: email },
  update: { token, expires },
  create: { identifier: email, token, expires },
});
```

#### ✅ Append-Only Logs

```typescript
// tx-safe: append-only audit log, no consistency risk
await ctx.prisma.auditLog.create({
  data: { action: 'USER_LOGIN', userId }
});
```

#### ✅ Independent Operations

```typescript
// tx-safe: notification is independent, failure doesn't affect user update
await ctx.prisma.user.update({ where: { id }, data });
await sendEmail(user.email).catch(err => logger.error('Email failed', err));
```

### Suppression Comment Format

```typescript
// tx-safe: [clear reason why transaction is not needed]
await ctx.prisma.model.operation();

// OR with detailed justification
// tx-safe: operation is idempotent and safe to retry
//          no race condition possible due to unique constraint
await ctx.prisma.model.upsert(...);
```

---

## Tracking Progress

### Run Validation Report

```bash
# See all warnings in codebase
node scripts/validation/claude-code-validator.js scan-all

# Filter by severity
node scripts/validation/claude-code-validator.js scan-all --severity=HIGH

# Generate suppression report
node scripts/validation/claude-code-validator.js suppression-report
```

### Expected Output

```
📊 Warning Summary
===================

Total Warnings: 47

By Confidence:
  CRITICAL: 3  ← Fix immediately
  HIGH:     12 ← Fix soon
  MEDIUM:   18 ← Review and decide
  LOW:      14 ← Likely false positives

By Type:
  PHI_SANITIZATION:    23
  MISSING_TRANSACTION: 24

Suppressed Warnings: 15 (documented and reviewed)

📈 Progress: 68% resolved (32 of 47 fixed)
```

### Sprint Planning

**Sprint Goal**: Reduce HIGH/CRITICAL warnings to zero

```
Week 1: Fix all CRITICAL confidence warnings (3 items)
Week 2: Fix all HIGH confidence warnings (12 items)
Week 3: Review MEDIUM warnings, suppress false positives
Week 4: Document suppression rationale, update enforcement config
```

---

## Best Practices

### 1. Fix Before Suppressing

```typescript
// ❌ BAD: Suppress without thinking
// phi-safe: whatever
logger.info('User', { email: user.email });

// ✅ GOOD: Consider fix first
import { sanitizeEmail } from '@/lib/logger';
logger.info('User', { email: sanitizeEmail(user.email) });
```

### 2. Document Suppression Rationale

```typescript
// ❌ BAD: Vague suppression
// phi-safe: not needed
logger.info('Status', { emailVerified: user.emailVerified });

// ✅ GOOD: Clear explanation
// phi-safe: emailVerified is a boolean status field, not the actual email address
logger.info('Status', { emailVerified: user.emailVerified });
```

### 3. Review Suppressions in Code Review

**PR Checklist**:
- [ ] All suppressions have clear rationale
- [ ] HIGH/CRITICAL warnings are fixed, not suppressed
- [ ] Suppression comments explain WHY, not just WHAT

### 4. Periodic Suppression Audit

**Quarterly**: Review all suppressed warnings

```bash
# Find all suppressions
grep -r "phi-safe" src/
grep -r "tx-safe" src/

# Check if rationale still valid
# Update or remove outdated suppressions
```

---

## Common Patterns

### Pattern 1: Configuration vs User Data

```typescript
// System configuration - safe to log
// phi-safe: SENDGRID_FROM_EMAIL is system config, not user PHI
logger.info('Email sent from', { from: SENDGRID_FROM_EMAIL });

// User data - sanitize
logger.info('Email sent to', { to: sanitizeEmail(user.email) });
```

### Pattern 2: Boolean Status vs String Value

```typescript
// Boolean status - safe to log
// phi-safe: emailVerified is a boolean, not the email value
logger.info('Verification status', { emailVerified: user.emailVerified });

// Email value - sanitize
logger.info('Email address', { email: sanitizeEmail(user.email) });
```

### Pattern 3: Audit Logs (Best-Effort)

```typescript
// tx-safe: audit log is best-effort, main operation should succeed independently
await ctx.prisma.booking.update({ where: { id }, data });
await ctx.prisma.auditLog.create({ data: auditData }).catch(err => {
  logger.error('Audit log failed', err);
  // Don't fail the main operation
});
```

---

## Summary

**Golden Rules**:

1. **Fix CRITICAL/HIGH confidence warnings** - don't suppress
2. **Review MEDIUM warnings** - fix or document suppression
3. **Suppress LOW warnings** with clear rationale
4. **Document WHY**, not just add `// phi-safe:`
5. **Track progress** - aim for zero unsuppressed HIGH/CRITICAL
6. **Audit suppressions** quarterly

**Success Metrics**:

- ✅ Zero CRITICAL warnings
- ✅ Zero HIGH warnings
- ✅ All MEDIUM warnings reviewed and decided
- ✅ All suppressions documented with rationale
- ✅ Suppression rate < 20% (most warnings fixed, not suppressed)

---

## Need Help?

**Unsure if warning is valid?**
1. Check confidence level (HIGH = probably real)
2. Review the specific fix suggestion
3. Ask in code review
4. Consult `/docs/enforcement/LOGGING.md` or `/docs/enforcement/TIMEZONE-GUIDELINES.md`

**Tool showing false positives?**
1. Add suppression comment with rationale
2. Report pattern to team (may need validator improvement)
3. Check if enforcement config needs update
