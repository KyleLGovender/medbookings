# Environment Variables Reference

**Purpose**: Complete reference for all environment variables used in MedBookings

**Status**: ✅ Active | **Last Updated**: 2025-11-04

---

## 📋 Table of Contents

1. [Required Variables](#required-variables)
2. [Optional Variables](#optional-variables)
3. [Environment-Specific Values](#environment-specific-values)
4. [Variable Descriptions](#variable-descriptions)
5. [How to Get Credentials](#how-to-get-credentials)
6. [Validation](#validation)

---

## ⚠️ CRITICAL: Security Rules

**DO:**
- ✅ Use `.env.local` for local development (gitignored)
- ✅ Store production secrets ONLY in Vercel Dashboard
- ✅ Use `.env.example` as a template (no secrets)
- ✅ Keep `.env.test` with mock data only

**DON'T:**
- ❌ NEVER commit `.env.local`
- ❌ NEVER create/commit `.env` with real secrets
- ❌ NEVER commit `.env.production`
- ❌ NEVER share secrets via Slack/email
- ❌ NEVER use production secrets in local development

---

## Required Variables

These variables **MUST** be set for the application to function:

### Database

```bash
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

**Production**: Neon PostgreSQL connection string
**Local**: `postgresql://postgres:postgres@localhost:5433/medbookings_dev`
**Get from**: Neon Dashboard (production) or Docker (local)

---

### Authentication

```bash
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="minimum-32-character-random-string"
```

**NEXTAUTH_URL**:
- Production: `https://medbookings.co.za`
- Staging: `https://staging.medbookings.co.za`
- Local: `http://localhost:3000`

**NEXTAUTH_SECRET**:
- Generate with: `openssl rand -base64 32`
- **CRITICAL**: Must be unique per environment
- Minimum 32 characters required

---

### Google OAuth

```bash
GOOGLE_CLIENT_ID="xxxxxxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Setup**: https://console.cloud.google.com/apis/credentials

**Authorized Redirect URIs** (must be configured):
- `http://localhost:3000/api/auth/callback/google` (local)
- `https://staging.medbookings.co.za/api/auth/callback/google` (staging)
- `https://medbookings.co.za/api/auth/callback/google` (production)
- `https://www.medbookings.co.za/api/auth/callback/google` (production with www)

**Get from**: Google Cloud Console → APIs & Services → Credentials

---

### File Storage (Vercel Blob)

```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxx"
```

**Setup**: Vercel Dashboard → Project → Storage → Create Blob Store
**Auto-generated**: Vercel creates this when you enable Blob Storage
**Get from**: Vercel Dashboard → Environment Variables

---

### Email (SendGrid)

```bash
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
```

**Setup**: https://app.sendgrid.com/settings/api_keys
**Domain Verification**: https://app.sendgrid.com/settings/sender_auth

**Local Development**: Can use test email like `noreply@localhost` with mock mode
**Production**: Must use verified domain email

**Get from**: SendGrid Dashboard → API Keys

---

### SMS/WhatsApp (Twilio)

```bash
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+27xxxxxxxxx"
TWILIO_WHATSAPP_NUMBER="whatsapp:+27xxxxxxxxx"
```

**Setup**: https://console.twilio.com/
**Get from**: Twilio Console → Account Info

**Note**: WhatsApp requires separate setup and approval

---

### Admin Configuration

```bash
ADMIN_EMAILS="admin@yourdomain.com,admin2@yourdomain.com"
ADMIN_NOTIFICATION_EMAIL="admin@yourdomain.com"
```

**Purpose**:
- `ADMIN_EMAILS`: Comma-separated list of users with admin access
- `ADMIN_NOTIFICATION_EMAIL`: Where system notifications are sent

**Format**: Must be valid email addresses, comma-separated for multiple

---

## Optional Variables

These variables are optional but recommended for production:

### Rate Limiting (Upstash Redis)

```bash
UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Status**:
- **Production**: ✅ **REQUIRED** (fails without it)
- **Local**: ⚠️ Optional (falls back to in-memory with warnings)

**Setup**: https://console.upstash.com/redis
**Guide**: See `/docs/deployment/UPSTASH-REDIS-SETUP.md`

**Why Required for Production**:
- Prevents API abuse
- POPIA compliance requirement
- Distributed rate limiting across serverless functions

---

### Error Tracking (Sentry)

```bash
SENTRY_DSN="https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o000000.ingest.sentry.io/0000000"
NEXT_PUBLIC_SENTRY_DSN="https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o000000.ingest.sentry.io/0000000"
SENTRY_AUTH_TOKEN="sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"
SENTRY_DEBUG="false"
```

**Status**: ⚠️ Optional (Recommended for production)
**Used for**: Error tracking, performance monitoring, and debugging

**Setup**: https://sentry.io/signup/
**Free Tier**: 5,000 errors/month, 10,000 performance transactions/month

**Why Recommended**:
- Real-time error notifications (email, Slack)
- Source-mapped stack traces (even in production)
- Performance monitoring for slow API calls
- User context and breadcrumbs for debugging
- POPIA-compliant (PHI sanitization built-in)

**Configuration**:
- `SENTRY_DSN`: Public DSN (safe to expose client-side)
- `NEXT_PUBLIC_SENTRY_DSN`: Same as SENTRY_DSN (for browser)
- `SENTRY_AUTH_TOKEN`: Used for source map uploads (keep secret)
- `SENTRY_ORG`: Your Sentry organization slug
- `SENTRY_PROJECT`: Your Sentry project slug
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`: Environment name (production/staging/development)
- `SENTRY_DEBUG`: Enable SDK debug logs (false in production)

**Getting Started**:
1. Sign up at https://sentry.io
2. Create a Next.js project
3. Copy DSN from project settings
4. Add variables to Vercel Dashboard
5. Deploy to see errors in Sentry dashboard

**PHI Protection**: Automatic sanitization via `beforeSend` hook (no PHI sent to Sentry)

---

### Additional Services

```bash
FIRECRAWL_API_KEY="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Status**: ⚠️ Optional
**Used for**: Web scraping features (if implemented)

---

## Environment-Specific Values

### Production (`medbookings.co.za`)

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://medbookings.co.za` |
| `DATABASE_URL` | Neon production database |
| `UPSTASH_REDIS_*` | **REQUIRED** |
| `SENDGRID_FROM_EMAIL` | `noreply@medbookings.co.za` |

**All managed in**: Vercel Dashboard → Environment Variables

---

### Staging (`staging.medbookings.co.za`)

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://staging.medbookings.co.za` |
| `DATABASE_URL` | Neon staging database (separate from production) |
| `UPSTASH_REDIS_*` | Recommended (can share with production) |
| `SENDGRID_FROM_EMAIL` | `noreply@staging.medbookings.co.za` |

---

### Local Development (`localhost:3000`)

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/medbookings_dev` |
| `UPSTASH_REDIS_*` | Optional (in-memory fallback) |
| `SENDGRID_FROM_EMAIL` | `noreply@localhost` |

**Stored in**: `.env.local` (gitignored)

---

## Variable Descriptions

### Critical Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `DATABASE_URL` | String (URL) | ✅ YES | PostgreSQL connection string with SSL |
| `NEXTAUTH_SECRET` | String (32+) | ✅ YES | Secret for JWT signing (min 32 chars) |
| `NEXTAUTH_URL` | String (URL) | ✅ YES | Application base URL |
| `GOOGLE_CLIENT_ID` | String | ✅ YES | OAuth client ID from Google Cloud |
| `GOOGLE_CLIENT_SECRET` | String | ✅ YES | OAuth client secret from Google Cloud |
| `BLOB_READ_WRITE_TOKEN` | String | ✅ YES | Vercel Blob Storage token |
| `SENDGRID_API_KEY` | String | ✅ YES | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Email | ✅ YES | Verified sender email address |
| `TWILIO_ACCOUNT_SID` | String | ✅ YES | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | String | ✅ YES | Twilio authentication token |
| `TWILIO_PHONE_NUMBER` | Phone | ✅ YES | Twilio phone number (+27 format) |
| `ADMIN_EMAILS` | CSV | ✅ YES | Admin user email addresses |

### Production-Critical Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | String (URL) | 🔴 PROD ONLY | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | String | 🔴 PROD ONLY | Upstash Redis REST token |

### Optional Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | String | ⚠️ Optional | Google Maps API key |
| `TWILIO_WHATSAPP_NUMBER` | Phone | ⚠️ Optional | WhatsApp business number |
| `ADMIN_NOTIFICATION_EMAIL` | Email | ⚠️ Optional | System notification recipient |
| `FIRECRAWL_API_KEY` | String | ⚠️ Optional | Firecrawl web scraping API key |

---

## How to Get Credentials

### 1. Database (Neon PostgreSQL)

1. Go to: https://console.neon.tech/
2. Create new project: "MedBookings Production"
3. Copy connection string from dashboard
4. Add `?sslmode=require` to the end
5. Store in Vercel Environment Variables

---

### 2. Authentication Secret

```bash
# Generate a secure random string
openssl rand -base64 32

# Example output (use your own!):
# xqkd/nS3EF4dBApVhEcrZqez+E3gQAg4FFpsgI5/2Qw=
```

---

### 3. Google OAuth

1. Go to: https://console.cloud.google.com/
2. Create new project or select existing
3. Enable APIs:
   - Google+ API
   - Google Maps JavaScript API (for maps feature)
4. Create OAuth 2.0 Credentials:
   - Application type: Web application
   - Authorized redirect URIs: Add all environments
5. Copy Client ID and Client Secret

---

### 4. Vercel Blob Storage

1. Open: Vercel Dashboard
2. Select your project
3. Go to: Storage → Create Blob Store
4. Vercel auto-generates `BLOB_READ_WRITE_TOKEN`
5. Copy from Environment Variables tab

---

### 5. SendGrid (Email)

1. Go to: https://app.sendgrid.com/
2. Create account (free tier available)
3. Verify domain: Settings → Sender Authentication
4. Create API Key: Settings → API Keys → Create API Key
5. Copy API key (only shown once!)

---

### 6. Twilio (SMS/WhatsApp)

1. Go to: https://console.twilio.com/
2. Create account (free trial available)
3. Get phone number: Phone Numbers → Buy a Number
4. Copy Account SID and Auth Token from Console
5. For WhatsApp: Apply for WhatsApp Business approval

---

### 7. Upstash Redis

See detailed guide: `/docs/deployment/UPSTASH-REDIS-SETUP.md`

**Quick steps**:
1. Go to: https://console.upstash.com/
2. Create Redis database
3. Select region: US East (closest to Vercel)
4. Copy REST URL and REST Token
5. Add to Vercel Environment Variables

---

## Validation

The application validates environment variables at startup using Zod schemas.

**Validation file**: `/src/lib/env-validation.ts`

### Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `DATABASE_URL must be a valid URL` | Invalid connection string format | Check format: `postgresql://user:pass@host:port/db` |
| `NEXTAUTH_SECRET must be at least 32 characters` | Secret too short | Generate new: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID is required` | Missing OAuth credentials | Add Google OAuth credentials |
| `UPSTASH_REDIS_REST_URL is required` | Missing in production | Add Upstash Redis credentials (production only) |
| `SENDGRID_FROM_EMAIL must be a valid email` | Invalid email format | Use format: `noreply@domain.com` |

### Manual Validation

```bash
# Test environment validation locally
npm run build

# Check which variables are loaded (local dev)
echo $DATABASE_URL  # Should show postgresql://...

# Verify Vercel environment (production)
vercel env ls
```

---

## Related Documentation

- [Environment Setup Guide](/docs/setup/ENVIRONMENT-SETUP.md) - Complete setup walkthrough
- [Vercel Deployment Guide](/docs/deployment/VERCEL-DEPLOYMENT.md) - Production deployment
- [Upstash Redis Setup](/docs/deployment/UPSTASH-REDIS-SETUP.md) - Rate limiting configuration
- [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md) - Pre-deployment verification

---

**Last Updated**: 2025-11-04
**Maintained by**: Development Team
