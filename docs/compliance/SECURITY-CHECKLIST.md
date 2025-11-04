# Production Security & POPIA Compliance Checklist

This document provides a comprehensive security checklist for deploying MedBookings to production with full POPIA compliance.

> 📄 **For deployment instructions**, see `/docs/deployment/VERCEL-DEPLOYMENT.md` and `/docs/deployment/UPSTASH-REDIS-SETUP.md`

---

## Table of Contents

1. [Pre-Deployment Security Verification](#pre-deployment-security-verification)
2. [POPIA Compliance Requirements](#popia-compliance-requirements)
3. [Environment Variable Security](#environment-variable-security)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Security Testing Procedures](#security-testing-procedures)
6. [Monitoring & Incident Response](#monitoring--incident-response)
7. [Regular Maintenance](#regular-maintenance)

---

## Pre-Deployment Security Verification

Complete this checklist BEFORE deploying to production:

### Authentication & Authorization

- [ ] ✅ **Password complexity enforced** (8+ chars, uppercase, lowercase, number, special)
- [ ] ✅ **Session timeout configured** (30 minutes - POPIA Section 19)
- [ ] ✅ **Account lockout enabled** (5 failed attempts → 15-minute lockout)
- [ ] ✅ **Email verification** required for registration
- [ ] ✅ **Secure password hashing** (bcrypt with appropriate cost factor)
- [ ] ✅ **CSRF protection enabled** (NextAuth.js built-in)
- [ ] ✅ **OAuth 2.0 flow** configured correctly (Google)

**Verification**:
```typescript
// src/lib/auth.ts - Session timeout
session: {
  strategy: 'jwt',
  maxAge: 30 * 60, // 30 minutes (POPIA Section 19)
  updateAge: 5 * 60, // Refresh every 5 minutes
}

// src/lib/password-validation.ts - Complexity requirements
PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
```

### Rate Limiting

- [ ] ✅ **Upstash Redis configured** (REQUIRED for production)
- [ ] ✅ **tRPC API rate limiting** (100 requests/minute per IP)
- [ ] ✅ **Auth endpoint protection** (5 attempts per 15 minutes)
- [ ] ✅ **File upload limits** (10 uploads per hour)
- [ ] ✅ **Email verification limits** (5 emails per hour)
- [ ] ✅ **Fail-closed behavior** in production (denies requests if Redis unavailable)

**Critical**: Without Redis, rate limiting fails in multi-instance serverless deployments.

**Verification**:
- Environment variables set: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Test rate limiting works (see [Security Testing](#security-testing-procedures))

### Security Headers

- [ ] ✅ **HSTS enabled** (`Strict-Transport-Security: max-age=63072000`)
- [ ] ✅ **X-Frame-Options** (`SAMEORIGIN` - prevents clickjacking)
- [ ] ✅ **X-Content-Type-Options** (`nosniff` - prevents MIME sniffing)
- [ ] ✅ **Referrer-Policy** (`origin-when-cross-origin`)
- [ ] ✅ **Permissions-Policy** (restricts camera, microphone, geolocation)
- [ ] ✅ **Content-Security-Policy** (if applicable)

**Verification**: See [Post-Deployment Verification](#post-deployment-verification)

### Input Validation & Sanitization

- [ ] ✅ **SQL injection protection** (Prisma ORM with parameterized queries)
- [ ] ✅ **XSS protection** (React escaping + sanitization functions)
- [ ] ✅ **File upload validation** (size limits, type restrictions, authentication required)
- [ ] ✅ **Zod schemas** for all API input validation
- [ ] ✅ **PHI sanitization** in logs (email, phone masking)

**Verification**:
```typescript
// src/lib/logger.ts - PHI sanitization
sanitizeEmail('user@example.com') // Returns 'u***@example.com'
sanitizePhone('+27123456789')     // Returns '+27****6789'
```

### Database Security

- [ ] ✅ **Connection string secured** (TLS enabled)
- [ ] ✅ **Database credentials** stored in environment variables (never committed)
- [ ] ✅ **Prisma migrations applied** to production
- [ ] ✅ **Database indexes created** (performance + security)
- [ ] ✅ **Audit logging table** exists (`AuditLog` model)
- [ ] ✅ **Row-level security** (where applicable)

**Key Indexes** (Sprint 3+):
- `LoginAttempt.email + createdAt`
- `LoginAttempt.userId + createdAt`
- `LoginAttempt.ipAddress + createdAt`
- `AuditLog.userId + createdAt`
- `Booking.slotId`, `Booking.userId + status`

---

## POPIA Compliance Requirements

### Section 19: Security Safeguards

**Requirement**: "Secure the integrity and confidentiality of personal information."

#### Implementation Checklist

- [ ] ✅ **Session timeout** (30 minutes maximum idle time)
- [ ] ✅ **Automatic logout** on timeout
- [ ] ✅ **Session refresh** on activity (5-minute window)
- [ ] ✅ **Secure cookie** flags (`httpOnly`, `secure`, `sameSite`)
- [ ] ✅ **TLS/HTTPS enforced** (HSTS header)
- [ ] ✅ **Password encryption** at rest (bcrypt)
- [ ] ✅ **Password transmission** over HTTPS only

**Testing**: See [Session Timeout Verification](#session-timeout-verification)

### Section 22: Audit Trail

**Requirement**: "Maintain documentation of all processing activities."

#### Implementation Checklist

- [ ] ✅ **Audit logging enabled** (database-backed)
- [ ] ✅ **Admin actions logged** (approvals, rejections, deletions)
- [ ] ✅ **User authentication events** logged (login attempts, lockouts)
- [ ] ✅ **Data access events** logged (PHI access)
- [ ] ✅ **Log retention policy** implemented
- [ ] ✅ **PHI sanitized in logs** (email/phone masking)

**Key Events Logged**:
```typescript
// Admin actions (src/server/api/routers/admin.ts)
- Provider approval/rejection
- Requirement validation
- Organization approval/rejection
- User role changes

// Authentication (src/lib/auth.ts + login handlers)
- Login attempts (success/failure)
- Account lockouts
- Password resets
- Email verifications
```

**Verification**:
```typescript
// Check audit logs exist
await prisma.auditLog.count() // Should return > 0 after admin actions
```

### Section 8: Data Minimization

**Requirement**: "Process only personal information that is adequate, relevant, and not excessive."

#### Implementation Checklist

- [ ] ✅ **IDOR vulnerabilities fixed** (authorization checks on all endpoints)
- [ ] ✅ **PHI removed from public APIs** (provider listings)
- [ ] ✅ **Conditional PHI exposure** (owners/admins only)
- [ ] ✅ **Requirement documents hidden** from non-owners
- [ ] ✅ **Booking details restricted** to participants only
- [ ] ✅ **Email addresses masked** in non-authenticated contexts

**Key Protections**:
```typescript
// src/server/api/routers/providers.ts:54-114
// Removes PHI for non-owners/non-admins
if (!isOwner && !isAdmin) {
  return {
    ...provider,
    user: {
      id: provider.user.id,
      name: provider.user.name,
      image: provider.user.image,
      email: null, // ← PHI removed
      phone: null, // ← PHI removed
    },
    requirementSubmissions: [], // ← Documents hidden
  };
}
```

### Section 18: Breach Notification

**Requirement**: "Notify affected parties and regulator within 72 hours of breach."

#### Preparation Checklist

- [ ] ✅ **Incident response plan** documented
- [ ] ✅ **Breach detection mechanisms** in place (monitoring)
- [ ] ✅ **Contact information** for Information Regulator
- [ ] ✅ **Breach notification template** prepared
- [ ] ✅ **Audit logs preserved** for forensic analysis
- [ ] ✅ **Backup retention policy** (90 days minimum)

**See**: [Security Incident Response](#security-incident-response)

---

## Environment Variable Security

### Required Security Configuration

All sensitive values MUST be stored in environment variables:

```env
# Authentication (CRITICAL)
NEXTAUTH_SECRET="[min 32 characters, cryptographically random]"
NEXTAUTH_URL="https://your-production-domain.com"

# Database (CRITICAL)
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public"

# Rate Limiting (CRITICAL for production)
UPSTASH_REDIS_REST_URL="https://[instance].upstash.io"
UPSTASH_REDIS_REST_TOKEN="[token from Upstash]"

# OAuth (CRITICAL)
GOOGLE_CLIENT_ID="[production client id].apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="[production client secret]"

# Email/SMS (HIGH)
SENDGRID_API_KEY="SG.[key]"
SENDGRID_FROM_EMAIL="noreply@your-domain.com"
TWILIO_ACCOUNT_SID="AC[sid]"
TWILIO_AUTH_TOKEN="[token]"

# Storage (HIGH)
BLOB_READ_WRITE_TOKEN="[Vercel Blob token]"

# Optional
ADMIN_EMAILS="admin@example.com,admin2@example.com"
ADMIN_NOTIFICATION_EMAIL="notifications@example.com"
```

### Security Validation Checklist

- [ ] ✅ **NEXTAUTH_SECRET is strong** (32+ characters, random, not guessable)
- [ ] ✅ **Production credentials** (not test/development keys)
- [ ] ✅ **Database URL uses TLS** (`?sslmode=require` or `?ssl=true`)
- [ ] ✅ **No credentials in code** (`.env` files gitignored)
- [ ] ✅ **Environment variable validation** (Zod schema in `src/config/env/server.ts`)
- [ ] ✅ **Graceful degradation** for optional services (Twilio, SendGrid)
- [ ] ✅ **Fail-closed for critical services** (Redis, Database, Auth)

**Generate strong NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

**Verify environment validation**:
```typescript
// src/config/env/server.ts
export const env = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // ... with conditional requirements for production
}).parse(process.env);
```

---

## Post-Deployment Verification

### 1. Security Headers Verification

**Test Command**:
```bash
curl -I https://your-domain.com
```

**Expected Headers**:
```http
HTTP/2 200
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
referrer-policy: origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
```

**Status**:
- [ ] ✅ All security headers present
- [ ] ✅ HSTS enabled with long max-age
- [ ] ✅ No sensitive information in headers

### 2. Rate Limiting Verification

**Test tRPC API Rate Limit** (100 requests/minute):
```bash
# Make 101 requests rapidly
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "https://your-domain.com/api/trpc/providers.getAll"
done
```

**Expected Result**:
- Requests 1-100: HTTP 200
- Request 101: HTTP 429 (Too Many Requests)

**Test Auth Rate Limit** (5 attempts per 15 minutes):
```bash
# Attempt registration 6 times with same email
for i in {1..6}; do
  curl -X POST https://your-domain.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test\",\"email\":\"test@example.com\",\"password\":\"Test123!@#$\"}"
done
```

**Expected Result**: 6th request returns HTTP 429

**Status**:
- [ ] ✅ tRPC API rate limiting works
- [ ] ✅ Auth rate limiting works
- [ ] ✅ Rate limit headers returned (X-RateLimit-Limit, X-RateLimit-Remaining)

### 3. Session Timeout Verification

**Manual Test**:
1. Login to application
2. Note the session start time
3. Leave browser tab idle (no clicks/typing)
4. Wait 30 minutes
5. Attempt to access a protected route (e.g., /dashboard)

**Expected Result**:
- Automatically redirected to `/auth/signin`
- Session expired message shown

**Automated Test**:
```typescript
// Test in browser console after 30 min
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => console.log('Session:', session))
// Expected: session = null or error
```

**Status**:
- [ ] ✅ Session expires after 30 minutes idle
- [ ] ✅ User redirected to login page
- [ ] ✅ Session refreshes on activity (within 30 min window)

### 4. Account Lockout Verification

**Test Procedure**:
1. Attempt login with wrong password 5 times
2. Expected: 5th attempt shows "Account locked" error
3. Wait 15 minutes
4. Attempt login with correct password
5. Expected: Login succeeds

**Automated Test**:
```bash
# Attempt login 6 times with wrong password
for i in {1..6}; do
  curl -X POST https://your-domain.com/api/auth/callback/credentials \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test@example.com\",\"password\":\"WrongPassword123!@#$\"}"
  sleep 1
done
```

**Status**:
- [ ] ✅ Account locks after 5 failed attempts
- [ ] ✅ Lockout duration is 15 minutes
- [ ] ✅ Login works after lockout expires

### 5. Password Complexity Verification

**Test Weak Passwords**:
```bash
# Test various weak passwords (all should fail)
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test1@example.com","password":"password"}'

curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test2@example.com","password":"Password"}'

curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test3@example.com","password":"Pass123"}'
```

**Test Strong Password**:
```bash
# Should succeed
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test4@example.com","password":"SecureP@ssw0rd"}'
```

**Status**:
- [ ] ✅ Weak passwords rejected with clear error message
- [ ] ✅ Strong passwords accepted
- [ ] ✅ Error message shows requirements

### 6. IDOR Protection Verification

**Test Provider Endpoint**:
```bash
# As unauthenticated user, request provider details
curl https://your-domain.com/api/trpc/providers.getById?input={\"id\":\"[provider-id]\"}
```

**Expected Result**:
- Public data returned (name, services, availability)
- PHI removed (email, phone)
- Documents hidden (requirementSubmissions = [])

**Test as Authenticated Non-Owner**:
```bash
# Login as different user, request provider details
# Expected: Same as above (PHI removed)
```

**Test as Owner/Admin**:
```bash
# Login as provider owner or admin, request provider details
# Expected: Full data including PHI and documents
```

**Status**:
- [ ] ✅ Public endpoints hide PHI
- [ ] ✅ Authorization checks enforce ownership
- [ ] ✅ Admin access bypasses ownership checks appropriately

---

## Security Testing Procedures

### Automated Security Scan

Run before each production deployment:

```bash
# 1. Dependency audit
npm audit

# 2. Fix critical vulnerabilities
npm audit fix

# 3. Check for vulnerable packages
npm outdated

# 4. TypeScript type check (catches some security issues)
npx tsc --noEmit

# 5. ESLint security rules
npm run lint
```

**Status**:
- [ ] ✅ Zero critical vulnerabilities
- [ ] ✅ Zero high vulnerabilities (or documented exceptions)
- [ ] ✅ TypeScript compilation succeeds
- [ ] ✅ ESLint passes with no errors

### Manual Security Testing

**XSS Testing**:
```javascript
// Test in form inputs
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
```
Expected: Input sanitized, no script execution

**SQL Injection Testing** (should be prevented by Prisma):
```javascript
// Test in search/filter inputs
' OR '1'='1
'; DROP TABLE users; --
```
Expected: Treated as literal string, no SQL execution

**CSRF Testing**:
- Attempt POST requests without CSRF token
- Expected: Request rejected

**Status**:
- [ ] ✅ XSS attacks mitigated
- [ ] ✅ SQL injection prevented (Prisma parameterized queries)
- [ ] ✅ CSRF protection active

---

## Monitoring & Incident Response

### Monitoring Requirements

**Daily Monitoring**:
- [ ] Error logs in Vercel dashboard
- [ ] Rate limit metrics in Upstash dashboard
- [ ] Failed login attempts in database (`LoginAttempt` table)
- [ ] Audit log volume (sudden spikes indicate issues)

**Weekly Monitoring**:
- [ ] `LoginAttempt` table size (cleanup if excessive)
- [ ] Database performance metrics
- [ ] SSL certificate expiration (auto-renewed by Vercel)
- [ ] Upstash Redis usage (commands/day)

**Monthly Monitoring**:
- [ ] Review audit logs for suspicious patterns
- [ ] `npm audit` for new vulnerabilities
- [ ] Security header configuration (no regressions)
- [ ] Backup integrity verification

### Security Incident Response

#### If Rate Limit Bypass Detected

1. **Verify Redis Connection**:
   ```bash
   # Check Upstash dashboard for connectivity
   # Verify environment variables are set correctly
   ```

2. **Review Application Logs**:
   - Check Vercel logs for "Rate limit exceeded" messages
   - Look for patterns indicating bypass attempts

3. **Temporary Mitigation**:
   - Reduce rate limits in `src/lib/rate-limit.ts`
   - Add IP blocking if necessary (Vercel Firewall)

4. **Long-term Fix**:
   - Investigate code for rate limit logic errors
   - Consider adding additional rate limit layers

#### If Account Takeover Detected

1. **Immediate Actions**:
   - Force password reset for affected accounts
   - Invalidate all sessions (rotate `NEXTAUTH_SECRET` in production)
   - Enable MFA for affected accounts (if implemented)

2. **Investigation**:
   - Review `LoginAttempt` table for suspicious patterns
   - Check audit logs for unauthorized admin actions
   - Identify attack vector (credential stuffing, phishing, etc.)

3. **Notify Affected Users** (POPIA Section 18):
   - Within 72 hours of confirmed breach
   - Provide details: what data compromised, when, how to protect themselves
   - Notify Information Regulator if PHI compromised

#### If DoS Attack Detected

1. **Verify Rate Limiting Active**:
   - Check Upstash dashboard shows blocked requests
   - Verify rate limit headers in responses

2. **Identify Attack Pattern**:
   - Single IP vs distributed
   - Target endpoints
   - Request volume

3. **Mitigation**:
   - Verify rate limiting working correctly
   - Consider Vercel Firewall rules (paid feature)
   - Contact Vercel support for DDoS protection

#### Breach Notification Template (POPIA Section 18)

**To Users**:
```
Subject: Security Notice - [Your Company Name]

Dear [User Name],

We are writing to inform you of a security incident that may have affected your account.

What Happened: [Brief description of breach]
When: [Date/time of breach]
What Data: [Types of data potentially compromised]
What We're Doing: [Steps taken to secure systems]
What You Should Do: [Actions for users - password reset, etc.]

We take the security of your personal information seriously and have implemented
additional safeguards to prevent future incidents.

For questions, contact: [security@your-domain.com]

Sincerely,
[Your Company Name] Security Team
```

**To Information Regulator** (within 72 hours):
```
To: complaints.IR@justice.gov.za

Security Breach Notification

Organisation: [Your Company Name]
Registration: [Company registration number]
Contact: [Data Protection Officer name/email]

Breach Details:
- Date Discovered: [Date]
- Date Occurred: [Date]
- Nature: [Description]
- Data Categories Affected: [List]
- Number of Affected Individuals: [Count]
- Mitigation Steps Taken: [List]
- User Notification: [Date/method]

[Detailed breach report attached]
```

---

## Regular Maintenance

### Daily Tasks

- [ ] Monitor Vercel deployment logs for errors
- [ ] Check Upstash Redis dashboard (latency, commands, errors)
- [ ] Review failed login attempts (identify brute force patterns)
- [ ] Verify scheduled tasks executed (if any)

**Monitoring Commands**:
```bash
# View recent Vercel logs
vercel logs --follow

# Check Upstash Redis (via CLI)
redis-cli -u $UPSTASH_REDIS_REST_URL ping
```

### Weekly Tasks

- [ ] Review `LoginAttempt` table size
  ```sql
  SELECT COUNT(*) FROM "LoginAttempt";
  -- If > 10,000, consider cleanup
  ```

- [ ] Review audit log volume
  ```sql
  SELECT COUNT(*) FROM "AuditLog" WHERE "createdAt" > NOW() - INTERVAL '7 days';
  ```

- [ ] Check database performance (slow queries)
- [ ] Verify backup integrity (restore test)
- [ ] Review rate limit effectiveness (blocked requests)

### Monthly Tasks

- [ ] **Dependency Updates**:
  ```bash
  npm outdated
  npm audit
  npm update
  ```

- [ ] **Security Review**:
  - Review OWASP Top 10 compliance
  - Test security headers still present
  - Verify rate limiting configuration current
  - Review POPIA compliance checklist

- [ ] **Credential Rotation** (recommended, not required):
  - Rotate `NEXTAUTH_SECRET` (forces all users to re-login)
  - Rotate API keys (SendGrid, Twilio, etc.)
  - Update OAuth credentials if needed

- [ ] **Log Cleanup**:
  ```sql
  -- Archive/delete old login attempts (>90 days)
  DELETE FROM "LoginAttempt" WHERE "createdAt" < NOW() - INTERVAL '90 days';

  -- Archive old audit logs (>1 year)
  -- Keep for compliance, consider moving to cold storage
  ```

### Quarterly Tasks

- [ ] **Security Audit**:
  - Full penetration testing (if resources allow)
  - Third-party security assessment
  - POPIA compliance review
  - Backup/restore drill

- [ ] **Performance Review**:
  - Database query optimization
  - Rate limit tuning based on actual usage
  - Upstash Redis usage patterns

- [ ] **Documentation Update**:
  - Update this security checklist
  - Review incident response procedures
  - Update deployment documentation

---

## Additional Resources

### Security Standards

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

### POPIA Compliance

- [POPIA Official Site](https://popia.co.za/)
- [Information Regulator](https://inforegulator.org.za/)
- [POPIA Code of Conduct](https://inforegulator.org.za/codes-of-conduct/)

### Technical Documentation

- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [Upstash Redis Security](https://docs.upstash.com/redis/security)
- [Vercel Security](https://vercel.com/docs/security)

### Internal Documentation

- 📄 **Deployment Guide**: `/docs/deployment/VERCEL-DEPLOYMENT.md`
- 📄 **Redis Setup**: `/docs/deployment/UPSTASH-REDIS-SETUP.md`
- 📄 **Logging Guide**: `/docs/compliance/LOGGING.md`
- 📄 **Timezone Guidelines**: `/docs/compliance/TIMEZONE-GUIDELINES.md`
- 📄 **Type Safety**: `/docs/compliance/TYPE-SAFETY.md`

---

## Document Metadata

**Document Version**: 2.0
**Last Updated**: 2025-11-03
**Replaces**: `DEPLOYMENT.md` (merged platform-agnostic security content)
**Maintained By**: Security Team & Development Team
**Review Frequency**: Quarterly

---

## Changelog

### Version 2.0 (2025-11-03)
- Renamed from `DEPLOYMENT.md` to `SECURITY-CHECKLIST.md`
- Removed platform-specific deployment instructions (moved to VERCEL-DEPLOYMENT.md)
- Expanded POPIA compliance sections (Sections 19, 22, 8, 18)
- Added comprehensive security testing procedures
- Enhanced incident response procedures with breach notification templates
- Added regular maintenance schedule
- Improved structure with clear checklist format

### Version 1.0 (Sprint 3)
- Initial version as `DEPLOYMENT.md`
- Combined security and deployment procedures
