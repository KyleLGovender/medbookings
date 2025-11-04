# Environment Setup Guide

**Last Updated:** 2025-11-04
**Applies to:** MedBookings v1.0+

---

## 📋 Quick Start

### For New Developers

```bash
# 1. Clone the repository
git clone https://github.com/KyleLGovender/medbookings.git
cd medbookings

# 2. Install dependencies
npm install

# 3. Copy environment template to local file
cp .env.example .env.local

# 4. Fill in your local development values (see below)
# Edit .env.local with your preferred editor

# 5. Start Docker database
docker-compose up -d

# 6. Run database migrations
npx prisma migrate dev

# 7. Start development server
npm run dev
```

---

## 🔐 Security Rules (CRITICAL)

### ⚠️ NEVER COMMIT SECRETS

**DO:**
- ✅ Use `.env.local` for local development secrets
- ✅ Store production secrets ONLY in Vercel Dashboard
- ✅ Use `.env.example` as a template (no secrets)
- ✅ Keep `.env.test` with mock data only

**DON'T:**
- ❌ NEVER commit `.env` with real secrets
- ❌ NEVER commit `.env.local`
- ❌ NEVER commit `.env.production`
- ❌ NEVER share secrets via Slack/email
- ❌ NEVER use production secrets in local development

**Why:** Committed secrets can lead to:
- Complete production compromise
- Unauthorized database access
- API key abuse and charges
- POPIA compliance violations

---

## 📁 Environment File Structure

| File | Purpose | Git Tracked | Contains Secrets |
|------|---------|-------------|------------------|
| `.env.example` | Template for all environments | ✅ YES | ❌ NO |
| `.env.local` | **YOUR LOCAL DEVELOPMENT** | ❌ NO | ✅ YES (local only) |
| `.env.test` | Test configuration | ✅ YES | ❌ NO (mock data) |
| `.env` | ❌ DO NOT USE | ❌ NO | ❌ Should be empty template |
| `.env.production` | ❌ DO NOT CREATE | ❌ NO | N/A |

---

## 🛠️ Local Development Setup

### Step 1: Create `.env.local`

```bash
cp .env.example .env.local
```

### Step 2: Fill in Required Values

Edit `.env.local` with these values:

```env
# ================================
# DATABASE
# ================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/medbookings_dev"

# ================================
# AUTHENTICATION
# ================================
NEXTAUTH_URL="http://localhost:3000"

# Generate your own secret:
# Run: openssl rand -base64 32
NEXTAUTH_SECRET="[paste generated secret here]"

# ================================
# OAUTH (Get from team lead or Google Cloud Console)
# ================================
GOOGLE_CLIENT_ID="[from Google Cloud Console]"
GOOGLE_CLIENT_SECRET="[from Google Cloud Console]"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="[from Google Cloud Console]"

# ================================
# FILE STORAGE (Get from team lead or Vercel)
# ================================
BLOB_READ_WRITE_TOKEN="[from Vercel Dashboard]"

# ================================
# EMAIL (Get from team lead or SendGrid)
# ================================
SENDGRID_API_KEY="[from SendGrid Dashboard]"
SENDGRID_FROM_EMAIL="noreply@localhost"

# ================================
# SMS/WHATSAPP (Get from team lead or Twilio)
# ================================
TWILIO_ACCOUNT_SID="[from Twilio Dashboard]"
TWILIO_AUTH_TOKEN="[from Twilio Dashboard]"
TWILIO_PHONE_NUMBER="+27XXXXXXXXX"
TWILIO_WHATSAPP_NUMBER="+27XXXXXXXXX"

# ================================
# RATE LIMITING (Optional for local dev)
# ================================
# If not set, app will use in-memory rate limiting with warnings
UPSTASH_REDIS_REST_URL="[from Upstash Dashboard - optional]"
UPSTASH_REDIS_REST_TOKEN="[from Upstash Dashboard - optional]"

# ================================
# ADMIN
# ================================
ADMIN_EMAILS="your.email@example.com"
ADMIN_NOTIFICATION_EMAIL="your.email@example.com"
```

### Step 3: Start Local Services

```bash
# Start PostgreSQL database (Docker)
docker-compose up -d

# Verify database is running
docker ps | grep postgres
# Should show: medbookings-db-1 running on port 5433

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Step 4: Verify Setup

```bash
# Check environment validation
npm run build

# Should see no environment validation errors

# Start development server
npm run dev

# Should start on http://localhost:3000
```

---

## 🔑 Getting Credentials

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create or select a project
3. Create OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://medbookings.co.za/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env.local`

### SendGrid Setup

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Create API Key with Mail Send permissions
3. Copy API key to `.env.local`
4. Verify sender email address

### Twilio Setup

1. Go to [Twilio Console](https://console.twilio.com/)
2. Get Account SID and Auth Token
3. Get phone number from Twilio
4. Copy credentials to `.env.local`

### Upstash Redis (Optional for Development)

1. Go to [Upstash Console](https://console.upstash.com/redis)
2. Create new Redis database
3. Copy REST URL and Token to `.env.local`
4. **Note:** Not required for local development - app will fall back to in-memory rate limiting

---

## 🚀 Production Environment

### Production Secrets Management

**ALL production secrets are stored ONLY in Vercel Dashboard**

### Adding/Updating Production Variables

```bash
# Add a new environment variable
vercel env add VARIABLE_NAME

# Remove an environment variable
vercel env rm VARIABLE_NAME

# Pull production variables for debugging (temporary)
vercel env pull .env.production.local --environment production

# ⚠️ IMPORTANT: Delete immediately after use
rm .env.production.local
```

### Required Production Variables

```
✅ DATABASE_URL (Neon PostgreSQL)
✅ NEXTAUTH_URL=https://medbookings.co.za
✅ NEXTAUTH_SECRET (32+ characters, different from local)
✅ GOOGLE_CLIENT_ID (production OAuth)
✅ GOOGLE_CLIENT_SECRET (production OAuth)
✅ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
✅ BLOB_READ_WRITE_TOKEN (Vercel Blob)
✅ SENDGRID_API_KEY (production)
✅ SENDGRID_FROM_EMAIL=info@medbookings.co.za
✅ TWILIO_ACCOUNT_SID (production)
✅ TWILIO_AUTH_TOKEN (production)
✅ TWILIO_PHONE_NUMBER
✅ TWILIO_WHATSAPP_NUMBER
✅ UPSTASH_REDIS_REST_URL (REQUIRED for production)
✅ UPSTASH_REDIS_REST_TOKEN (REQUIRED for production)
✅ ADMIN_EMAILS=info@medbookings.co.za
✅ ADMIN_NOTIFICATION_EMAIL=info@medbookings.co.za
```

**Verify production variables:**
```bash
vercel env ls
```

---

## 🧪 Testing Environment

Testing uses `.env.test` with mock credentials.

**DO NOT modify `.env.test` unless:**
- Adding new required environment variables
- Updating mock service URLs
- Changing test configuration

**`.env.test` is tracked in git** - it should contain NO real secrets, only mock data.

---

## 🐛 Troubleshooting

### "Environment validation failed"

**Error:**
```
Error: Invalid environment configuration - cannot deploy
```

**Solution:**
1. Check all required variables are in `.env.local`
2. Verify `NEXTAUTH_SECRET` is at least 32 characters
3. Verify DATABASE_URL format is correct
4. Run: `npm run build` to see which variable is missing

### "Can't reach database server"

**Error:**
```
Error: P1001: Can't reach database server at `localhost:5433`
```

**Solution:**
```bash
# Check if Docker is running
docker ps

# Start database if not running
docker-compose up -d

# Verify connection
docker logs medbookings-db-1
```

### "Redis connection failed" warnings

**Logs show:**
```
Production in-memory rate limit check (UNSAFE FOR MULTI-INSTANCE)
```

**Solution:**
- This is NORMAL for local development
- App will use in-memory rate limiting
- To eliminate warnings, add Upstash Redis credentials to `.env.local`
- **CRITICAL for production** - Redis must be configured in Vercel

### OAuth redirect URI mismatch

**Error:**
```
Error 400: redirect_uri_mismatch
```

**Solution:**
1. Go to Google Cloud Console
2. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Wait 5 minutes for changes to propagate
4. Clear browser cache and try again

---

## 📚 Additional Resources

**Related Documentation:**
- [Deployment Guide](/docs/deployment/VERCEL-DEPLOYMENT.md)
- [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md)
- [Credential Rotation](/docs/deployment/CREDENTIAL-ROTATION.md)
- [Upstash Redis Setup](/docs/deployment/UPSTASH-REDIS-SETUP.md)

**External Resources:**
- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)

---

## 🆘 Getting Help

**If you're stuck:**
1. Check this documentation first
2. Search existing GitHub issues
3. Ask in team Slack channel
4. Create GitHub issue with:
   - What you tried
   - Error messages (NO secrets!)
   - Environment (local/production)

**Never share:**
- API keys
- Database credentials
- Auth secrets
- Any value from `.env.local`

---

## ✅ Checklist for New Developers

Before your first commit:

- [ ] Created `.env.local` (not `.env`)
- [ ] Filled in all required values
- [ ] Database running and migrations applied
- [ ] Development server starts without errors
- [ ] Can login with Google OAuth
- [ ] Verified `.env.local` is NOT tracked in git
- [ ] Read security rules above
- [ ] Understand: NEVER commit secrets

---

**Questions?** Ask your team lead or senior developer.

**Security concerns?** Report immediately to security team.
