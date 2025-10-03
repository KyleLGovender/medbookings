# Warning Quick Reference

**Quick lookup guide** for resolving validation warnings.

---

## 🚦 PHI Sanitization Decision Tree

```
┌─────────────────────────────┐
│ Warning: Potential PHI Leak │
└──────────┬──────────────────┘
           │
           ▼
    ┌──────────────┐
    │ HIGH CONF?   │
    └──┬─────────┬─┘
       │ Yes     │ No
       ▼         ▼
  ┌────────┐  ┌──────────────┐
  │  FIX   │  │ MEDIUM/LOW?  │
  │  NOW   │  └──┬────────┬──┘
  └────────┘     │ Medium │ Low
                 ▼        ▼
            ┌─────────┐ ┌──────────┐
            │ REVIEW  │ │ SUPPRESS │
            │ & DECIDE│ │ IF SAFE  │
            └─────────┘ └──────────┘
```

---

## 📝 PHI Warning Examples

### Example 1: Direct User Email (HIGH)

```typescript
// ⚠️ [HIGH CONFIDENCE] Potential unsanitized PHI: Email Address
logger.info('User registered', {
  email: user.email
});
```

**Decision**: ✅ **FIX** (High confidence, real PHI)

```typescript
// ✅ FIXED
import { sanitizeEmail } from '@/lib/logger';
logger.info('User registered', {
  email: sanitizeEmail(user.email)
});
```

---

### Example 2: EmailVerified Boolean (MEDIUM)

```typescript
// ⚠️ [MEDIUM CONFIDENCE] Possible Email (Review: May be false positive)
logger.debug('admin', 'User status', {
  emailVerified: user.emailVerified
});
```

**Decision**: 🔇 **SUPPRESS** (It's a boolean, not actual email)

```typescript
// ✅ SUPPRESSED
// phi-safe: emailVerified is a boolean status, not the email address itself
logger.debug('admin', 'User status', {
  emailVerified: user.emailVerified
});
```

---

### Example 3: System Email Config (LOW)

```typescript
// ⚠️ [LOW CONFIDENCE] Possible Email (Review: May be false positive)
logger.info('Notification settings', {
  emailProvider: 'sendgrid',
  emailsPerHour: 100
});
```

**Decision**: 🔇 **SUPPRESS** (Configuration, not user data)

```typescript
// ✅ SUPPRESSED
// phi-safe: system configuration values, not user PHI
logger.info('Notification settings', {
  emailProvider: 'sendgrid',
  emailsPerHour: 100
});
```

---

### Example 4: Medical Notes (CRITICAL)

```typescript
// ⚠️ [HIGH CONFIDENCE] Medical Notes (DO NOT LOG)
logger.debug('bookings', 'Booking details', {
  notes: booking.notes
});
```

**Decision**: ❌ **REMOVE** (Never log medical notes)

```typescript
// ✅ FIXED
logger.debug('bookings', 'Booking details', {
  hasNotes: !!booking.notes,  // Just log presence, not content
  notesLength: booking.notes?.length
});
```

---

## 🔄 Transaction Decision Tree

```
┌──────────────────────────────┐
│ Warning: Missing Transaction │
└───────────┬──────────────────┘
            │
            ▼
     ┌─────────────┐
     │ RISK LEVEL? │
     └─┬─────────┬─┘
       │         │
   ┌───▼──┐   ┌─▼────────┐
   │CRIT/ │   │ MED/LOW? │
   │HIGH  │   └─┬──────┬─┘
   └──┬───┘     │ Med  │ Low
      │         ▼      ▼
      │    ┌────────┐ ┌──────────┐
      │    │REVIEW  │ │SUPPRESS  │
      │    │& FIX   │ │IF SAFE   │
      │    └────────┘ └──────────┘
      ▼
  ┌────────┐
  │  FIX   │
  │  NOW   │
  └────────┘
```

---

## 🔄 Transaction Warning Examples

### Example 1: Booking Creation (CRITICAL)

```typescript
// ⚠️ [CRITICAL RISK] Race condition: Another request could modify between check and action
// Operations: CHECK_THEN_ACT, BOOKING_CREATE, SLOT_UPDATE

const slot = await ctx.prisma.slot.findUnique({ where: { id } });
if (slot.status !== 'AVAILABLE') throw new Error('Unavailable');
await ctx.prisma.booking.create({ data: bookingData });
await ctx.prisma.slot.update({ where: { id }, data: { status: 'BOOKED' } });
```

**Decision**: ✅ **FIX** (Double-booking risk)

```typescript
// ✅ FIXED
await ctx.prisma.$transaction(async (tx) => {
  const slot = await tx.slot.findUnique({ where: { id } });

  if (slot.status !== 'AVAILABLE') {
    throw new TRPCError({ code: 'CONFLICT', message: 'Slot unavailable' });
  }

  await tx.booking.create({ data: bookingData });
  await tx.slot.update({ where: { id }, data: { status: 'BOOKED' } });
}, { maxWait: 10000, timeout: 20000 });
```

---

### Example 2: Audit Log Creation (LOW)

```typescript
// ⚠️ [LOW RISK] Read-only operation - transaction not needed
// Operations: SINGLE_WRITE

await ctx.prisma.auditLog.create({
  data: { action: 'USER_LOGIN', userId }
});
```

**Decision**: 🔇 **SUPPRESS** (Single append-only write)

```typescript
// ✅ SUPPRESSED
// tx-safe: append-only audit log, no consistency requirements
await ctx.prisma.auditLog.create({
  data: { action: 'USER_LOGIN', userId }
});
```

---

### Example 3: User + Notification (MEDIUM)

```typescript
// ⚠️ [MEDIUM RISK] Data consistency: 2 writes should be atomic
// Operations: MULTIPLE_WRITES

await ctx.prisma.user.update({ where: { id }, data: userData });
await ctx.prisma.notification.create({ data: notificationData });
```

**Decision A**: ✅ **FIX** (If notification is critical)

```typescript
// ✅ FIXED - Notification is critical
await ctx.prisma.$transaction([
  ctx.prisma.user.update({ where: { id }, data: userData }),
  ctx.prisma.notification.create({ data: notificationData }),
]);
```

**Decision B**: 🔇 **SUPPRESS** (If notification is best-effort)

```typescript
// ✅ SUPPRESSED - Notification is best-effort
await ctx.prisma.user.update({ where: { id }, data: userData });

// tx-safe: notification is best-effort, user update should succeed independently
await ctx.prisma.notification.create({ data: notificationData }).catch(err => {
  logger.error('Notification failed', err);
});
```

---

### Example 4: Read-Only Query (LOW)

```typescript
// ⚠️ [LOW RISK] Read-only operation - transaction not needed
// Operations: READ_ONLY

const providers = await ctx.prisma.provider.findMany({
  where: { status: 'ACTIVE' },
  take: 50
});
```

**Decision**: 🔇 **SUPPRESS** (No writes)

```typescript
// ✅ SUPPRESSED
// tx-safe: read-only query, no transaction needed
const providers = await ctx.prisma.provider.findMany({
  where: { status: 'ACTIVE' },
  take: 50
});
```

---

## 📊 Suppression Comment Patterns

### PHI Suppression Comments

```typescript
// ✅ Good suppression comments

// phi-safe: emailVerified is a boolean status, not the email value
// phi-safe: email is system configuration (ADMIN_EMAIL env var)
// phi-safe: field already sanitized upstream before logging
// phi-safe: debug-only code, will be removed before production
// phi-safe: phoneNumber here refers to a template variable, not actual PHI
```

### Transaction Suppression Comments

```typescript
// ✅ Good suppression comments

// tx-safe: read-only operation, no writes
// tx-safe: single write, no race condition possible
// tx-safe: append-only audit log, no consistency requirements
// tx-safe: idempotent upsert operation, safe to retry
// tx-safe: notification is best-effort, main operation succeeds independently
// tx-safe: external system handles transaction (Stripe API)
```

---

## ⚡ Quick Actions

### When You See HIGH/CRITICAL Warning

1. **Read the warning message** - understand the risk
2. **Check confidence level** - HIGH/CRITICAL = fix, don't suppress
3. **Apply the suggested fix** - provided in warning output
4. **Verify fix works** - run validator again
5. **Commit** - warning should be gone

### When You See MEDIUM/LOW Warning

1. **Review the code context** - is it a real issue?
2. **Check the confidence level** - guides your decision
3. **Decision**:
   - **Real issue?** → Fix it
   - **False positive?** → Add suppression comment with reason
4. **Commit** - warning should be suppressed or gone

---

## 🎯 Common Mistakes

### ❌ Mistake 1: Suppressing Without Understanding

```typescript
// ❌ BAD - No understanding, just suppressing to silence warning
// phi-safe: ignore
logger.info('User', { email: user.email });
```

**Why Bad**: Could be real PHI exposure!

```typescript
// ✅ GOOD - Fix or document clearly
import { sanitizeEmail } from '@/lib/logger';
logger.info('User', { email: sanitizeEmail(user.email) });
```

---

### ❌ Mistake 2: Vague Suppression Rationale

```typescript
// ❌ BAD - Vague reason
// tx-safe: not needed
await ctx.prisma.booking.create({ data });
```

**Why Bad**: Future developer won't know why it's safe!

```typescript
// ✅ GOOD - Specific reason
// tx-safe: single create operation with no dependent updates,
//          no race condition possible due to unique constraint on booking.slotId
await ctx.prisma.booking.create({ data });
```

---

### ❌ Mistake 3: Suppressing CRITICAL Warnings

```typescript
// ❌ BAD - Suppressing critical double-booking risk
// tx-safe: looks fine to me
const slot = await ctx.prisma.slot.findUnique({ where: { id } });
if (slot.status !== 'AVAILABLE') throw new Error('Unavailable');
await ctx.prisma.booking.create({ data });
```

**Why Bad**: This WILL cause double-bookings in production!

```typescript
// ✅ GOOD - Fix the race condition
await ctx.prisma.$transaction(async (tx) => {
  const slot = await tx.slot.findUnique({ where: { id } });
  if (slot.status !== 'AVAILABLE') {
    throw new TRPCError({ code: 'CONFLICT', message: 'Slot unavailable' });
  }
  await tx.booking.create({ data });
  await tx.slot.update({ where: { id }, data: { status: 'BOOKED' } });
});
```

---

## 📈 Success Metrics

**Healthy codebase**:
- ✅ 0 CRITICAL unsuppressed warnings
- ✅ 0 HIGH unsuppressed warnings
- ✅ < 10 MEDIUM unsuppressed warnings (being reviewed)
- ✅ All suppressions have clear rationale

**Warning codebase**:
- ⚠️ > 0 CRITICAL warnings (fix immediately!)
- ⚠️ > 5 HIGH warnings (prioritize fixing)
- ⚠️ > 20 MEDIUM warnings (schedule review sprint)
- ⚠️ Suppressions without rationale (add documentation)

---

## 🔗 Related Documentation

- [Full Warning Suppression Guide](/docs/WARNING-SUPPRESSION-GUIDE.md)
- [LOGGING.md](/docs/LOGGING.md) - PHI protection details
- [ENFORCEMENT.md](/docs/ENFORCEMENT.md) - Overall enforcement system
- [TIMEZONE-GUIDELINES.md](/docs/TIMEZONE-GUIDELINES.md) - Timezone patterns
