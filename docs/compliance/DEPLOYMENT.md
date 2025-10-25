# Production Deployment Guide

This guide covers deploying MedBookings to production with all security features enabled.

---

## Prerequisites

- ✅ AWS account with Amplify access
- ✅ AWS RDS PostgreSQL database (production-ready)
- ✅ AWS S3 bucket for file storage
- ✅ Upstash Redis account (for rate limiting)
- ✅ Google OAuth credentials (production)
- ✅ SendGrid account (email)
- ✅ Twilio account (SMS/WhatsApp)

---

## Environment Variables

### Required Environment Variables

Create a `.env.production` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Authentication
AUTH_SECRET="your-super-secret-auth-key-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Rate Limiting (REQUIRED for production)
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# AWS S3 File Storage
S3_BUCKET_NAME="your-s3-bucket-name"
S3_REGION="eu-west-1"
# AWS credentials are automatically provided by IAM role in AWS Amplify
# For local development only:
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"

# Email (SendGrid)
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="noreply@your-domain.com"

# SMS/WhatsApp (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WHATSAPP_NUMBER="whatsapp:+1234567890"

# Optional: Admin emails (comma-separated)
ADMIN_EMAILS="admin@example.com,admin2@example.com"
```

---

## Upstash Redis Setup (CRITICAL for Production)

Rate limiting requires Upstash Redis in production. Without it, the system falls back to in-memory rate limiting which **does NOT work** across multiple serverless function instances.

### Step 1: Create Upstash Account

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up for a free account
3. Create a new Redis database

### Step 2: Get Credentials

1. In Upstash dashboard, select your database
2. Go to "REST API" section
3. Copy the following values:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Step 3: Add to Environment Variables

Add both values to your production environment variables in AWS Amplify:

```bash
# In AWS Amplify Console → Environment variables:
Settings → Environment Variables → Add

UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Step 4: Verify Rate Limiting Works

After deployment, test rate limiting:

```bash
# Test registration rate limit (should fail on 6th attempt)
for i in {1..6}; do
  curl -X POST https://your-domain.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@example.com","password":"Test123!@#"}'
done
```

Expected: 6th request returns HTTP 429 (Too Many Requests)

---

## Database Migration

### Step 1: Run Migrations

```bash
# Production database migration
npx prisma migrate deploy
```

This will:
- Apply all pending migrations
- Create the `LoginAttempt` table
- Add `accountLockedUntil` to `User` table
- Create performance indexes

### Step 2: Verify Database Integrity

```bash
# Check database schema
npx prisma db pull

# Verify tables exist
npx prisma studio
```

Expected tables:
- ✅ `LoginAttempt` (new in Sprint 2)
- ✅ `User` with `accountLockedUntil` field (new in Sprint 2)
- ✅ All other existing tables

---

## Security Checklist

### Pre-Deployment Security Verification

- [ ] ✅ Password complexity enforced (8+ chars, uppercase, lowercase, number, special)
- [ ] ✅ Session timeout configured (30 minutes)
- [ ] ✅ Account lockout enabled (5 attempts, 15 min)
- [ ] ✅ Rate limiting configured (auth, upload, email)
- [ ] ✅ Security headers enabled (HSTS, CSP, X-Frame-Options)
- [ ] ✅ HTTPS enforced (via HSTS header)
- [ ] ✅ File upload validation (size, type, auth)
- [ ] ✅ CSRF protection enabled (NextAuth)
- [ ] ✅ SQL injection protection (Prisma)
- [ ] ✅ XSS protection (React + sanitization)

### Environment Variable Security

- [ ] ✅ `AUTH_SECRET` is strong (min 32 characters, random)
- [ ] ✅ Database credentials are secure
- [ ] ✅ API keys are production keys (not test/development)
- [ ] ✅ No `.env` file committed to git
- [ ] ✅ All sensitive values in AWS Amplify environment variables

### POPIA Compliance Checklist

- [ ] ✅ Session timeout: 30 minutes
- [ ] ✅ Audit logging enabled
- [ ] ✅ PHI sanitization in logs
- [ ] ✅ Account lockout preventing brute force
- [ ] ✅ Rate limiting preventing abuse
- [ ] ✅ File upload authentication required
- [ ] ✅ Email verification enforced
- [ ] ✅ Secure password hashing (bcrypt)

---

## Deployment Steps

### AWS Amplify Deployment

1. **Initial Setup:**
   ```bash
   # Configure AWS CLI (for local development)
   aws configure

   # Verify amplify.yml configuration
   cat amplify.yml
   ```

2. **Deploy via Amplify Console:**
   - Navigate to AWS Amplify Console
   - Connect GitHub repository
   - Select branch (e.g., `master`, `staging`)
   - Configure environment variables (see Environment Variables section above)
   - Amplify auto-detects Next.js and uses `amplify.yml` for build settings

3. **Verify Deployment:**
   ```bash
   curl -I https://your-amplify-domain.amplifyapp.com
   ```

4. **Custom Domain Setup:**
   - Amplify Console → Domain Management
   - Add custom domain (e.g., medbookings.co.za)
   - Configure DNS records as provided by Amplify
   - SSL certificates are automatically provisioned

### Manual Build (for testing)

```bash
# 1. Build the application
npm run build

# 2. Start production server locally
npm run start
```

---

## Post-Deployment Verification

### 1. Security Headers Verification

```bash
# Check security headers are present
curl -I https://your-domain.com

# Expected headers:
# Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Referrer-Policy: origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 2. Rate Limiting Verification

```bash
# Test auth rate limit (5 attempts per 15 min)
# Should return 429 on 6th attempt
for i in {1..6}; do
  curl -X POST https://your-domain.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test$i\",\"email\":\"test$i@example.com\",\"password\":\"Test123!@#\"}"
done
```

### 3. Session Timeout Verification

1. Login to application
2. Wait 30 minutes without activity
3. Attempt to access protected route
4. Expected: Redirect to login page

### 4. Account Lockout Verification

1. Attempt login with wrong password 5 times
2. 6th attempt should return "Account locked" error
3. Wait 15 minutes
4. Login should work again

### 5. Password Complexity Verification

```bash
# Test weak password (should fail)
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password"}'

# Expected: 400 error with password requirements
```

---

## Monitoring & Observability

### Rate Limiting Monitoring

Check Upstash dashboard for:
- Rate limit hits
- Request patterns
- Blocked requests

### Database Monitoring

Monitor the following:
- `LoginAttempt` table growth
- Failed login patterns
- Account lockout frequency

### Application Monitoring

- Session duration metrics
- Authentication failure rates
- Rate limit trigger frequency
- File upload patterns

---

## Rollback Procedure

If issues occur after deployment:

```bash
# 1. Rollback to previous AWS Amplify deployment
# In Amplify Console → Deployment history → Select previous deployment → Redeploy

# 2. If database migration issues, rollback migrations
# (Create backup first!)
npx prisma migrate reset

# 3. Restore from backup
psql -U user -d database < backup.sql
```

---

## Troubleshooting

### Rate Limiting Not Working

**Problem**: Rate limits not triggering
**Cause**: Upstash Redis not configured
**Solution**: Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to environment variables

### Account Lockout Not Working

**Problem**: Users not getting locked out
**Cause**: Database migration not applied
**Solution**: Run `npx prisma migrate deploy`

### Session Timeout Too Short/Long

**Problem**: Sessions expiring too quickly or not at all
**Check**: `src/lib/auth.ts` line 130
**Current**: 30 minutes (POPIA compliant)
**Adjust**: Modify `maxAge: 30 * 60` value

### Password Complexity Errors

**Problem**: Users can't register with valid passwords
**Check**: `src/lib/password-validation.ts`
**Requirements**:
- 8+ characters
- 1+ uppercase
- 1+ lowercase
- 1+ number
- 1+ special character

---

## Security Incident Response

### If Rate Limit Bypass Detected

1. Check Upstash Redis connection
2. Verify rate limit configuration in `src/lib/rate-limit.ts`
3. Review application logs for suspicious patterns
4. Temporarily reduce rate limits if needed

### If Account Takeover Detected

1. Force password reset for affected accounts
2. Invalidate all sessions: Update `AUTH_SECRET` (forces re-login)
3. Review `LoginAttempt` table for patterns
4. Consider reducing `MAX_LOGIN_ATTEMPTS` temporarily

### If DoS Attack Detected

1. Verify rate limiting is active
2. Check Upstash Redis dashboard for blocked requests
3. Review server logs for attack patterns
4. Consider adding IP-based blocking

---

## Performance Optimization

### Database Performance

- ✅ Indexes created for:
  - `LoginAttempt.email + createdAt`
  - `LoginAttempt.userId + createdAt`
  - `LoginAttempt.ipAddress + createdAt`
  - `Booking.slotId` (Sprint 0)
  - `Booking.userId + status` (Sprint 0)

### Rate Limiting Performance

- Uses Upstash Redis (edge-optimized)
- In-memory fallback for development
- Sliding window algorithm for auth (more accurate)
- Fixed window for upload/email (more performant)

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily**:
- Monitor error logs
- Check rate limit metrics
- Review failed login attempts

**Weekly**:
- Review `LoginAttempt` table size
- Clean up old email verification tokens
- Check database performance

**Monthly**:
- Review and rotate `AUTH_SECRET` if needed
- Update dependencies (`npm audit`)
- Review security headers configuration

---

## Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Upstash Documentation](https://docs.upstash.com)
- [POPIA Compliance Guide](https://popia.co.za/)
- [OWASP Security Standards](https://owasp.org/)

---

**Document Version**: 1.0
**Last Updated**: Sprint 3
**Maintained By**: Development Team
