# Google Cloud Console OAuth 2.0 Setup Guide

Complete guide for configuring Google Calendar OAuth integration in MedBookings.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Create Google Cloud Project](#create-google-cloud-project)
4. [Enable Required APIs](#enable-required-apis)
5. [Configure OAuth Consent Screen](#configure-oauth-consent-screen)
6. [Create OAuth 2.0 Credentials](#create-oauth-20-credentials)
7. [Configure Authorized Redirect URIs](#configure-authorized-redirect-uris)
8. [Set Environment Variables](#set-environment-variables)
9. [Testing the Integration](#testing-the-integration)
10. [Production Deployment](#production-deployment)
11. [Security Best Practices](#security-best-practices)
12. [Troubleshooting](#troubleshooting)
13. [Additional Resources](#additional-resources)

---

## Overview

### What This Enables

Google Calendar OAuth 2.0 integration provides:
- **Bidirectional calendar sync**: Import Google Calendar events → Block MedBookings slots
- **Booking exports**: Create Google Calendar events from MedBookings bookings
- **Google Meet integration**: Auto-create video meeting links for online appointments
- **Real-time sync**: Webhook support for instant calendar updates (optional)

### Required Scopes

MedBookings requests the following OAuth scopes:

| Scope | Purpose | Required |
|-------|---------|----------|
| `calendar` | Read/write access to calendars | ✅ Yes |
| `calendar.events` | Read/write access to events | ✅ Yes |
| `calendar.readonly` | Read-only access (for sync verification) | ✅ Yes |
| `userinfo.email` | Retrieve user's Google email address | ✅ Yes |
| `userinfo.profile` | Retrieve user's profile information | ⚠️ Recommended |

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Google Account** (Gmail or Google Workspace)
- ✅ **Billing Account** (required for production, free tier OK for development)
- ✅ **MedBookings Environment** running locally or deployed
- ✅ **Admin Access** to create Google Cloud projects
- ✅ **Domain Ownership** (for production verification)

**Estimated Time:** 30-45 minutes

---

## Create Google Cloud Project

### Step 1: Navigate to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project selector dropdown (top navigation bar)

### Step 2: Create New Project

1. Click **"New Project"** button
2. Fill in project details:
   - **Project Name:** `MedBookings Calendar Integration`
   - **Organization:** (Select your organization, if applicable)
   - **Location:** Leave default or select parent folder
3. Click **"Create"**
4. Wait for project creation (~10-30 seconds)
5. **Note your Project ID** (e.g., `medbookings-calendar-123456`)

### Alternative: Using gcloud CLI

```bash
# Install gcloud CLI first: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Create project
gcloud projects create medbookings-calendar-integration \
  --name="MedBookings Calendar Integration"

# Set as active project
gcloud config set project medbookings-calendar-integration
```

---

## Enable Required APIs

### Step 1: Enable Google Calendar API

1. In Google Cloud Console, navigate to **APIs & Services** → **Library**
2. Search for **"Google Calendar API"**
3. Click on the result
4. Click **"Enable"** button
5. Wait for enablement (~5-10 seconds)

### Step 2: Enable Google People API

1. Still in API Library, search for **"Google People API"**
2. Click on the result
3. Click **"Enable"** button
4. Required for retrieving user email addresses

### Alternative: Using gcloud CLI

```bash
# Enable both APIs at once
gcloud services enable calendar-json.googleapis.com \
  people.googleapis.com \
  --project=medbookings-calendar-integration
```

### Verification

Navigate to **APIs & Services** → **Dashboard** and confirm both APIs show as enabled.

---

## Configure OAuth Consent Screen

The OAuth consent screen is what users see when granting calendar access to MedBookings.

### Step 1: Navigate to OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **User Type**:
   - **Internal**: Only for Google Workspace organizations (restricts to your domain)
   - **External**: For public applications (**Choose this for MedBookings**)

### Step 2: Configure App Information

**OAuth consent screen (Page 1):**

| Field | Value | Notes |
|-------|-------|-------|
| App name | `MedBookings` | Shown to users during consent |
| User support email | `support@medbookings.com` | Where users can get help |
| App logo | Upload logo (120x120px PNG) | Optional but recommended |
| Application home page | `https://medbookings.com` | Your production URL |
| Application privacy policy | `https://medbookings.com/privacy-policy` | **Required for production** |
| Application terms of service | `https://medbookings.com/terms-of-use` | **Required for production** |
| Authorized domains | `medbookings.com` | Top-level domain only (no protocol) |

**Developer contact information:**
- Add email addresses for Google to contact you (e.g., `dev@medbookings.com`)

Click **"Save and Continue"**

### Step 3: Add Scopes

1. Click **"Add or Remove Scopes"** button
2. Filter by "calendar" in the search box
3. Select the following scopes:

```
✅ https://www.googleapis.com/auth/calendar
✅ https://www.googleapis.com/auth/calendar.events
✅ https://www.googleapis.com/auth/calendar.readonly
✅ https://www.googleapis.com/auth/userinfo.email
✅ https://www.googleapis.com/auth/userinfo.profile
```

4. Click **"Update"** at the bottom
5. Click **"Save and Continue"**

### Step 4: Add Test Users (Development Only)

**Important:** While your app is in "Testing" mode, only test users can authenticate.

1. Click **"Add Users"** button
2. Add test user emails (one per line):
   ```
   test-provider-connected@medbookings.test
   test-org-owner@medbookings.test
   your-personal-gmail@gmail.com
   ```
3. Click **"Add"**
4. Click **"Save and Continue"**

### Step 5: Review Summary

1. Review all settings
2. Click **"Back to Dashboard"**

**Publishing Status:**
- **Testing**: Max 100 test users, no verification required
- **In Production**: Unlimited users, requires Google verification (see [Production Deployment](#production-deployment))

---

## Create OAuth 2.0 Credentials

### Step 1: Navigate to Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**

### Step 2: Configure OAuth Client

**Application type:** `Web application`

**Name:** `MedBookings Calendar Integration`

**Authorized JavaScript origins:** (Leave empty)

**Authorized redirect URIs:** (Configure in next section)

### Step 3: Download Credentials

1. After creation, a modal appears with your **Client ID** and **Client secret**
2. **⚠️ CRITICAL:** Copy and save both immediately
3. Click **"Download JSON"** to save credentials file (optional backup)

**Credentials Format:**
```json
{
  "client_id": "123456789-abcdefg.apps.googleusercontent.com",
  "client_secret": "GOCSPX-abc123def456ghi789",
  "redirect_uris": []
}
```

**🔒 Security Warning:**
- **NEVER commit client secret to version control**
- **NEVER expose client secret in frontend code**
- **NEVER share credentials publicly**
- Store in environment variables only (`.env.local`, Vercel Environment Variables, etc.)

---

## Configure Authorized Redirect URIs

OAuth redirect URIs tell Google where to send users after they approve calendar access.

### Step 1: Edit OAuth Client

1. In **Credentials** page, click on your OAuth client name
2. Scroll to **"Authorized redirect URIs"** section
3. Click **"Add URI"** for each environment

### Development Environment

Add both callback endpoints:

```
http://localhost:3000/api/auth/google/calendar/callback
http://localhost:3000/api/auth/google/organization-calendar/callback
```

**Important:**
- Use `http` (not `https`) for localhost
- Include port `:3000`
- No trailing slashes
- Exact path match required

### Staging Environment (if applicable)

```
https://staging.medbookings.com/api/auth/google/calendar/callback
https://staging.medbookings.com/api/auth/google/organization-calendar/callback
```

### Production Environment

```
https://medbookings.com/api/auth/google/calendar/callback
https://medbookings.com/api/auth/google/organization-calendar/callback
```

**Alternative Domain (if applicable):**
```
https://app.medbookings.com/api/auth/google/calendar/callback
https://app.medbookings.com/api/auth/google/organization-calendar/callback
```

### Step 2: Save Configuration

1. Click **"Save"** at the bottom
2. Wait for confirmation message
3. Changes take effect immediately (no propagation delay)

### Verification

Test redirect URI format:
```bash
# Should NOT have:
❌ https://medbookings.com/api/auth/google/calendar/callback/
❌ https://medbookings.com/api/auth/google/calendar/callback?param=value
❌ http://medbookings.com/api/auth/google/calendar/callback (missing 's' in https)

# Correct format:
✅ https://medbookings.com/api/auth/google/calendar/callback
```

---

## Set Environment Variables

### Local Development (`.env.local`)

Create or update `.env.local` in your project root:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456ghi789"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-character-random-secret-here-replace-this"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/medbookings_dev"

# Calendar Sync Configuration (Optional)
SYNC_INTERVAL_MINUTES=15
MAX_SYNC_RETRIES=5
SYNC_BATCH_SIZE=50

# Cron Job Secret (REQUIRED for background sync)
CRON_SECRET="your-cron-secret-here"
```

**Generating NEXTAUTH_SECRET:**
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# https://generate-secret.vercel.app/32
```

### Vercel Production

1. Navigate to your Vercel project
2. Go to **Settings** → **Environment Variables**
3. Add each variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `GOOGLE_CLIENT_ID` | `(your client ID)` | Production |
| `GOOGLE_CLIENT_SECRET` | `(your client secret)` | Production |
| `NEXTAUTH_URL` | `https://medbookings.com` | Production |
| `NEXTAUTH_SECRET` | `(your secret)` | Production, Preview, Development |
| `CRON_SECRET` | `(your cron secret)` | Production |

4. Click **"Save"** for each
5. Redeploy your application for changes to take effect

**Security Notes:**
- Use **Production only** for sensitive credentials (never Preview/Development)
- Rotate secrets every 90 days
- Use different secrets for staging vs production

### Verification

```bash
# Check environment variables are loaded
npm run dev

# In another terminal, test variable access:
node -e "console.log(process.env.GOOGLE_CLIENT_ID)"
# Should output your client ID (if in same environment)
```

**Reference:** See [`/docs/setup/ENVIRONMENT-VARIABLES.md`](/docs/setup/ENVIRONMENT-VARIABLES.md) for complete variable reference.

---

## Testing the Integration

### Step 1: Start Development Server

```bash
npm run dev
```

Server should start on `http://localhost:3000`

### Step 2: Test Provider Calendar Connection

1. Navigate to `http://localhost:3000/provider-profile`
2. Click **"Overview"** tab
3. Scroll to **"Calendar Sync"** section
4. Click **"Connect Google Calendar"** button

**Expected Flow:**
1. ✅ Redirects to `https://accounts.google.com/o/oauth2/v2/auth`
2. ✅ Shows OAuth consent screen with your app name
3. ✅ Lists requested scopes (Calendar, Events, Email)
4. ✅ Click "Continue" → Redirects to `http://localhost:3000/api/auth/google/calendar/callback`
5. ✅ Callback processes OAuth code exchange
6. ✅ Final redirect to `/profile/service-provider/view`
7. ✅ Calendar Sync section now shows "Connected" status
8. ✅ Check database: `CalendarIntegration` record created

### Step 3: Test Organization Calendar Connection

1. Navigate to organization profile (owner account): `http://localhost:3000/organizations/{id}`
2. Scroll to **"Calendar Sync"** section
3. Click **"Connect Google Calendar"**
4. Similar flow as provider, redirects to `/organization/{id}/settings/calendar`

### Troubleshooting Checklist

If connection fails:

- ✅ Environment variables set correctly (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- ✅ Redirect URI exactly matches in Google Console
- ✅ APIs enabled (Google Calendar API, Google People API)
- ✅ OAuth consent screen configured
- ✅ Test user added (if app in "Testing" mode)
- ✅ Browser console shows no errors
- ✅ Server logs show no errors

**Common Error:** `redirect_uri_mismatch`
- **Solution:** Double-check redirect URI in Google Console matches exactly (protocol, domain, port, path)

### Step 4: Test Calendar Sync

1. In connected provider's Google Calendar (separate tab), create event for tomorrow 2PM
2. Return to MedBookings Calendar Sync dashboard
3. Click **"Sync Now"**
4. **Expected:** Event imports successfully, operation shows "Success" status
5. Navigate to provider availability
6. **Expected:** 2PM slot shows as "BLOCKED"

**Comprehensive Testing:** Use [`/docs/testing/CALENDAR-SYNC-BROWSER-TESTING-GUIDE.md`](/docs/testing/CALENDAR-SYNC-BROWSER-TESTING-GUIDE.md) for 50+ test scenarios.

---

## Production Deployment

### Publishing Your OAuth App

When ready for public access (>100 users), submit for Google verification.

### Step 1: Verify Domain Ownership

**Required:** Prove you own your domain.

1. Navigate to **Google Search Console**: https://search.google.com/search-console
2. Add your domain: `medbookings.com`
3. Verify ownership via DNS TXT record or HTML file
4. Return to Google Cloud Console → **OAuth consent screen** → **Authorized domains**
5. Add verified domain

### Step 2: Prepare Verification Materials

Google requires:

**Required Documents:**
- ✅ **Privacy Policy URL**: `https://medbookings.com/privacy-policy`
  - Must explain calendar data usage
  - Must include data retention policy
  - Must explain user rights (access, delete, export)
- ✅ **Terms of Service URL**: `https://medbookings.com/terms-of-use`
- ✅ **App Homepage**: `https://medbookings.com`
- ✅ **YouTube Video**: Demo of OAuth flow (2-5 minutes)
  - Show consent screen
  - Show calendar data usage in app
  - Show how users can disconnect

**Scope Justification:**
For each scope, explain why it's needed:

| Scope | Justification Example |
|-------|----------------------|
| `calendar` | "Required to bidirectionally sync user's Google Calendar with MedBookings appointments" |
| `calendar.events` | "Required to create/update/delete calendar events when bookings are made/modified" |
| `calendar.readonly` | "Required to verify calendar data integrity after sync operations" |
| `userinfo.email` | "Required to identify which Google Calendar account is connected to the user's profile" |

### Step 3: Submit for Verification

1. Navigate to **OAuth consent screen**
2. Click **"Publish App"** button
3. Fill out verification form:
   - Upload YouTube video
   - Provide scope justifications
   - Agree to terms
4. Click **"Submit for Verification"**

**Timeline:**
- Initial review: 3-5 business days
- Additional information requests: 1-2 weeks
- Final approval: 1-4 weeks total

**Status Tracking:**
- Check **OAuth consent screen** page for updates
- Google sends email notifications to developer contact addresses

### Step 4: Production Checklist

Before going live:

**Security:**
- ✅ Rotate all secrets (new `NEXTAUTH_SECRET`, `CRON_SECRET`)
- ✅ Use production-specific `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- ✅ Enable HTTPS only (no HTTP redirects)
- ✅ Configure security headers (HSTS, CSP, X-Frame-Options)
- ✅ Set up monitoring (Sentry error tracking)

**OAuth Configuration:**
- ✅ Production redirect URIs configured
- ✅ App published (out of "Testing" mode)
- ✅ Domain verified
- ✅ Privacy policy live and accessible

**Testing:**
- ✅ Test OAuth flow on production URL
- ✅ Test calendar sync with real Google account
- ✅ Test disconnect flow
- ✅ Test token refresh (wait 1 hour after connection)

**Reference:** See [`/docs/deployment/SECURITY-CHECKLIST.md`](/docs/deployment/SECURITY-CHECKLIST.md) for complete pre-launch checklist.

---

## Security Best Practices

### Token Storage

**Do:**
- ✅ Store access tokens encrypted in database
- ✅ Store refresh tokens encrypted separately
- ✅ Use environment variables for OAuth secrets
- ✅ Implement automatic token refresh before expiry
- ✅ Audit log all token refresh events

**Don't:**
- ❌ Log tokens (even in debug mode)
- ❌ Expose tokens in API responses
- ❌ Store tokens in browser localStorage/sessionStorage
- ❌ Share tokens between environments (dev/staging/prod)

### Credential Rotation

**Schedule:**
- **Development:** Rotate every 6 months
- **Production:** Rotate every 90 days

**Rotation Procedure:**
1. Create new OAuth client in Google Console
2. Add new credentials to environment variables (keep old ones)
3. Deploy new credentials
4. Monitor for 24 hours (ensure no errors)
5. Remove old credentials from environment
6. Delete old OAuth client in Google Console

### Scope Minimization

**Principle:** Only request scopes you actually use.

**Review Checklist:**
- ✅ Can this feature work with `calendar.readonly` instead of `calendar`?
- ✅ Do we need `userinfo.profile` or just `userinfo.email`?
- ✅ Remove unused scopes from OAuth consent screen

### Monitoring & Alerts

**Set up alerts for:**
- ⚠️ Token refresh failures (> 5% failure rate)
- ⚠️ OAuth callback errors (any `redirect_uri_mismatch`)
- ⚠️ Suspicious activity (mass token revocations)
- ⚠️ API quota approaching limits

**Monitoring Tools:**
- Sentry for error tracking
- Google Cloud Console → **APIs & Services** → **Quotas** for usage monitoring
- Custom dashboard for sync operation success rates

---

## Troubleshooting

### Common OAuth Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `redirect_uri_mismatch` | Redirect URI doesn't match Google Console config | Verify exact URI match (protocol, domain, port, path) |
| `invalid_client` | Client ID or secret incorrect | Check environment variables, ensure no extra whitespace |
| `access_denied` | User denied calendar access | Expected behavior - user choice, no action needed |
| `invalid_scope` | Requested scope not configured | Add scope to OAuth consent screen in Google Console |
| `invalid_grant` | Authorization code expired or already used | Retry OAuth flow, check server time sync |
| `unauthorized_client` | Client not authorized for this grant type | Ensure OAuth client type is "Web application" |

### Calendar Sync Issues

**Problem:** Sync completes but no events imported

**Diagnosis:**
1. Check `CalendarSyncOperation` status in database
2. Look for `eventsFailed` count
3. Check server logs for error messages

**Solutions:**
- Verify user has events in the sync window (next 90 days)
- Check `syncDirection` is not `EXPORT_ONLY`
- Ensure `syncEnabled = true` in `CalendarIntegration`

**Problem:** Slots not blocking despite calendar events

**Diagnosis:**
1. Check `CalendarEvent.blocksAvailability = true`
2. Verify `CalculatedAvailabilitySlot.status = BLOCKED`
3. Check `blockedByEventId` foreign key is set

**Solutions:**
- Run `regenerateSlotsForProvider()` to rebuild slots
- Verify event times overlap with availability times
- Check timezone configuration (should be UTC in database)

### Token Refresh Failures

**Problem:** `invalid_grant` error during token refresh

**Causes:**
- User revoked access in Google Account settings
- Refresh token expired (Google revokes after 6 months inactivity)
- Credentials rotated but database still has old tokens

**Solution:**
1. Delete `CalendarIntegration` record
2. User reconnects calendar (fresh OAuth flow)
3. New tokens issued

### Debug Mode

Enable verbose OAuth logging (development only):

```bash
# Add to .env.local
DEBUG=oauth:*,google:*,nextauth:*

# Start dev server
npm run dev
```

**⚠️ Warning:** Debug mode logs may contain sensitive data. Never enable in production.

---

## Additional Resources

### Official Documentation

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

### MedBookings Documentation

- [Environment Setup Guide](/docs/setup/ENVIRONMENT-SETUP.md) - Complete local development setup
- [Environment Variables Reference](/docs/setup/ENVIRONMENT-VARIABLES.md) - All required variables
- [Calendar Sync Browser Testing Guide](/docs/testing/CALENDAR-SYNC-BROWSER-TESTING-GUIDE.md) - Comprehensive testing scenarios
- [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md) - Pre-deployment security verification
- [Credential Rotation Guide](/docs/deployment/CREDENTIAL-ROTATION.md) - Secret rotation procedures

### Support

**Internal:**
- Slack: `#calendar-sync-support`
- Email: `dev@medbookings.com`

**External:**
- Google Cloud Support: https://cloud.google.com/support
- Stack Overflow: Tag `google-oauth` + `google-calendar-api`

---

**Last Updated:** 2025-01-07

**Version:** 1.0

**Maintained By:** MedBookings Engineering Team
