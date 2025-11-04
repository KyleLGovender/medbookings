# Security Checklist for Production Deployment

**Last Updated:** 2025-11-03
**Status:** Active
**Severity:** CRITICAL

## Overview

This checklist MUST be completed before deploying to production and reviewed regularly thereafter. Use this as a gate for all production deployments.

---

## Pre-Deployment Security Checklist

### 1. Credential Security

- [ ] **ALL credentials stored in secure vault** (Vercel Environment Variables, not in code)
- [ ] **`.env` file is in `.gitignore`** and NEVER committed
- [ ] **No credentials in git history** (run: `git log --all --full-history -- .env`)
- [ ] **NEXTAUTH_SECRET is strong** (minimum 32 characters, generated with `openssl rand -base64 32`)
- [ ] **Different credentials for each environment** (dev, staging, production)
- [ ] **All API keys rotated in last 90 days** (document in `/docs/deployment/CREDENTIAL-ROTATION.md`)
- [ ] **Team members use credential managers** (1Password, LastPass, not plain text)

**Related Documentation:**
- `/docs/deployment/CREDENTIAL-ROTATION.md`
- `/docs/deployment/VERCEL-DEPLOYMENT.md` (lines 370-394)

---

### 2. Rate Limiting (CRITICAL)

- [ ] **Upstash Redis configured** (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set)
- [ ] **Rate limits defined for all critical endpoints:**
  - [ ] Authentication: 5 attempts per 15 minutes
  - [ ] File uploads: 10 per hour
  - [ ] Email verification: 5 per hour
  - [ ] General API: 100 per minute
- [ ] **Rate limiting tested** (verify 429 responses after limit exceeded)
- [ ] **Monitoring configured** (Upstash dashboard showing activity)
- [ ] **Fallback behavior documented** (fail-open with logging if Redis unavailable)

**Verification:**
```bash
# Test rate limiting
curl -I https://your-domain.com/api/auth/signin
# Make 6 requests rapidly
# Should return: HTTP 429 Too Many Requests on 6th request

# Check Redis is connected
grep "CRITICAL SECURITY WARNING" vercel-logs.txt
# Should return: 0 results (no warnings about in-memory fallback)
```

**Related Documentation:**
- `/src/lib/rate-limit.ts`
- `/docs/deployment/UPSTASH-REDIS-SETUP.md`

---

### 3. Authentication & Authorization

- [ ] **NextAuth configured with secure session strategy**
- [ ] **Google OAuth credentials valid** (test login flow)
- [ ] **OAuth redirect URIs whitelisted** for production domain
- [ ] **Password hashing uses bcrypt** (NOT SHA-256)
- [ ] **Password migration from SHA-256 complete** (or deadline enforced)
- [ ] **Session timeout enforced** (30 minutes of inactivity per POPIA)
- [ ] **Role-based access control (RBAC) tested**:
  - [ ] Admin routes blocked for non-admin users
  - [ ] Provider routes blocked for non-providers
  - [ ] Email verification required for sensitive operations
- [ ] **Auto-admin promotion audited** (check `ADMIN_EMAILS` env var)

**Verification:**
```bash
# Test authentication
curl https://your-domain.com/dashboard
# Should redirect to: /login (if not authenticated)

# Test RBAC
# Login as USER role → visit /admin
# Should redirect to: /unauthorized

# Test session timeout
# Login → wait 31 minutes → refresh page
# Should redirect to: /login?reason=session_timeout
```

**Related Documentation:**
- `/src/lib/auth.ts`
- `/src/middleware.ts`
- `/docs/compliance/SESSION-MANAGEMENT.md` (to be created)

---

### 4. Database Security

- [ ] **Database uses SSL/TLS** (`?sslmode=require` in DATABASE_URL)
- [ ] **Database credentials strong** (minimum 20 characters)
- [ ] **Database accessible only from Vercel IPs** (if firewall available)
- [ ] **Prisma migrations up to date** (`npx prisma migrate deploy` in build)
- [ ] **All queries use parameterization** (NO raw SQL with user input)
- [ ] **Pagination enforced** (all `findMany()` have `take:` parameter)
- [ ] **Transactions used for multi-table operations**
- [ ] **Database backups configured** (daily minimum)
- [ ] **Foreign key constraints enabled**
- [ ] **Indexes on frequently queried columns**

**Verification:**
```bash
# Check for unbounded queries
grep -r "findMany" src/server/api/routers/*.ts | grep -v "take:"
# Should return: 0 results

# Check for raw SQL vulnerabilities
grep -r "\$queryRaw\|\$executeRaw" src/
# Review each result for parameterization

# Test pagination
# Visit: /admin/providers
# Should load quickly with max 50 results
```

**Related Documentation:**
- `/docs/core/DATABASE-OPERATIONS.md`
- `/prisma/schema.prisma`

---

### 5. POPIA Compliance (PHI Protection)

- [ ] **PHI never logged in plain text** (use `sanitizeEmail()`, `sanitizeName()`, etc.)
- [ ] **Audit logging enabled for:**
  - [ ] PHI access (viewing provider/patient records)
  - [ ] Admin actions (approvals, suspensions)
  - [ ] Authorization failures
  - [ ] Role changes
- [ ] **Timezone handling correct** (UTC in database, SAST for display)
- [ ] **No `new Date()` or `Date.now()` in code** (use `nowUTC()` from `/src/lib/timezone.ts`)
- [ ] **Session timeout enforced** (30 minutes per POPIA Section 19)
- [ ] **Data retention policies documented**
- [ ] **User consent tracking implemented**

**Verification:**
```bash
# Check for PHI in logs
grep -r "console.log" src/ --include="*.ts" --include="*.tsx"
# Should return: 0 results (logger enforced by ESLint)

# Check for unsanitized PHI
grep -r "logger\.(info|warn|error)" src/ | grep -E "(email|phone|name)" | grep -v "sanitize"
# Review each result

# Check for timezone violations
grep -r "new Date()\|Date.now()" src/ --include="*.ts" --include="*.tsx"
# Should return: 0 results (blocked by ESLint)

# Check audit log coverage
SELECT category, COUNT(*) as count
FROM "AuditLog"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY category;
# Should show: AUTHENTICATION, AUTHORIZATION, PHI_ACCESS, ADMIN_ACTION, etc.
```

**Related Documentation:**
- `/docs/compliance/LOGGING.md`
- `/docs/compliance/TIMEZONE-GUIDELINES.md`
- `/src/lib/logger.ts`
- `/src/lib/audit.ts`

---

### 6. Input Validation & Sanitization

- [ ] **ALL tRPC procedures use Zod validation** (`.input(z.object({...}))`)
- [ ] **File upload types restricted** (whitelist: PDF, JPG, PNG only)
- [ ] **File upload size limited** (max 10MB per file)
- [ ] **XSS prevention enabled** (React escapes by default, verify no `dangerouslySetInnerHTML`)
- [ ] **SQL injection prevented** (Prisma uses parameterized queries)
- [ ] **CSRF protection enabled** (NextAuth provides CSRF tokens)
- [ ] **Email validation enforced** (Zod `.email()` validator)
- [ ] **Phone number validation enforced** (E.164 format)

**Verification:**
```bash
# Check all tRPC procedures have validation
grep -r "createTRPCRouter" src/server/api/routers/*.ts -A 10 | grep -v ".input("
# Review results - all procedures should have .input()

# Check for XSS vulnerabilities
grep -r "dangerouslySetInnerHTML" src/
# Should return: 0 results (or reviewed and justified)

# Test file upload restrictions
# Upload .exe file → should reject
# Upload 100MB file → should reject
```

**Related Documentation:**
- `/docs/compliance/TYPE-SAFETY.md`
- `/src/server/api/routers/*`

---

### 7. API Security

- [ ] **CORS configured correctly** (only allow trusted origins)
- [ ] **Rate limiting on all public endpoints**
- [ ] **Authentication required for sensitive endpoints**
- [ ] **Authorization checked before data access**
- [ ] **IDOR prevention** (users can only access their own data)
- [ ] **No sensitive data in public API responses**
- [ ] **Error messages don't leak implementation details**
- [ ] **API versioning strategy defined**

**Verification:**
```bash
# Test IDOR
# Login as User A → try to access User B's data via API
# Example: /api/trpc/profile.get?userId=other-user-id
# Should return: 403 Forbidden or empty result

# Test public endpoints for PHI
curl https://your-domain.com/api/trpc/providers.getApproved
# Should NOT contain: user emails, phone numbers, etc.

# Test error messages
curl https://your-domain.com/api/trpc/nonexistent.procedure
# Should return: Generic error (NOT stack traces or file paths)
```

**Related Documentation:**
- `/src/server/api/trpc.ts`
- `/src/middleware.ts`

---

### 8. HTTPS & Transport Security

- [ ] **SSL certificate active** (https:// only)
- [ ] **HTTP redirects to HTTPS** (Vercel default)
- [ ] **HSTS header set** (Strict-Transport-Security: max-age=63072000)
- [ ] **Secure cookies** (httpOnly, secure, sameSite)
- [ ] **Content Security Policy (CSP) configured**
- [ ] **X-Frame-Options set** (SAMEORIGIN - prevent clickjacking)
- [ ] **X-Content-Type-Options set** (nosniff)

**Verification:**
```bash
# Test SSL
curl -I https://your-domain.com
# Should return: HTTP/2 200 (NOT HTTP/1.1 301)

# Check security headers
curl -I https://your-domain.com | grep -E "Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options"
# Should show all three headers

# Test HTTP redirect
curl -I http://your-domain.com
# Should return: HTTP/1.1 301 → https://your-domain.com
```

**Related Documentation:**
- `/next.config.mjs` (lines 35-57)

---

### 9. Third-Party Service Security

- [ ] **SendGrid API key has minimum permissions** (send only, not full access)
- [ ] **Twilio API key has minimum permissions** (SMS only, not admin)
- [ ] **Google OAuth credentials secured** (client secret never exposed to client)
- [ ] **Google Maps API key restricted** (HTTP referrer restrictions)
- [ ] **Vercel Blob token has appropriate scope** (read/write, not admin)
- [ ] **All third-party webhooks use signature verification**
- [ ] **All third-party API calls use HTTPS**

**Verification:**
```bash
# Check API key permissions
# SendGrid: Settings → API Keys → [your key] → Permissions
# Should show: Mail Send only (NOT Full Access)

# Twilio: Console → API Keys → [your key] → Permissions
# Should show: SMS only

# Google Maps: APIs & Services → Credentials → [your key]
# Should show: HTTP referrers (websites) restriction
```

---

### 10. Monitoring & Incident Response

- [ ] **Error tracking configured** (Sentry or similar)
- [ ] **Uptime monitoring configured** (Better Uptime or similar)
- [ ] **Log aggregation configured** (Vercel logs or external)
- [ ] **Alert thresholds set** (error rate > 5%, response time > 1s)
- [ ] **Incident response plan documented**
- [ ] **Security contact email published** (security@yourdomain.com)
- [ ] **Backup restoration tested** (database backup restore within 1 hour)
- [ ] **Rollback procedure documented** (see below)

**Monitoring Checklist:**
```
- [ ] 500 errors → Alert immediately
- [ ] Rate limit violations → Review daily
- [ ] Authentication failures → Alert after 10 failures/hour
- [ ] Database slow queries → Alert if query > 5s
- [ ] Failed deployments → Alert immediately
```

**Rollback Procedure:**
1. Vercel Dashboard → Project → Deployments
2. Find last successful deployment
3. Click "..." → "Promote to Production"
4. Verify application health
5. Investigate failed deployment cause

---

### 11. Build & Deployment Security

- [ ] **Build passes all checks** (`npm run build` succeeds)
- [ ] **TypeScript compilation clean** (`npx tsc --noEmit` passes)
- [ ] **Linting passes** (`npm run lint` passes)
- [ ] **No high-severity npm vulnerabilities** (`npm audit` shows 0 high/critical)
- [ ] **Dependencies up to date** (no outdated security patches)
- [ ] **Pre-commit hooks configured** (`.husky/pre-commit` active)
- [ ] **CI/CD pipeline tests pass** (GitHub Actions or similar)
- [ ] **Environment variables validated at build time**

**Verification:**
```bash
# Run full verification
npm run build && npx tsc --noEmit && npm run lint && npm audit --audit-level=moderate
# All should pass with 0 errors

# Check for outdated dependencies
npm outdated
# Review and update security-critical packages

# Verify pre-commit hooks
cat .husky/pre-commit
# Should contain: timezone check, type safety check, PHI sanitization check
```

**Related Documentation:**
- `/docs/compliance/COMPLIANCE-SYSTEM.md`
- `/.husky/pre-commit`

---

### 12. Environment-Specific Configuration

**Production:**
- [ ] `NODE_ENV=production` set
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` configured
- [ ] `DATABASE_URL` points to production database
- [ ] All required env vars set (see `.env.example`)
- [ ] Debug logging disabled (`DEBUG_*` env vars not set)

**Staging:**
- [ ] Separate database from production
- [ ] Separate Redis instance (or shared with rate limit prefix)
- [ ] Same API keys as production (for realistic testing)
- [ ] `NEXTAUTH_URL` set to staging domain

**Development:**
- [ ] Uses `.env.local` (NOT `.env`)
- [ ] Different credentials from production
- [ ] In-memory rate limiting acceptable
- [ ] Debug logging enabled for troubleshooting

---

## Post-Deployment Verification

After deploying to production, verify:

### Immediate (Within 5 Minutes)

- [ ] Homepage loads successfully
- [ ] No console errors in browser
- [ ] SSL certificate active (https://)
- [ ] Authentication works (Google OAuth login)
- [ ] Rate limiting active (check Upstash dashboard)

### Short-term (Within 1 Hour)

- [ ] Create test booking
- [ ] Upload test file
- [ ] Send test email
- [ ] Check error logs (should be minimal)
- [ ] Verify database queries performing well (<100ms avg)

### Medium-term (Within 24 Hours)

- [ ] Monitor error rates (should be <1%)
- [ ] Check rate limit violations
- [ ] Review audit logs
- [ ] Verify backups ran successfully
- [ ] Check uptime monitoring (should be 100%)

---

## Ongoing Security Maintenance

### Daily

- [ ] Review error logs for anomalies
- [ ] Check rate limit violations
- [ ] Monitor authentication failures

### Weekly

- [ ] Review audit logs for suspicious activity
- [ ] Check for new npm security advisories
- [ ] Review uptime monitoring reports

### Monthly

- [ ] Test backup restoration procedure
- [ ] Review and update access control (remove ex-employees)
- [ ] Check for outdated dependencies
- [ ] Review rate limit thresholds (adjust if needed)

### Quarterly (Every 90 Days)

- [ ] Rotate ALL credentials (see `/docs/deployment/CREDENTIAL-ROTATION.md`)
- [ ] Security audit (review this checklist)
- [ ] Penetration testing (if budget allows)
- [ ] Update security documentation
- [ ] Review and update incident response plan

---

## Security Incident Response

If you discover a security issue:

### Immediate Actions (Within 15 Minutes)

1. **Assess severity:**
   - CRITICAL: Active exploit, data breach, credential exposure
   - HIGH: Vulnerability discovered, no active exploit yet
   - MEDIUM: Potential issue, no immediate risk

2. **Contain the issue:**
   - CRITICAL: Rotate exposed credentials immediately, take system offline if needed
   - HIGH: Deploy fix within 1 hour
   - MEDIUM: Schedule fix within 24 hours

3. **Document:**
   - What happened
   - When discovered
   - What data/systems affected
   - Actions taken

### Short-term (Within 1 Hour)

1. **Notify stakeholders:**
   - Technical team
   - Management
   - Affected users (if data breach)

2. **Deploy fix:**
   - Test fix locally
   - Deploy to staging
   - Deploy to production
   - Verify fix effective

3. **Verify containment:**
   - Check logs for continued exploitation
   - Monitor error rates
   - Review audit trail

### Medium-term (Within 24 Hours)

1. **Post-mortem:**
   - Root cause analysis
   - Timeline of events
   - Lessons learned

2. **Prevent recurrence:**
   - Add automated checks
   - Update security checklist
   - Train team on issue

3. **Compliance reporting:**
   - POPIA breach notification (if applicable)
   - Update security documentation

---

## Security Contacts

**Internal:**
- Security Lead: [To be assigned]
- DevOps Lead: [To be assigned]
- Legal/Compliance: [To be assigned]

**External:**
- Vercel Support: support@vercel.com
- Database Provider: [Based on your choice]
- Penetration Testing: [If contracted]

**Vulnerability Disclosure:**
- Email: security@yourdomain.com
- PGP Key: [If available]

---

## Related Documentation

- [Credential Rotation Guide](/docs/deployment/CREDENTIAL-ROTATION.md)
- [Vercel Deployment Guide](/docs/deployment/VERCEL-DEPLOYMENT.md)
- [Upstash Redis Setup](/docs/deployment/UPSTASH-REDIS-SETUP.md)
- [CLAUDE.md Compliance System](/docs/compliance/COMPLIANCE-SYSTEM.md)
- [Logging Guidelines](/docs/compliance/LOGGING.md)
- [Timezone Guidelines](/docs/compliance/TIMEZONE-GUIDELINES.md)
- [Type Safety Guidelines](/docs/compliance/TYPE-SAFETY.md)

---

**Document Version:** 1.0
**Last Security Audit:** 2025-11-03
**Next Audit Due:** 2026-02-03 (90 days)
**Maintained By:** DevOps/Security Team
