# Credential Rotation Guide

**Last Updated:** 2025-11-03
**Status:** Active Procedure
**Severity:** CRITICAL

## Overview

This guide provides step-by-step instructions for rotating compromised or exposed credentials in the MedBookings application. Follow this procedure immediately if credentials have been exposed in git history, logs, or external systems.

## When to Rotate Credentials

Rotate credentials immediately if:

- ✅ Credentials were committed to git (even if later removed)
- ✅ Credentials were exposed in logs or error messages
- ✅ Credentials were shared via insecure channels (email, Slack, etc.)
- ✅ A team member with access has left the organization
- ✅ Suspicious activity detected in external services
- ✅ As part of routine security maintenance (every 90 days recommended)

## Pre-Rotation Checklist

- [ ] Confirm access to all service provider dashboards
- [ ] Notify team of scheduled rotation (if planned)
- [ ] Backup current `.env` file securely
- [ ] Ensure access to production environment variables (Vercel, AWS, etc.)
- [ ] Schedule during low-traffic period if possible

---

## Credentials Inventory

### Critical Credentials (Rotate Immediately if Exposed)

| Credential | Service | Impact if Compromised |
|------------|---------|----------------------|
| `DATABASE_URL` | PostgreSQL | Full database access, data breach |
| `NEXTAUTH_SECRET` | NextAuth | Session hijacking, authentication bypass |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Impersonate users, steal accounts |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | Access/delete uploaded files |
| `TWILIO_AUTH_TOKEN` | Twilio | Send unauthorized SMS/WhatsApp, incur charges |
| `SENDGRID_API_KEY` | SendGrid | Send unauthorized emails, incur charges |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | Rate limit bypass, data manipulation |

### Low-Risk Credentials (Rotate When Convenient)

| Credential | Service | Impact if Compromised |
|------------|---------|----------------------|
| `GOOGLE_MAPS_API_KEY` | Google Maps | API quota abuse, incur charges |
| `GOOGLE_CLIENT_ID` | Google OAuth | Limited (requires secret for exploitation) |

---

## Rotation Procedures

### 1. Database URL (`DATABASE_URL`)

**Service:** PostgreSQL (Vercel Postgres, AWS RDS, or self-hosted)

**Steps:**

```bash
# 1. Create new database user with identical permissions
# Example for PostgreSQL:
psql postgres://old-connection-string

CREATE USER medbookings_new WITH PASSWORD 'new_secure_password';
GRANT ALL PRIVILEGES ON DATABASE medbookings TO medbookings_new;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medbookings_new;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO medbookings_new;

# 2. Construct new DATABASE_URL
# Format: postgresql://username:password@host:port/database?schema=public
# Example: postgresql://medbookings_new:new_secure_password@db.example.com:5432/medbookings?schema=public

# 3. Update environment variables (see section below)

# 4. Test connection
npm run prisma db pull

# 5. Revoke old user access
DROP USER medbookings_old;
```

**Verification:**
```bash
npm run prisma studio
# Should connect successfully and display data
```

### 2. NextAuth Secret (`NEXTAUTH_SECRET`)

**Service:** NextAuth.js

**Steps:**

```bash
# 1. Generate new secret (minimum 32 characters)
openssl rand -base64 32

# Example output: dGhpcyBpcyBhIHJhbmRvbSBzZWNyZXQga2V5IGZvciBhdXRo

# 2. Update environment variables (see section below)

# 3. IMPORTANT: This will invalidate ALL existing sessions
#    Users will be logged out and must re-authenticate
```

**Post-Rotation:**
```bash
# Notify users via email about session reset
# Optional: Add banner on site warning about logout

# Monitor login activity for 24 hours
# Check logs for authentication errors
```

### 3. Google OAuth Credentials

**Service:** Google Cloud Console

**Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (medbookings)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click **Delete** on the compromised credential
6. Click **Create Credentials** → **OAuth Client ID**
7. Configure:
   - Application type: Web application
   - Name: MedBookings Production (or appropriate name)
   - Authorized redirect URIs:
     - `https://medbookings.co.za/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for dev)
8. Copy new `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
9. Update environment variables (see section below)

**Verification:**
```bash
# Test Google OAuth login
# 1. Logout of application
# 2. Click "Sign in with Google"
# 3. Should successfully authenticate
```

### 4. Vercel Blob Token (`BLOB_READ_WRITE_TOKEN`)

**Service:** Vercel Blob Storage

**Steps:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Storage** → **Blob**
3. Click **Settings** → **Tokens**
4. Delete compromised token
5. Click **Create Token**
6. Name: Production Read/Write Token
7. Copy new token
8. Update environment variables (see section below)

**Verification:**
```bash
# Test file upload
# 1. Login as provider
# 2. Upload requirement document
# 3. Verify document displays correctly
```

### 5. Twilio Credentials

**Service:** Twilio

**Steps:**

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Account** → **API Keys & Tokens**
3. Click **Create New API Key**
4. Type: Standard
5. Friendly Name: MedBookings Production
6. Copy `SID` and `Secret`
7. Update environment variables:
   - `TWILIO_ACCOUNT_SID` = API Key SID
   - `TWILIO_AUTH_TOKEN` = API Key Secret
8. Delete old API key

**Verification:**
```bash
# Test SMS sending (only in production, careful with costs)
# 1. Create test booking
# 2. Verify SMS notification sent
# 3. Check Twilio logs for successful delivery
```

### 6. SendGrid API Key

**Service:** SendGrid

**Steps:**

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name: MedBookings Production
5. Permissions: Full Access (or minimum required)
6. Copy new API key
7. Update environment variables (see section below)
8. Delete old API key

**Verification:**
```bash
# Test email sending
# 1. Trigger password reset
# 2. Verify email received
# 3. Check SendGrid activity logs
```

### 7. Upstash Redis Credentials

**Service:** Upstash Redis

**Steps:**

1. Go to [Upstash Console](https://console.upstash.com/redis)
2. Select your Redis database
3. Click **Details** → **REST API**
4. Click **Regenerate Tokens**
5. Copy new `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
6. Update environment variables (see section below)

**Verification:**
```bash
# Test rate limiting
# 1. Make multiple rapid API requests
# 2. Verify rate limiting triggers (429 Too Many Requests)
# 3. Check Upstash dashboard for activity
```

---

## Updating Environment Variables

### Development (Local)

```bash
# 1. Update .env file (NEVER commit this file)
nano .env

# 2. Replace old values with new credentials

# 3. Restart development server
npm run dev
```

### Production (Vercel)

```bash
# Option 1: Via Vercel Dashboard
# 1. Go to https://vercel.com/dashboard
# 2. Select project → Settings → Environment Variables
# 3. Find variable to update
# 4. Click Edit → Update value → Save
# 5. Redeploy: Deployments → Latest → Redeploy

# Option 2: Via Vercel CLI
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
# Enter new value when prompted

# 3. Trigger new deployment
vercel --prod
```

### Production (AWS, Other Platforms)

```bash
# AWS Elastic Beanstalk
eb setenv DATABASE_URL="new-value" NEXTAUTH_SECRET="new-value"
eb deploy

# Docker / Docker Compose
# Update .env.production or docker-compose.yml
docker-compose down
docker-compose up -d

# Kubernetes
kubectl create secret generic medbookings-secrets \
  --from-literal=DATABASE_URL="new-value" \
  --from-literal=NEXTAUTH_SECRET="new-value" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/medbookings
```

---

## Removing Credentials from Git History

**⚠️ WARNING:** This rewrites git history and requires force-pushing. Coordinate with team first.

### Option 1: BFG Repo-Cleaner (Recommended)

```bash
# 1. Install BFG Repo-Cleaner
# macOS:
brew install bfg

# Linux/Windows: Download from https://rtyley.github.io/bfg-repo-cleaner/

# 2. Clone fresh copy of repository
git clone --mirror https://github.com/your-org/medbookings.git medbookings-mirror.git
cd medbookings-mirror.git

# 3. Remove .env files from history
bfg --delete-files .env

# 4. Clean up repository
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (REQUIRES TEAM COORDINATION)
git push --force

# 6. All team members must re-clone repository
# Tell team: "Delete local repo and re-clone from GitHub"
```

### Option 2: git-filter-repo

```bash
# 1. Install git-filter-repo
pip install git-filter-repo

# 2. Backup repository
cp -r medbookings medbookings-backup

# 3. Remove .env from history
cd medbookings
git filter-repo --path .env --invert-paths

# 4. Force push
git push --force

# 5. All team members must re-clone repository
```

### Option 3: Manual (Small Repositories Only)

```bash
# Remove .env from last commit only
git filter-branch --index-filter \
  'git rm --cached --ignore-unmatch .env' HEAD

git push --force
```

### After Cleaning Git History

```bash
# 1. Verify .env is removed
git log --all --full-history -- .env
# Should return: nothing

# 2. Verify .env is in .gitignore
cat .gitignore | grep .env
# Should show: .env

# 3. Notify all team members:
#    "Git history rewritten. Delete local repo and re-clone."
```

---

## Post-Rotation Verification Checklist

After rotating credentials, verify everything works:

- [ ] **Build succeeds:** `npm run build`
- [ ] **Database accessible:** `npm run prisma studio`
- [ ] **Authentication works:** Login with Google OAuth
- [ ] **File uploads work:** Upload provider requirement
- [ ] **Emails send:** Trigger password reset
- [ ] **SMS sends:** Create booking (if SMS enabled)
- [ ] **Rate limiting works:** Make rapid API requests
- [ ] **No errors in logs:** Check application logs for 24 hours
- [ ] **Production deployment successful:** Verify live site works
- [ ] **Monitoring alerts:** No new alerts or errors

---

## Routine Maintenance Schedule

Rotate credentials on a regular schedule to maintain security:

| Credential | Rotation Frequency | Next Due |
|------------|-------------------|----------|
| `NEXTAUTH_SECRET` | Every 90 days | TBD |
| `DATABASE_URL` | Every 180 days | TBD |
| API Keys (Twilio, SendGrid, etc.) | Every 90 days | TBD |
| OAuth Credentials | Annually | TBD |

**Set calendar reminders** for routine rotations.

---

## Emergency Contact Information

If credentials are compromised and you cannot complete rotation:

- **Database:** Contact database administrator
- **Vercel:** support@vercel.com
- **Google Cloud:** https://support.google.com/cloud/
- **Twilio:** https://support.twilio.com/
- **SendGrid:** https://support.sendgrid.com/

---

## Audit Trail

Maintain a record of all credential rotations:

| Date | Credential | Reason | Performed By |
|------|-----------|--------|--------------|
| 2025-11-03 | All | Initial security audit | TBD |

---

## Related Documentation

- [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md)
- [Vercel Deployment Guide](/docs/deployment/VERCEL-DEPLOYMENT.md)
- [Environment Variables Reference](/docs/deployment/ENVIRONMENT-VARIABLES.md)

---

**Document Version:** 1.0
**Maintained By:** DevOps Team
**Review Schedule:** Quarterly
