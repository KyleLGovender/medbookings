# Vercel Deployment Guide

This guide covers deploying the MedBookings Next.js application to Vercel with PostgreSQL database and Vercel Blob Storage.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Vercel Blob Storage](#vercel-blob-storage)
7. [Custom Domain Configuration](#custom-domain-configuration)
8. [Security Configuration](#security-configuration)
9. [Deployment Process](#deployment-process)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Troubleshooting](#troubleshooting)

---

## Overview

**Current Deployment Stack:**
- **Hosting**: Vercel (Next.js 14 optimized)
- **Database**: PostgreSQL (Neon, Supabase, or similar)
- **Storage**: Vercel Blob Storage
- **Runtime**: Node.js 20.x
- **Framework**: Next.js 14 App Router with Server-Side Rendering

**Deployment Flow:**
```
GitHub Push → Vercel Build → Prisma Generate → Next.js Build → Deploy
```

---

## Prerequisites

Before deploying, ensure you have:

1. ✅ **Vercel Account** - [Sign up](https://vercel.com/signup) (free tier available)
2. ✅ **GitHub Repository Access** - Fork or clone the medbookings repository
3. ✅ **PostgreSQL Database** - Options:
   - [Neon](https://neon.tech/) (recommended - serverless PostgreSQL)
   - [Supabase](https://supabase.com/) (includes auth and storage)
   - [Railway](https://railway.app/) (simple PostgreSQL hosting)
4. ✅ **Required API Keys**:
   - Google OAuth credentials ([Google Cloud Console](https://console.cloud.google.com/))
   - Google Maps API key
   - SendGrid API key (email)
   - Twilio credentials (SMS/WhatsApp)
5. ✅ **Domain Name** (optional, Vercel provides free .vercel.app subdomain)

---

## Initial Setup

### Step 1: Create PostgreSQL Database

**Using Neon (Recommended):**

1. Go to [Neon Dashboard](https://console.neon.tech/)
2. Click "New Project"
3. Select region closest to your users (e.g., EU West for European users)
4. Copy the connection string: `postgresql://user:pass@host/dbname?sslmode=require`

**Using Supabase:**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Settings → Database → Connection string (Direct connection)
4. Use the Postgres connection string (NOT the pooler URL for Prisma)

### Step 2: Connect Repository to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (keep default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
5. **DO NOT deploy yet** - configure environment variables first

---

## Environment Variables

Configure these in: **Vercel Dashboard → Project → Settings → Environment Variables**

### Required for All Environments

```bash
# ─────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@db-host:5432/dbname?sslmode=require

# ─────────────────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────────────────
AUTH_SECRET=your-secure-random-string-min-32-chars
NEXTAUTH_URL=https://your-domain.vercel.app

# Generate AUTH_SECRET with:
# openssl rand -base64 32

# ─────────────────────────────────────────────────────────
# GOOGLE OAUTH
# ─────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Setup: https://console.cloud.google.com/apis/credentials
# Authorized redirect URIs:
#   - http://localhost:3000/api/auth/callback/google (development)
#   - https://your-domain.vercel.app/api/auth/callback/google (production)

# ─────────────────────────────────────────────────────────
# VERCEL BLOB STORAGE
# ─────────────────────────────────────────────────────────
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx

# Vercel auto-generates this when you enable Blob Storage
# Dashboard → Project → Storage → Create Blob Store

# ─────────────────────────────────────────────────────────
# COMMUNICATIONS - EMAIL (SendGrid)
# ─────────────────────────────────────────────────────────
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Setup: https://app.sendgrid.com/settings/api_keys
# Verify domain: https://app.sendgrid.com/settings/sender_auth

# ─────────────────────────────────────────────────────────
# COMMUNICATIONS - SMS/WhatsApp (Twilio)
# ─────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+27xxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+27xxxxxxxxx

# Setup: https://console.twilio.com/

# ─────────────────────────────────────────────────────────
# ADMIN CONFIGURATION
# ─────────────────────────────────────────────────────────
ADMIN_EMAILS=admin@yourdomain.com,admin2@yourdomain.com
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com

# ─────────────────────────────────────────────────────────
# UPSTASH REDIS (Rate Limiting - CRITICAL FOR PRODUCTION)
# ─────────────────────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# REQUIRED for production rate limiting
# Setup: https://console.upstash.com/redis
# See: /docs/compliance/DEPLOYMENT.md for setup instructions

# ─────────────────────────────────────────────────────────
# OPTIONAL - Additional Services
# ─────────────────────────────────────────────────────────
FIRECRAWL_API_KEY=your-firecrawl-api-key-if-used
```

### Environment-Specific Configuration

**Production:**
- Set all variables for `Production` environment
- `NEXTAUTH_URL` = your production domain
- Enable all rate limiting

**Preview (Staging):**
- Optionally configure separate database
- `NEXTAUTH_URL` = automatic Vercel preview URL
- Can reuse same API keys for testing

**Development:**
- Use `.env.local` file (NOT committed to git)
- `NEXTAUTH_URL=http://localhost:3000`

---

## Database Setup

### Step 1: Run Prisma Migrations

**Local Setup (First Time):**

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run seed:production
```

**Vercel Deployment:**

Migrations run automatically during build via `package.json` build script:
```json
"build": "npx prisma generate && next build"
```

### Step 2: Verify Database Connection

```bash
# Test database connection
npx prisma studio

# View database in browser at http://localhost:5555
```

### Step 3: Database Schema Overview

The application uses these main tables:
- **User** - User accounts (OAuth + NextAuth)
- **Provider** - Healthcare providers
- **Organization** - Medical organizations
- **Service** - Services offered
- **Availability** - Provider availability slots
- **Booking** - Appointment bookings
- **Billing** - Subscription and payment tracking

For detailed schema, see `/prisma/schema.prisma`

---

## Vercel Blob Storage

Vercel Blob is used for file uploads (provider documents, profile images, etc.)

### Setup Blob Storage

1. **Enable Blob Storage:**
   - Go to Vercel Dashboard → Project → Storage
   - Click "Create Blob Store"
   - Name: `medbookings-uploads` (or similar)
   - Region: Same as your database for low latency

2. **Copy Token:**
   - Vercel generates `BLOB_READ_WRITE_TOKEN` automatically
   - Add to environment variables (see above)

3. **Verify Integration:**
   ```bash
   # Check blob.ts implementation
   cat src/lib/storage/blob.ts
   ```

### Blob Storage Usage

```typescript
// Example: Upload file
import { put } from '@vercel/blob';

const blob = await put('file.pdf', file, {
  access: 'public',
  token: process.env.BLOB_READ_WRITE_TOKEN,
});

console.log(blob.url); // https://xxxxx.public.blob.vercel-storage.com/file.pdf
```

**Storage Limits:**
- Free tier: 100GB bandwidth/month
- Pro tier: 1TB bandwidth/month
- See [Vercel Pricing](https://vercel.com/pricing)

---

## Custom Domain Configuration

### Step 1: Add Domain to Vercel

1. **Vercel Dashboard → Project → Settings → Domains**
2. Click "Add Domain"
3. Enter your domain (e.g., `medbookings.co.za`)

### Step 2: Configure DNS Records

**If using Vercel nameservers (recommended):**
1. Vercel provides nameservers (e.g., `ns1.vercel-dns.com`)
2. Update your domain registrar with these nameservers
3. Vercel handles all DNS automatically

**If using external DNS provider:**

Add these records:

| Type  | Name | Value                     | TTL  |
|-------|------|---------------------------|------|
| A     | @    | 76.76.21.21               | 3600 |
| CNAME | www  | cname.vercel-dns.com      | 3600 |

### Step 3: Enable SSL

- ✅ Automatic - Vercel provisions SSL certificates automatically
- ✅ Auto-renewal - No manual intervention required
- ✅ HTTPS redirect - Enabled by default

### Step 4: Update Environment Variables

```bash
# Update NEXTAUTH_URL to custom domain
NEXTAUTH_URL=https://medbookings.co.za
```

### Step 5: Update Google OAuth

Add custom domain to authorized redirect URIs:
- `https://medbookings.co.za/api/auth/callback/google`

---

## Security Configuration

### Required Security Headers

Next.js security headers are configured in `next.config.js`:

```javascript
// Already configured in the codebase
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
    ],
  },
],
```

### Rate Limiting (CRITICAL for Production)

**Upstash Redis Setup:**

1. Create Redis database at [Upstash Console](https://console.upstash.com/redis)
2. Copy REST URL and token
3. Add to environment variables:
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

Rate limiting is configured in:
- `/src/server/api/trpc.ts` - API rate limits
- `/src/middleware.ts` - Route protection

**Limits:**
- Anonymous: 10 requests/minute
- Authenticated: 50 requests/minute

For details, see `/docs/compliance/DEPLOYMENT.md`

### Environment Variable Security

✅ **DO:**
- Store all secrets in Vercel environment variables
- Use different secrets per environment
- Rotate API keys regularly

❌ **DON'T:**
- Commit `.env` files to git
- Use production keys in development
- Share secrets in plain text

### POPIA Compliance (South African Data Protection)

- ✅ PHI sanitization in logs (see `/src/lib/logger.ts`)
- ✅ Audit trail for all data access
- ✅ Timezone handling (UTC storage, SAST display)
- ✅ Session timeout (30 minutes)

For complete compliance requirements, see `/docs/compliance/DEPLOYMENT.md`

---

## Deployment Process

### Automatic Deployment

**Trigger:** Push to `master` branch

```bash
git push origin master
```

**Build Process:**
1. Vercel detects push
2. Installs dependencies (`npm ci`)
3. Generates Prisma Client (`npx prisma generate`)
4. Builds Next.js (`next build`)
5. Deploys to production
6. Invalidates CDN cache

**Duration:** ~2-3 minutes

### Manual Deployment

**Via Vercel Dashboard:**
1. Vercel Dashboard → Project
2. Click "Deploy" button
3. Select branch to deploy

**Via Vercel CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Rollback Procedure

**If deployment fails:**
1. Vercel Dashboard → Project → Deployments
2. Find last successful deployment
3. Click "..." → "Promote to Production"

**Automatic Rollback:**
- Build failures don't affect production
- Previous deployment remains live until new one succeeds

---

## Post-Deployment Verification

### Deployment Checklist

After deploying, verify:

1. ✅ **Application Health:**
   - [ ] Homepage loads: `https://your-domain.com`
   - [ ] Returns HTTP 200
   - [ ] No console errors in browser

2. ✅ **Authentication:**
   - [ ] Google OAuth login works
   - [ ] Session persists after refresh
   - [ ] Logout works correctly

3. ✅ **Database:**
   - [ ] Can query data (check provider list)
   - [ ] Prisma Client generated correctly
   - [ ] Migrations applied successfully

4. ✅ **API Routes:**
   - [ ] tRPC endpoints responding
   - [ ] Rate limiting active
   - [ ] Error handling works

5. ✅ **File Uploads:**
   - [ ] Blob storage accessible
   - [ ] Upload test file
   - [ ] File accessible via URL

6. ✅ **Email/SMS:**
   - [ ] SendGrid sending emails
   - [ ] Twilio sending SMS
   - [ ] WhatsApp notifications working

7. ✅ **Security:**
   - [ ] SSL certificate active (https://)
   - [ ] Security headers present
   - [ ] Rate limiting enforced
   - [ ] CORS configured correctly

### Monitoring

**Vercel Analytics:**
- Dashboard → Project → Analytics
- Page views, response times, errors

**Vercel Logs:**
- Dashboard → Project → Deployments → Select deployment → View Logs
- Real-time function logs
- Build logs

**External Monitoring (Recommended):**
- [Sentry](https://sentry.io/) - Error tracking
- [Better Uptime](https://betteruptime.com/) - Uptime monitoring

---

## Troubleshooting

### Build Failures

**Issue:** Prisma Client generation fails

```
Error: Prisma Client could not be generated
```

**Solution:**
- Check `DATABASE_URL` is set in Vercel environment variables
- Ensure `npx prisma generate` runs before `next build`
- Verify `package.json` build script: `"build": "npx prisma generate && next build"`

---

**Issue:** TypeScript compilation errors

```
Type error: Property 'X' does not exist on type 'Y'
```

**Solution:**
```bash
# Run locally to debug
npx tsc --noEmit

# Fix type errors before pushing
```

---

### Runtime Errors

**Issue:** 500 Internal Server Error

**Causes:**
1. Missing environment variables
2. Database connection failed
3. tRPC procedure error

**Debug:**
```bash
# Check Vercel logs
vercel logs --follow

# Check environment variables
vercel env list
```

---

**Issue:** OAuth callback error

```
OAuth error: redirect_uri_mismatch
```

**Solution:**
- Google Cloud Console → Credentials → OAuth 2.0 Client
- Add authorized redirect URI:
  - `https://your-domain.com/api/auth/callback/google`

---

**Issue:** Database connection timeout

```
Error: Can't reach database server at `host:5432`
```

**Solution:**
- Verify `DATABASE_URL` format includes `?sslmode=require`
- Check database provider dashboard (Neon/Supabase) - database running?
- Test connection locally:
  ```bash
  npx prisma db pull
  ```

---

### Performance Issues

**Issue:** Slow API responses

**Causes:**
1. N+1 database queries
2. No pagination on large datasets
3. Missing indexes

**Solution:**
- Review slow queries with Prisma Studio
- Add `take` parameter to all `findMany` queries
- Check `/docs/guides/DEVELOPER-PRINCIPLES.md` for optimization patterns

---

**Issue:** Function timeout (10s limit)

```
Error: FUNCTION_INVOCATION_TIMEOUT
```

**Solution:**
- Optimize database queries
- Add indexes to frequently queried columns
- Consider moving long-running tasks to background jobs

---

### File Upload Issues

**Issue:** Blob storage upload fails

```
Error: Failed to upload file
```

**Solution:**
- Check `BLOB_READ_WRITE_TOKEN` is set
- Verify Blob Store is created in Vercel Dashboard
- Check file size limits (100MB max)

---

### Rate Limiting Issues

**Issue:** Rate limit 429 errors in production

**Causes:**
1. `UPSTASH_REDIS_REST_URL` not set
2. Redis connection failing
3. Legitimate traffic spike

**Solution:**
- Set up Upstash Redis (see Security Configuration)
- Adjust rate limits in `/src/server/api/trpc.ts`
- Monitor with Upstash dashboard

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)

---

## Support

For deployment issues or questions:
- Check [Issues](https://github.com/KyleLGovender/medbookings/issues)
- Review [CLAUDE.md](/CLAUDE.md) for architecture details
- See [DEPLOYMENT.md](/docs/compliance/DEPLOYMENT.md) for security requirements

---

**Last Updated**: 2025-11-02
**Deployment Platform**: Vercel
**Database**: PostgreSQL (Neon/Supabase)
**Storage**: Vercel Blob Storage
