# Upstash Redis Setup Guide

**Purpose:** Configure Upstash Redis for production rate limiting to prevent API abuse across multiple serverless instances.

**Criticality:** 🔴 **REQUIRED FOR PRODUCTION** - Without Redis, rate limiting will fail in multi-instance deployments (Vercel serverless functions).

---

## Table of Contents

1. [Why Upstash Redis?](#why-upstash-redis)
2. [Quick Start (5 minutes)](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Vercel Configuration](#vercel-configuration)
5. [Verification](#verification)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Cost & Limits](#cost--limits)

---

## Why Upstash Redis?

### The Problem
Without Redis, the application uses **in-memory rate limiting** which:
- ❌ Only works on a single server instance
- ❌ Can be bypassed in Vercel's multi-instance serverless environment
- ❌ Fails closed in production (denies all requests) for security

### The Solution
Upstash Redis provides:
- ✅ Distributed rate limiting across all serverless instances
- ✅ Persistent rate limit counters
- ✅ HTTP REST API (works with serverless)
- ✅ Global edge network (low latency)
- ✅ Generous free tier (10,000 commands/day)

### Current Implementation
Rate limiting is applied to:
- 🔒 **tRPC API:** 100 requests/minute per IP
- 🔒 **Auth endpoints:** 5 attempts/15 minutes
- 🔒 **File uploads:** 10 uploads/hour
- 🔒 **Email verification:** 5 emails/hour

**Code:** `/src/lib/rate-limit.ts`, `/src/app/api/trpc/[trpc]/route.ts`

---

## Quick Start

### 1. Create Upstash Account (2 minutes)

1. Go to: https://console.upstash.com/
2. Click **"Sign Up"**
3. Choose **GitHub** or **Google** login (fastest)
4. Verify your email

### 2. Create Redis Database (3 minutes)

1. Click **"Create Database"** button
2. Configure:
   - **Name:** `medbookings-rate-limit-prod`
   - **Type:** ⚡ **Regional** (not Global)
   - **Region:** Choose closest to your users:
     ```
     South Africa users → AWS ap-southeast-1 (Singapore)
     Europe users       → AWS eu-west-1 (Ireland)
     US users           → AWS us-east-1 (N. Virginia)
     ```
   - **TLS:** ✅ Enabled (default - keep it)
   - **Eviction:** `allkeys-lru` (default - good for rate limiting)

3. Click **"Create"**

### 3. Copy Credentials

After creation, you'll see your credentials:

```
REST API URL:
https://xxxxx-xxxxx-xxxxx.upstash.io

REST API Token:
AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ==
```

**⚠️ KEEP THIS TAB OPEN** - You'll need these values in the next step.

---

## Detailed Setup

### Step 1: Create Production Database

**Recommended Settings:**

| Setting | Value | Reason |
|---------|-------|--------|
| **Name** | `medbookings-rate-limit-prod` | Clear identification |
| **Type** | Regional | Lower latency, cheaper |
| **Region** | Closest to users | <50ms latency target |
| **TLS** | Enabled | Security (required) |
| **Eviction** | `allkeys-lru` | Auto-removes old keys |
| **Max Database Size** | 256MB (free tier) | Sufficient for rate limiting |

**Region Selection Guide:**

```
South African Users:
├─ Primary: AWS ap-southeast-1 (Singapore) ~160ms
└─ Backup: AWS eu-west-1 (Ireland) ~180ms

European Users:
├─ Primary: AWS eu-west-1 (Ireland) ~20ms
└─ Backup: AWS eu-central-1 (Frankfurt) ~25ms

US Users:
├─ Primary: AWS us-east-1 (N. Virginia) ~10ms
└─ Backup: AWS us-west-1 (N. California) ~15ms
```

### Step 2: Configure Connection

**Upstash Dashboard → Your Database → Details**

Copy these values:

1. **REST API URL:**
   ```
   https://ruling-coyote-12345.upstash.io
   ```

2. **REST API Token:**
   ```
   AYRlZDAwMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYg==
   ```

**Security Notes:**
- ✅ REST API is specifically designed for serverless
- ✅ Token includes authentication - no additional setup needed
- ✅ TLS encryption by default
- ✅ IP allowlist not needed (token auth sufficient)

---

## Vercel Configuration

### Option A: Via Vercel Dashboard (Recommended)

1. **Navigate:**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Click **Settings** → **Environment Variables**

2. **Add UPSTASH_REDIS_REST_URL:**
   - Click **"Add New"**
   - **Name:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://ruling-coyote-12345.upstash.io`
   - **Environment:** ✅ Production
   - Click **"Save"**

3. **Add UPSTASH_REDIS_REST_TOKEN:**
   - Click **"Add New"**
   - **Name:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** `AYRlZDAwMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYg==`
   - **Environment:** ✅ Production
   - Click **"Save"**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Link to your project
vercel link

# Add environment variables
vercel env add UPSTASH_REDIS_REST_URL production
# Paste: https://ruling-coyote-12345.upstash.io

vercel env add UPSTASH_REDIS_REST_TOKEN production
# Paste: AYRlZDAwMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYg==
```

### Optional: Add to Preview Environment

For testing rate limiting in preview deployments:

1. Repeat the above steps
2. Check **"Preview"** environment instead of/in addition to Production

**OR** create a separate staging database:
- Name: `medbookings-rate-limit-staging`
- Use different credentials for Preview environment

---

## Verification

### Step 1: Deploy with Redis Configuration

**Trigger Deployment:**

```bash
# Option 1: Empty commit (if no code changes)
git commit --allow-empty -m "chore: configure Upstash Redis for rate limiting"
git push origin master

# Option 2: Manual deployment via Vercel Dashboard
# Dashboard → Deployments → "Redeploy"
```

### Step 2: Check Deployment Logs

**Vercel Dashboard → Your Deployment → View Logs**

✅ **Good - You should NOT see this:**
```
❌ CRITICAL: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required
```

✅ **Good - You should see normal startup:**
```
✓ Compiled successfully
✓ Ready in 2.3s
```

### Step 3: Test Rate Limiting

**Test from your terminal:**

```bash
# Replace with your actual domain
DOMAIN="https://your-app.vercel.app"

# Make 101 requests (limit is 100/min)
for i in {1..101}; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/api/trpc/providers.getAll")
  echo "Request $i: HTTP $RESPONSE"

  # Small delay to simulate real traffic
  sleep 0.1
done
```

**Expected Results:**
```
Request 1-100: HTTP 200
Request 101: HTTP 429  ← Rate limit triggered!
```

### Step 4: Verify in Upstash Dashboard

1. **Upstash Console → Your Database → Data Browser**
2. You should see keys like:
   ```
   ratelimit:api:ip:123.45.67.89
   ratelimit:auth:ip:123.45.67.89
   ```

3. **Analytics Tab:**
   - Commands executed: >0
   - Latency: <50ms (regional)
   - Error rate: 0%

---

## Monitoring

### Upstash Dashboard

**Metrics to Monitor:**

1. **Commands (Daily):**
   - Dashboard → Your Database → Analytics
   - Should see ~2,000-5,000 commands/day in normal usage
   - Alert threshold: 8,000 commands/day (80% of free tier)

2. **Latency:**
   - Target: <50ms for regional setup
   - If >100ms: Consider region change or investigate network issues

3. **Error Rate:**
   - Should be 0% under normal operation
   - If >0.1%: Check Vercel logs for connection issues

### Set Up Alerts

**Upstash Dashboard → Your Database → Settings → Webhooks**

1. Click **"Create Webhook"**
2. Configure:
   - **Trigger:** Daily usage exceeds 8,000 commands
   - **Endpoint:** Your monitoring service (e.g., Slack webhook)
   - **Method:** POST

**Example Slack Webhook:**
```json
{
  "text": "⚠️ Upstash Redis: Daily usage exceeds 80% (8,000/10,000 commands)"
}
```

### Vercel Monitoring

**Check Rate Limit Effectiveness:**

```bash
# View real-time logs
vercel logs --follow

# Look for rate limit events:
# "Rate limit exceeded for tRPC request"
```

---

## Troubleshooting

### Issue 1: "Connection timeout" in Vercel logs

**Symptoms:**
```
Error: Request to Upstash timed out after 5000ms
```

**Causes:**
1. Wrong region (high latency)
2. Network issue between Vercel and Upstash
3. Upstash outage (rare)

**Solutions:**
1. **Check region:**
   ```
   Vercel function region: AWS us-east-1
   Upstash Redis region: AWS us-east-1 ✅ (should match)
   ```

2. **Test connection manually:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        "https://your-redis.upstash.io/get/test-key"
   ```

3. **Check Upstash status:** https://status.upstash.com/

---

### Issue 2: Rate limit still returns 429 for legitimate users

**Symptoms:**
```
User reports: "I can't access the site, getting 'Too Many Requests'"
```

**Causes:**
1. Rate limit too strict
2. Multiple users behind same IP (NAT)
3. Bot/crawler hitting your site

**Solutions:**

1. **Check current limits:**
   ```typescript
   // src/lib/rate-limit.ts:89-96
   export const apiRateLimit = redis
     ? new Ratelimit({
         redis,
         limiter: Ratelimit.slidingWindow(100, '1 m'), // Current: 100/min
         // ...
       })
   ```

2. **Increase limit for authenticated users:**
   ```typescript
   // In src/app/api/trpc/[trpc]/route.ts
   const identifier = ctx.session?.user
     ? `user:${ctx.session.user.id}`  // Authenticated
     : getRateLimitIdentifier(req);    // Anonymous (IP-based)

   // Use different limits
   const rateLimitResult = ctx.session?.user
     ? await authenticatedRateLimit.limit(identifier)  // Higher limit
     : await anonymousRateLimit.limit(identifier);      // Lower limit
   ```

3. **Check Upstash logs:**
   - Upstash Console → Logs
   - Look for unusual patterns

---

### Issue 3: High command usage (approaching 10,000/day limit)

**Symptoms:**
```
Upstash alert: "Daily usage: 9,500/10,000 commands"
```

**Analysis:**

Normal usage breakdown:
```
Expected Daily Commands:
├─ API requests: 2,000 (100 users × 20 req/user)
├─ Auth checks: 500
├─ Upload limits: 50
└─ Email limits: 50
───────────────
Total: ~2,600 commands/day
```

If you're exceeding this:

1. **Check for loops/bugs:**
   ```bash
   # View top keys by access count
   # Upstash Console → Data Browser → Sort by Access Count

   # If you see same key accessed 1000s of times:
   # This indicates a bug in your code (infinite retry loop, etc.)
   ```

2. **Identify source:**
   ```bash
   # Check Vercel logs for unusual patterns
   vercel logs | grep "Rate limit" | head -50
   ```

3. **Temporary fix - Upgrade to Pro tier:**
   - Upstash Console → Your Database → Pricing
   - Pro: $0.2 per 100K commands (~$6/month for 3M commands)

---

### Issue 4: Redis not initialized error

**Symptoms:**
```
Error: Redis is undefined
```

**Cause:** Environment variables not set in current environment

**Check:**
```bash
# Verify env vars are set
vercel env ls

# Should show:
# UPSTASH_REDIS_REST_URL    production ✓
# UPSTASH_REDIS_REST_TOKEN  production ✓
```

**Fix:**
```bash
# If missing, add them
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# Redeploy
vercel --prod
```

---

## Cost & Limits

### Free Tier (Default)

**Included:**
- ✅ **10,000 commands/day** (~300K/month)
- ✅ **256 MB storage**
- ✅ **1 GB bandwidth/month**
- ✅ **100 concurrent connections**
- ✅ **Regional replication**
- ✅ **99.9% SLA**

**Usage Estimate for MedBookings:**
```
Expected Traffic: ~100 users/day
├─ API requests: 2,000 commands
├─ Auth checks: 500 commands
├─ Uploads: 50 commands
└─ Emails: 50 commands
─────────────────
Total: ~2,600 commands/day (26% of free tier)
```

**Verdict:** ✅ **Free tier is sufficient** for initial production deployment

---

### Pro Tier ($10/month base + usage)

**When to upgrade:**
- ⚠️ Exceeding 8,000 commands/day consistently
- ⚠️ Need more than 256MB storage
- ⚠️ Require global replication
- ⚠️ Need priority support

**Pro Pricing:**
- $10/month base
- $0.2 per 100,000 commands
- 1 GB storage included (more available)

**Example Cost Calculation:**
```
Scenario: 50,000 commands/day (1.5M/month)

Base fee: $10
Commands: 1.5M × ($0.2 / 100K) = $3
─────────────
Total: $13/month
```

---

### Enterprise Tier (Custom)

For >100M commands/month or special requirements:
- Contact: https://upstash.com/pricing

---

## Best Practices

### Security

1. ✅ **Never commit Redis credentials to git**
   ```bash
   # These should ONLY be in:
   # - Vercel environment variables (production)
   # - .env.local (development, gitignored)
   ```

2. ✅ **Rotate credentials annually**
   ```
   Upstash Console → Your Database → Settings → Rotate Token
   ```

3. ✅ **Use separate databases for staging/production**
   ```
   medbookings-rate-limit-prod     → Production
   medbookings-rate-limit-staging  → Preview/Staging
   ```

### Performance

1. ✅ **Choose region close to your users**
   - <50ms latency = good
   - >100ms latency = review region choice

2. ✅ **Use appropriate eviction policy**
   - `allkeys-lru` = automatically removes old rate limit keys (recommended)
   - Don't use `noeviction` for rate limiting

3. ✅ **Monitor command usage**
   - Set up alerts at 80% of daily limit
   - Review usage patterns monthly

### Maintenance

1. ✅ **Check Upstash status page:** https://status.upstash.com/
2. ✅ **Review analytics monthly** for unusual patterns
3. ✅ **Test rate limiting** after major deployments

---

## Additional Resources

- **Upstash Docs:** https://docs.upstash.com/redis
- **Upstash Console:** https://console.upstash.com/
- **Rate Limiting Guide:** https://upstash.com/docs/redis/features/ratelimiting
- **Vercel Integration:** https://vercel.com/integrations/upstash

---

## Support

**Upstash Support:**
- Discord: https://discord.gg/upstash
- Email: support@upstash.com
- GitHub Issues: https://github.com/upstash/upstash-redis

**MedBookings Codebase:**
- Rate limit implementation: `/src/lib/rate-limit.ts`
- tRPC integration: `/src/app/api/trpc/[trpc]/route.ts`
- Environment validation: `/src/config/env/server.ts`

---

**Last Updated:** 2025-11-03
**Version:** 1.0
**Author:** MedBookings Development Team
