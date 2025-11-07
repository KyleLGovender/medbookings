# Real-World Calendar Sync Testing Guide

**Last Updated**: 2025-11-07
**Purpose**: Complete end-to-end testing guide for calendar functionality using production-realistic data
**Target Audience**: QA testers, product managers, developers

---

## 🎯 Overview

This guide provides explicit, step-by-step instructions for **end-to-end UAT (User Acceptance Testing)** of the Google Calendar integration feature using **real accounts** (not test seed data). Follow this guide to verify the complete user journey from account creation through daily calendar operations.

**Target Audience:** Product managers, manual QA testers, new developers

**Testing Approach:** Real account-based (production-realistic, fresh accounts)

**For technical regression testing, security validation, performance benchmarks, and advanced edge cases, see:**
🔧 [`/docs/testing/CALENDAR-SYNC-BROWSER-TESTING-GUIDE.md`](/docs/testing/CALENDAR-SYNC-BROWSER-TESTING-GUIDE.md)

**What This Guide Covers:**
- ✅ Fresh provider account creation and Google Calendar connection
- ✅ Organization account creation and multi-location calendar setup
- ✅ OAuth flow testing (connection, re-connection, token refresh)
- ✅ Manual and automatic sync operations
- ✅ Disconnect and reconnect workflows
- ✅ Error handling and edge cases
- ✅ Real-world scenarios (external events blocking slots, etc.)

---

## 🔧 Prerequisites

### Environment Setup

**1. Local Development Server:**
```bash
# Terminal 1: Start database
docker-compose up -d

# Terminal 2: Reset database to clean state (removes all test data)
npx prisma migrate reset --force

# Terminal 3: Start Next.js development server
npm run dev
```

**2. Environment Variables:**
Ensure your `.env` file has:
```bash
# Google OAuth (required for calendar integration)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Admin configuration
ADMIN_EMAILS=info@medbookings.co.za

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

**3. Test Accounts Needed:**
- **2 Google accounts** (provider tests + organization tests)
- **Admin access** to `info@medbookings.co.za` (for admin actions)

**4. Browser Setup:**
- Modern browser (Chrome, Firefox, Safari)
- DevTools open (Console + Network tabs)
- Incognito/Private mode for clean testing

---

## 📋 Testing Checklist Summary

| Section | Tests | Estimated Time |
|---------|-------|----------------|
| **Part 1: Provider Flow** | 8 tests | 30 minutes |
| **Part 2: Organization Flow** | 6 tests | 25 minutes |
| **Part 3: Edge Cases** | 4 tests | 15 minutes |
| **Part 4: Error Handling** | 3 tests | 10 minutes |
| **Total** | 21 tests | ~80 minutes |

---

# Part 1: Provider Calendar Sync Flow

## Test 1.1: Create New Provider Account

**Objective:** Create a fresh provider account using Google OAuth sign-in

### Steps:

1. **Navigate to application**
   - URL: `http://localhost:3000`
   - **Expected:** Homepage loads, shows "Sign in" button in header

2. **Click "Sign in"**
   - Location: Top right corner
   - **Expected:** Redirects to `/login`

3. **Click "Continue with Google"**
   - Button: Blue button with Google logo
   - **Expected:** Opens Google account selection dialog

4. **Select/Enter first test Google account**
   - Use: `provider-test@gmail.com` (or your test account)
   - **Expected:** Google asks for permission to access profile

5. **Grant permissions**
   - Click: "Allow" or "Continue"
   - **Expected:** Redirects back to MedBookings

6. **Verify sign-in success**
   - **Expected:** URL is `/` or `/dashboard`
   - **Expected:** User avatar visible in header
   - **Expected:** User name displayed

7. **Check user type**
   - **Expected:** Dashboard shows "No provider profile yet" or similar message
   - **Expected:** Option to "Join as Provider" visible

### ✅ Pass Criteria:
- [ ] Successfully signed in with Google
- [ ] User profile created in database
- [ ] No console errors
- [ ] User redirected to appropriate page

---

## Test 1.2: Complete Provider Registration

**Objective:** Fill out provider registration form and submit for approval

### Steps:

1. **Navigate to provider registration**
   - Click: "Join as Provider" or navigate to `/join-platform`
   - **Expected:** Registration form loads

2. **Select provider type**
   - Select: "General Practitioner"
   - **Expected:** Form updates showing GP-specific requirements

3. **Fill in basic information**
   - **Name:** Dr. John Smith
   - **Phone:** +27821234567
   - **Bio:** Experienced GP with 10+ years practice
   - **Languages:** English, Afrikaans
   - **Show Price:** Toggle ON

4. **Fill in HPCSA requirements**
   - **HPCSA Membership:** Yes
   - **HPCSA Number:** MP123456
   - **HPCSA Registration Document:** Upload valid PDF (use dummy file for testing)

5. **Fill in Medical Practice Insurance**
   - **Have Insurance:** Yes
   - **Expiry Date:** Select date 60+ days in future
   - **Insurance Certificate:** Upload valid PDF

6. **Fill in Education**
   - **Medical School:** Select "University of Cape Town"
   - **Graduation Year:** 2010
   - **Degree Certificate:** Upload valid PDF

7. **Submit registration**
   - Click: "Submit for Approval"
   - **Expected:** Success message appears
   - **Expected:** Redirects to pending approval page

8. **Check provider status**
   - Navigate to: `/provider-profile`
   - **Expected:** Status shows "PENDING_APPROVAL"
   - **Expected:** Message: "Your application is under review"

### ✅ Pass Criteria:
- [ ] Registration form submitted successfully
- [ ] Provider record created in database
- [ ] Status is PENDING_APPROVAL
- [ ] All documents uploaded
- [ ] No validation errors

---

## Test 1.3: Admin Approval of Provider

**Objective:** Approve provider using admin account

### Steps:

1. **Sign out of provider account**
   - Click: User menu → "Sign out"
   - **Expected:** Redirected to `/login`

2. **Sign in with admin account**
   - Click: "Continue with Google"
   - Use: `info@medbookings.co.za`
   - **Expected:** User promoted to ADMIN role automatically

3. **Navigate to admin panel**
   - URL: `/admin/providers`
   - **Expected:** List of pending providers visible

4. **Find Dr. John Smith**
   - **Expected:** Provider appears in list with status "Pending Approval"

5. **Click "View Details"**
   - **Expected:** Opens provider detail page

6. **Review requirements**
   - Check: All documents uploaded
   - Check: All requirements marked as submitted

7. **Approve all requirements**
   - For each requirement:
     - Click "Approve"
     - **Expected:** Requirement status changes to "APPROVED"

8. **Approve provider**
   - Click: "Approve Provider" button
   - **Expected:** Confirmation modal appears

9. **Confirm approval**
   - Click: "Confirm"
   - **Expected:** Provider status changes to "APPROVED"
   - **Expected:** Success toast appears

10. **Sign out and sign back in as provider**
    - Sign out of admin account
    - Sign in with `provider-test@gmail.com`

11. **Verify provider approved**
    - Navigate to: `/provider-profile`
    - **Expected:** Status shows "APPROVED"
    - **Expected:** Full provider dashboard visible

### ✅ Pass Criteria:
- [ ] Admin can view pending providers
- [ ] All requirements approved successfully
- [ ] Provider status changed to APPROVED
- [ ] Provider can access full dashboard
- [ ] No errors during approval process

---

## Test 1.4: Connect Google Calendar (First Time)

**Objective:** Connect provider's Google Calendar using OAuth

### Steps:

1. **Navigate to provider profile**
   - URL: `/provider-profile`
   - **Expected:** Provider dashboard loads

2. **Locate Calendar Sync section**
   - Scroll to: "Calendar Sync" card
   - **Expected:** Shows "Not connected" state
   - **Expected:** "Connect Google Calendar" button visible

3. **Click "Connect Google Calendar"**
   - **Expected:** Redirects to Google OAuth consent screen

4. **Select Google account**
   - Use: Same account as provider login (`provider-test@gmail.com`)
   - **Expected:** Google shows requested permissions:
     - View and edit events on all calendars
     - Create, edit, and delete events
     - See and download calendars

5. **Grant all permissions**
   - Click: "Allow"
   - **Expected:** Redirects back to `/provider-profile`

6. **Verify connection success**
   - **Expected:** Calendar Sync section shows:
     - ✅ Connected status badge
     - Email: `provider-test@gmail.com`
     - Last Synced: "Never" or recent timestamp
     - Total Operations: 0 or 1
     - Success Rate: N/A or 100%
     - Sync Status: "Active"

7. **Check integration settings**
   - **Expected:** Settings section shows:
     - Sync Direction: Bidirectional
     - Background Sync: Enabled
     - Auto Meet Links: Enabled
     - Sync Interval: 15 minutes

8. **Check recent sync operations table**
   - **Expected:** Table appears (may be empty or show initial sync)
   - **Expected:** Columns: Type, Status, Started, Duration, Events Processed

9. **Check database**
   - Open: Database tool (Prisma Studio or pgAdmin)
   - Table: `CalendarIntegration`
   - **Expected:** 1 row for provider with valid access token

10. **Check console**
    - Open: Browser DevTools → Console
    - **Expected:** No errors
    - **Expected:** May see success logs

### ✅ Pass Criteria:
- [ ] OAuth flow completed successfully
- [ ] Calendar integration created in database
- [ ] UI shows "Connected" status
- [ ] Access token and refresh token stored
- [ ] Sync settings configured correctly
- [ ] No console errors

---

## Test 1.5: Manual Sync - Incremental

**Objective:** Trigger manual incremental sync and verify event processing

### Steps:

1. **Create test event in Google Calendar**
   - Open: Google Calendar (`calendar.google.com`)
   - Sign in: `provider-test@gmail.com`
   - Create event:
     - Title: "Test Consultation 1"
     - Date: Tomorrow
     - Time: 2:00 PM - 3:00 PM
     - Save event

2. **Return to MedBookings**
   - Navigate to: `/provider-profile`
   - Scroll to: Calendar Sync section

3. **Click "Sync Now"**
   - Location: Blue button with sync icon
   - **Expected:** Button shows spinner and text changes to "Syncing..."
   - **Expected:** Button disabled during sync

4. **Watch Recent Sync Operations table**
   - **Expected:** New row appears immediately with:
     - Type: "INCREMENTAL_SYNC" or "MANUAL_SYNC"
     - Status: "In Progress" (blue badge)
     - Started: Current timestamp
     - Duration: "0s"
     - Events Processed: "-"

5. **Wait for sync completion** (5-10 seconds)
   - **Expected:** Row updates in real-time:
     - Status: "Success" (green badge)
     - Duration: "3s" (or actual duration)
     - Events Processed: "1"

6. **Check sync statistics**
   - **Expected:** Statistics update:
     - Last Synced: Just now (e.g., "2 seconds ago")
     - Total Operations: 1 (or incremented)
     - Success Rate: 100%

7. **Check toast notification**
   - **Expected:** Success toast appears:
     - Title: "Sync Completed"
     - Message: "Successfully processed 1 events"

8. **Verify no errors**
   - Check: Browser console
   - **Expected:** No error messages
   - **Expected:** Network tab shows successful API calls

9. **Check database**
   - Table: `CalendarSyncOperation`
   - **Expected:** 1 row with:
     - operationType: INCREMENTAL_SYNC or MANUAL_SYNC
     - status: SUCCESS
     - eventsProcessed: 1
     - errorMessage: NULL

   - Table: `CalendarEvent`
   - **Expected:** 1 row with:
     - title: "Test Consultation 1"
     - startTime: Tomorrow 2 PM
     - externalEventId: Google Calendar event ID

### ✅ Pass Criteria:
- [ ] Sync triggered successfully
- [ ] UI shows "In Progress" state
- [ ] Sync completes within 10 seconds
- [ ] Event imported from Google Calendar
- [ ] Statistics updated correctly
- [ ] Success toast displayed
- [ ] Database records created
- [ ] No errors in console

---

## Test 1.6: Manual Sync - Full Sync

**Objective:** Trigger full sync and verify all events imported

### Steps:

1. **Create multiple events in Google Calendar**
   - Create 3 more events:
     - **Event 2:** "Patient Meeting" (Tomorrow, 4 PM - 5 PM)
     - **Event 3:** "Team Review" (Day after tomorrow, 10 AM - 11 AM)
     - **Event 4:** "Conference Call" (Day after tomorrow, 3 PM - 4 PM)

2. **Open sync dropdown**
   - Navigate to: `/provider-profile` → Calendar Sync
   - Click: Dropdown arrow next to "Sync Now" button
   - **Expected:** Dropdown menu appears with options:
     - "Incremental Sync"
     - "Full Sync"

3. **Select "Full Sync"**
   - Click: "Full Sync" option
   - **Expected:** Confirmation dialog appears

4. **Confirm full sync**
   - Dialog text: "This will fetch all events from your Google Calendar. Continue?"
   - Click: "Confirm"
   - **Expected:** Dialog closes, sync starts

5. **Watch sync progress**
   - **Expected:** "Syncing..." indicator appears
   - **Expected:** New operation row in table:
     - Type: "FULL_SYNC"
     - Status: "In Progress"

6. **Wait for completion** (10-30 seconds depending on calendar size)
   - **Expected:** Status changes to "Success"
   - **Expected:** Events Processed: 4 (total events from calendar)

7. **Verify statistics**
   - **Expected:** Total Operations: Incremented
   - **Expected:** Success Rate: Still 100%
   - **Expected:** Last Synced: Just now

8. **Check database**
   - Table: `CalendarEvent`
   - **Expected:** 4 events total (all events from Google Calendar)
   - **Expected:** Each event has:
     - Correct title
     - Correct start/end times
     - Valid externalEventId

### ✅ Pass Criteria:
- [ ] Full sync initiated from dropdown
- [ ] Confirmation dialog displayed
- [ ] All events imported successfully
- [ ] Statistics reflect full sync
- [ ] Database contains all 4 events
- [ ] No duplicate events created
- [ ] No errors

---

## Test 1.7: Background Sync (Automatic)

**Objective:** Verify automatic background sync triggers after interval

### Steps:

1. **Check current sync settings**
   - Navigate to: `/provider-profile` → Calendar Sync
   - **Expected:** Sync Interval: 15 minutes
   - **Expected:** Background Sync: Enabled

2. **Note current sync time**
   - Check: "Last Synced" timestamp
   - Write down: Current time

3. **Create new event in Google Calendar**
   - Title: "Auto Sync Test"
   - Date: Tomorrow
   - Time: 5 PM - 6 PM

4. **Wait 15-20 minutes** (or adjust sync interval in database for faster testing)
   - ⏰ **Note:** This is the actual sync interval wait time
   - Optional: Reduce interval temporarily in database:
     ```sql
     UPDATE "CalendarIntegration"
     SET "syncIntervalMinutes" = 1
     WHERE "providerId" = 'your-provider-id';
     ```

5. **Refresh provider profile page**
   - URL: `/provider-profile`
   - **Expected:** "Last Synced" timestamp updated
   - **Expected:** New operation in table with type "BACKGROUND_SYNC"

6. **Verify new event imported**
   - Check: Database `CalendarEvent` table
   - **Expected:** "Auto Sync Test" event present

7. **Restore sync interval** (if changed)
   ```sql
   UPDATE "CalendarIntegration"
   SET "syncIntervalMinutes" = 15
   WHERE "providerId" = 'your-provider-id';
   ```

### ✅ Pass Criteria:
- [ ] Background sync triggered automatically
- [ ] New event imported without manual action
- [ ] Sync operation recorded as BACKGROUND_SYNC
- [ ] No errors during automatic sync
- [ ] Sync interval respected

**Note:** Due to 15-minute wait time, this test can be skipped for quick testing or interval can be temporarily reduced.

---

## Test 1.8: Disconnect Google Calendar

**Objective:** Disconnect calendar integration with type-to-confirm flow

### Steps:

1. **Navigate to Calendar Sync section**
   - URL: `/provider-profile`
   - Scroll to: "Calendar Sync" card

2. **Open disconnect options**
   - Click: Dropdown arrow next to "Sync Now"
   - **Expected:** Menu appears with "Disconnect" option (red text)

3. **Click "Disconnect"**
   - **Expected:** Type-to-confirm modal appears
   - Modal title: "Disconnect Google Calendar"
   - Modal description: Warning about losing sync

4. **Read warning message**
   - **Expected:** Modal explains:
     - Sync will stop immediately
     - Historical data will be preserved
     - Can reconnect later
     - Type "DISCONNECT" to confirm

5. **Type incorrect text** (test validation)
   - Input field: Type "disconnect" (lowercase)
   - Click: "Disconnect Calendar" button
   - **Expected:** Button stays disabled OR error message shows

6. **Type correct text**
   - Clear field
   - Type: "DISCONNECT" (all caps)
   - **Expected:** "Disconnect Calendar" button becomes enabled

7. **Click "Disconnect Calendar"**
   - **Expected:** Modal closes
   - **Expected:** API call executes

8. **Verify disconnection**
   - **Expected:** Calendar Sync section shows:
     - "Not connected" state
     - "Connect Google Calendar" button visible
     - Previous statistics hidden or grayed out
     - Historical sync operations still visible (archived)

9. **Check database**
   - Table: `CalendarIntegration`
   - **Expected:** Row deleted OR syncEnabled set to false

10. **Verify no errors**
    - Check: Browser console
    - **Expected:** No errors
    - **Expected:** Success toast: "Calendar disconnected successfully"

### ✅ Pass Criteria:
- [ ] Disconnect button accessible from dropdown
- [ ] Type-to-confirm modal displays
- [ ] Validation prevents incorrect input
- [ ] Typing "DISCONNECT" enables button
- [ ] Disconnection executes successfully
- [ ] UI updates to show "Not connected"
- [ ] Historical data preserved
- [ ] Database integration removed
- [ ] No errors

---

# Part 2: Organization Calendar Sync Flow

## Test 2.1: Create Organization

**Objective:** Create new organization with multiple locations

### Steps:

1. **Sign in with second test account**
   - Sign out of provider account
   - Sign in with: `org-owner-test@gmail.com`

2. **Navigate to organization creation**
   - URL: `/organizations/new`
   - OR find: "Create Organization" button

3. **Fill in organization details**
   - **Organization Name:** Acme Medical Clinic
   - **Description:** Full-service medical practice
   - **Email:** contact@acme-medical.test
   - **Phone:** +27215551234
   - **Website:** https://acme-medical.example.com

4. **Upload organization logo** (optional)
   - Upload: Company logo image

5. **Submit organization**
   - Click: "Create Organization"
   - **Expected:** Organization created
   - **Expected:** Redirects to organization dashboard

6. **Add first location**
   - Click: "Add Location"
   - **Location 1:**
     - Name: Downtown Clinic
     - Address: 123 Main Street, Cape Town City Centre, Cape Town, 8001
     - Phone: +27215551235
     - Email: downtown@acme-medical.test

7. **Add second location**
   - Click: "Add Location"
   - **Location 2:**
     - Name: Westside Clinic
     - Address: 456 Beach Road, Sea Point, Cape Town, 8005
     - Phone: +27215551236
     - Email: westside@acme-medical.test

8. **Submit for approval**
   - Click: "Submit for Approval"
   - **Expected:** Organization status: PENDING_APPROVAL

### ✅ Pass Criteria:
- [ ] Organization created successfully
- [ ] 2 locations added
- [ ] Organization awaiting approval
- [ ] Database records created

---

## Test 2.2: Admin Approval of Organization

**Objective:** Approve organization using admin account

### Steps:

1. **Sign in as admin**
   - Sign out of organization owner account
   - Sign in with: `info@medbookings.co.za`

2. **Navigate to admin panel**
   - URL: `/admin/organizations`
   - **Expected:** List of pending organizations

3. **Find Acme Medical Clinic**
   - **Expected:** Organization in list with status "Pending Approval"

4. **Click "View Details"**
   - **Expected:** Organization detail page

5. **Review details**
   - Check: All required information present
   - Check: Locations created

6. **Approve organization**
   - Click: "Approve Organization"
   - **Expected:** Confirmation modal
   - Click: "Confirm"
   - **Expected:** Status changes to "APPROVED"

7. **Sign back in as organization owner**
   - Sign out of admin
   - Sign in with: `org-owner-test@gmail.com`

8. **Verify approval**
   - Navigate to: Organization dashboard
   - **Expected:** Status shows "APPROVED"
   - **Expected:** Full dashboard accessible

### ✅ Pass Criteria:
- [ ] Admin can view pending organizations
- [ ] Organization approved successfully
- [ ] Status changed to APPROVED
- [ ] Owner can access full features

---

## Test 2.3: Connect Organization-Wide Calendar

**Objective:** Connect Google Calendar at organization level

### Steps:

1. **Navigate to organization calendar management**
   - Find organization ID from URL or dashboard
   - URL: `/organizations/[org-id]/manage-calendar`
   - **Expected:** Calendar management page loads

2. **Verify location selector**
   - **Expected:** Dropdown visible with options:
     - "All Locations" (organization-wide)
     - "Downtown Clinic"
     - "Westside Clinic"

3. **Select "All Locations"**
   - Default: Should already be selected
   - **Expected:** Shows organization-wide integration status

4. **Click "Connect Google Calendar"**
   - **Expected:** Redirects to Google OAuth

5. **Grant permissions**
   - Select: `org-owner-test@gmail.com`
   - Click: "Allow"
   - **Expected:** Redirects back

6. **Verify connection**
   - **Expected:** Shows:
     - Connected email: `org-owner-test@gmail.com`
     - Status: "Active"
     - Last Synced: Recent or "Never"
     - Sync Settings visible

7. **Check database**
   - Table: `OrganizationCalendarIntegration`
   - **Expected:** 1 row with:
     - organizationId: Valid UUID
     - locationId: NULL (org-wide)
     - syncEnabled: true

### ✅ Pass Criteria:
- [ ] Organization calendar page accessible
- [ ] Location selector displays correctly
- [ ] OAuth flow works for organization
- [ ] Organization-wide integration created
- [ ] Database record correct (locationId NULL)

---

## Test 2.4: Connect Location-Specific Calendar

**Objective:** Connect separate calendar for specific location

### Steps:

1. **Stay on calendar management page**
   - URL: `/organizations/[org-id]/manage-calendar`

2. **Select "Downtown Clinic" from dropdown**
   - **Expected:** View updates to show Downtown status
   - **Expected:** Shows "Not connected" (no integration yet)

3. **Click "Connect Google Calendar"**
   - **Expected:** OAuth flow starts

4. **Grant permissions**
   - Use: Same or different Google account
   - **Expected:** Redirects back

5. **Verify Downtown connection**
   - **Expected:** Downtown Clinic shows:
     - Connected status
     - Email address
     - Separate sync statistics from org-wide

6. **Switch to "Westside Clinic"**
   - Select: "Westside Clinic" from dropdown
   - **Expected:** Shows "Not connected"
   - Note: We'll leave this one disconnected for testing

7. **Switch back to "All Locations"**
   - **Expected:** Shows org-wide integration
   - **Expected:** Location-specific integrations separate

8. **Check database**
   - Table: `OrganizationCalendarIntegration`
   - **Expected:** 2 rows total:
     - Row 1: organizationId + locationId NULL (org-wide)
     - Row 2: organizationId + locationId for Downtown

### ✅ Pass Criteria:
- [ ] Location selector switches views
- [ ] Location-specific calendar connected
- [ ] Separate integration created per location
- [ ] Database has 2 rows (org-wide + Downtown)
- [ ] Westside remains disconnected

---

## Test 2.5: Organization Manual Sync

**Objective:** Trigger sync for organization calendar

### Steps:

1. **Create event in organization Google account**
   - Open: Google Calendar
   - Sign in: `org-owner-test@gmail.com`
   - Create:
     - Title: "Staff Meeting"
     - Date: Tomorrow
     - Time: 9 AM - 10 AM

2. **Return to MedBookings**
   - URL: `/organizations/[org-id]/manage-calendar`
   - Select: "All Locations"

3. **Click "Sync Now"**
   - **Expected:** Sync starts
   - **Expected:** Recent operations table shows new row

4. **Wait for completion**
   - **Expected:** Status changes to "Success"
   - **Expected:** 1 event processed

5. **Switch to Downtown Clinic**
   - Select: "Downtown Clinic" from dropdown
   - Create event in Downtown Google account
   - Trigger sync for Downtown
   - **Expected:** Downtown sync independent from org-wide sync

6. **Verify separate statistics**
   - **Expected:** "All Locations" has different stats than "Downtown Clinic"
   - **Expected:** Each maintains separate sync history

### ✅ Pass Criteria:
- [ ] Organization sync works
- [ ] Location-specific sync works
- [ ] Statistics tracked separately per location
- [ ] Events imported correctly
- [ ] No cross-contamination between locations

---

## Test 2.6: Organization Disconnect Flow

**Objective:** Disconnect organization calendar with confirmation

### Steps:

1. **Navigate to calendar management**
   - URL: `/organizations/[org-id]/manage-calendar`
   - Select: "All Locations"

2. **Initiate disconnect**
   - Click: Dropdown → "Disconnect"
   - **Expected:** Type-to-confirm modal

3. **Confirm disconnect**
   - Type: "DISCONNECT"
   - Click: "Disconnect Calendar"
   - **Expected:** Success

4. **Verify disconnection**
   - **Expected:** Org-wide shows "Not connected"
   - **Expected:** Downtown Clinic still connected (independent)

5. **Check database**
   - Table: `OrganizationCalendarIntegration`
   - **Expected:** Only 1 row remains (Downtown)
   - **Expected:** Org-wide integration deleted

### ✅ Pass Criteria:
- [ ] Organization disconnect works
- [ ] Type-to-confirm flow executes
- [ ] Location integrations remain independent
- [ ] Database updated correctly

---

# Part 3: Edge Cases & Error Handling

## Test 3.1: Token Refresh Flow

**Objective:** Verify expired access tokens are automatically refreshed

### Steps:

1. **Simulate expired token** (manual database edit)
   ```sql
   UPDATE "CalendarIntegration"
   SET "expiresAt" = NOW() - INTERVAL '1 hour'
   WHERE "providerId" = 'your-provider-id';
   ```

2. **Trigger sync**
   - Navigate to: `/provider-profile`
   - Click: "Sync Now"

3. **Watch network tab**
   - **Expected:** Initial sync request may return 401
   - **Expected:** Automatic retry with refreshed token
   - **Expected:** Sync completes successfully

4. **Check database**
   - Table: `CalendarIntegration`
   - **Expected:** `accessToken` updated (new value)
   - **Expected:** `expiresAt` updated (future date)

### ✅ Pass Criteria:
- [ ] Expired token detected
- [ ] Token refresh triggered automatically
- [ ] New token stored in database
- [ ] Sync completes without user intervention
- [ ] No user-facing errors

---

## Test 3.2: Network Failure Recovery

**Objective:** Test behavior when Google Calendar API is unreachable

### Steps:

1. **Block Google Calendar API** (browser DevTools)
   - Open: DevTools → Network tab
   - Enable: "Offline" mode or block `googleapis.com`

2. **Trigger sync**
   - Click: "Sync Now"
   - **Expected:** Sync starts

3. **Wait for failure**
   - **Expected:** After timeout, sync fails
   - **Expected:** Status shows "Failed"
   - **Expected:** Error toast: "Failed to sync calendar"
   - **Expected:** Error message in sync operation row

4. **Check sync status**
   - **Expected:** Sync Status badge shows "Sync Issues (1 failure)"
   - **Expected:** Failure count incremented

5. **Re-enable network**
   - Disable: Offline mode
   - Unblock: APIs

6. **Retry sync**
   - Click: "Sync Now" again
   - **Expected:** Sync succeeds
   - **Expected:** Failure count resets to 0

### ✅ Pass Criteria:
- [ ] Network failure handled gracefully
- [ ] Error message displayed to user
- [ ] Sync status reflects failure
- [ ] Retry mechanism works
- [ ] No app crashes

---

## Test 3.3: Concurrent Sync Prevention

**Objective:** Ensure only one sync can run at a time per integration

### Steps:

1. **Start first sync**
   - Click: "Sync Now"
   - **Expected:** Sync starts, button shows "Syncing..."

2. **Immediately click "Sync Now" again**
   - **Expected:** Button remains disabled
   - **Expected:** No second sync operation created
   - **Expected:** Toast: "Sync already in progress"

3. **Wait for first sync to complete**
   - **Expected:** Button re-enables after completion

4. **Check database**
   - Table: `CalendarSyncOperation`
   - **Expected:** Only 1 operation with status "IN_PROGRESS" at a time
   - **Expected:** No duplicate operations

### ✅ Pass Criteria:
- [ ] Concurrent syncs prevented
- [ ] Button disabled during sync
- [ ] User feedback provided
- [ ] No race conditions in database

---

## Test 3.4: Revoked Calendar Access

**Objective:** Handle scenario where user revokes calendar access from Google

### Steps:

1. **Revoke access from Google**
   - Navigate to: `https://myaccount.google.com/permissions`
   - Find: MedBookings application
   - Click: "Remove Access"

2. **Return to MedBookings**
   - Navigate to: `/provider-profile`
   - Click: "Sync Now"

3. **Watch for error**
   - **Expected:** Sync fails
   - **Expected:** Error: "Calendar access has been revoked"
   - **Expected:** Toast suggests reconnecting

4. **Check sync status**
   - **Expected:** Status badge shows "Access Revoked" or similar
   - **Expected:** "Reconnect" button appears

5. **Reconnect calendar**
   - Click: "Reconnect"
   - **Expected:** OAuth flow starts
   - Complete flow
   - **Expected:** Integration restored

### ✅ Pass Criteria:
- [ ] Revocation detected
- [ ] Clear error message shown
- [ ] Reconnect flow available
- [ ] User can restore access easily

---

# Part 4: Real-World Scenarios

## Test 4.1: External Event Blocking Availability

**Objective:** Verify external Google Calendar events block availability slots

**Note:** This test requires availability creation feature to be implemented. If not yet available, mark as "SKIPPED - Feature Pending".

### Steps:

1. **Create availability slot**
   - Navigate to: `/availability/create`
   - Create availability:
     - Date: Tomorrow
     - Time: 9 AM - 5 PM
     - Scheduling: ON_THE_HOUR (hourly slots)

2. **Create blocking event in Google Calendar**
   - Open: Google Calendar
   - Create event:
     - Title: "Personal Appointment"
     - Date: Tomorrow
     - Time: 2 PM - 3 PM

3. **Trigger calendar sync**
   - Return to: `/provider-profile`
   - Click: "Sync Now"
   - **Expected:** Event imported

4. **View availability slots**
   - Navigate to: Public booking page or availability calendar
   - **Expected:** 2 PM - 3 PM slot marked as "BLOCKED" or hidden
   - **Expected:** Other hourly slots (9 AM, 10 AM, 11 AM, 1 PM, 3 PM, etc.) available

5. **Delete event from Google Calendar**
   - Delete: "Personal Appointment" event

6. **Sync again**
   - Trigger: Manual sync
   - **Expected:** Slot unblocked and available again

### ✅ Pass Criteria:
- [ ] External event imported
- [ ] Corresponding availability slot blocked
- [ ] Other slots remain available
- [ ] Deleting event unblocks slot
- [ ] Sync bidirectionality works

---

## Test 4.2: Bidirectional Sync Verification

**Objective:** Verify changes sync in both directions (MedBookings ↔ Google)

**Note:** Requires booking functionality. Skip if not implemented.

### Steps:

1. **Create booking in MedBookings**
   - Book appointment through MedBookings UI
   - Details:
     - Provider: Dr. John Smith
     - Date/Time: Tomorrow, 3 PM
     - Service: General GP Consult

2. **Wait for background sync** (or trigger manual sync)
   - **Expected:** Booking appears in Google Calendar

3. **Verify event in Google Calendar**
   - Open: Google Calendar
   - **Expected:** Event visible with:
     - Title: "Booking: General GP Consult"
     - Time: Tomorrow, 3 PM
     - Description: Patient details (if permitted)

4. **Modify event in Google Calendar**
   - Edit event: Change time to 3:30 PM
   - Save changes

5. **Sync MedBookings**
   - Trigger: Manual sync
   - **Expected:** Booking time updated in MedBookings
   - **Expected:** Notification sent to patient about time change

6. **Cancel booking in MedBookings**
   - Cancel appointment

7. **Sync and verify deletion**
   - **Expected:** Event removed from Google Calendar

### ✅ Pass Criteria:
- [ ] Bookings created in MedBookings appear in Google
- [ ] Changes in Google sync back to MedBookings
- [ ] Cancellations sync correctly
- [ ] No sync conflicts or data loss

---

## Test 4.3: Multi-Calendar Support

**Objective:** Test provider with multiple Google Calendars

### Steps:

1. **Create secondary calendar in Google**
   - Open: Google Calendar settings
   - Create: New calendar named "Work Schedule"

2. **Connect to MedBookings** (if multi-calendar selection supported)
   - Navigate to: `/provider-profile` → Calendar Sync
   - If supported: Select "Work Schedule" during connection
   - If not supported: Test with primary calendar

3. **Create event in secondary calendar**
   - Title: "Work Event"
   - Time: Tomorrow, 11 AM

4. **Sync and verify**
   - Trigger sync
   - **Expected:** Event imported if multi-calendar supported
   - **Expected:** Clear indication of which calendar is synced

### ✅ Pass Criteria:
- [ ] Multi-calendar support documented
- [ ] User can select which calendar to sync
- [ ] Events from correct calendar imported
- [ ] Clear UI indication of synced calendar

---

# Summary & Reporting

## Test Execution Summary

**Date Tested:** _______________
**Tester Name:** _______________
**Environment:** Local Development / Staging / Production
**Browser:** Chrome / Firefox / Safari / Edge
**Version:** _______________

### Results

| Section | Total Tests | Passed | Failed | Skipped |
|---------|-------------|--------|--------|---------|
| Part 1: Provider Flow | 8 | ___ | ___ | ___ |
| Part 2: Organization Flow | 6 | ___ | ___ | ___ |
| Part 3: Edge Cases | 4 | ___ | ___ | ___ |
| Part 4: Real-World Scenarios | 3 | ___ | ___ | ___ |
| **Total** | **21** | **___** | **___** | **___** |

### Critical Issues Found

1. **Issue #1:**
   - Test: _______________
   - Description: _______________
   - Severity: Critical / High / Medium / Low
   - Steps to Reproduce: _______________

2. **Issue #2:**
   - Test: _______________
   - Description: _______________
   - Severity: Critical / High / Medium / Low
   - Steps to Reproduce: _______________

### Recommendations

- [ ] Ready for production deployment
- [ ] Requires bug fixes before deployment
- [ ] Requires additional testing
- [ ] Requires feature enhancements

### Notes

_______________
_______________
_______________

---

## Appendix A: Test Data Cleanup

After completing all tests, clean up test data:

```sql
-- Delete test calendar integrations
DELETE FROM "CalendarIntegration" WHERE "googleEmail" LIKE '%test%';
DELETE FROM "OrganizationCalendarIntegration" WHERE "googleEmail" LIKE '%test%';

-- Delete test providers
DELETE FROM "Provider" WHERE "email" LIKE '%test%';

-- Delete test organizations
DELETE FROM "Organization" WHERE "name" LIKE '%Test%' OR "name" LIKE '%Acme%';

-- Delete test users
DELETE FROM "User" WHERE "email" LIKE '%test%';

-- Or reset entire database
-- npx prisma migrate reset --force
```

---

## Appendix B: Common Issues & Solutions

### Issue: OAuth Redirect Error

**Symptom:** "redirect_uri_mismatch" error during Google OAuth
**Solution:**
1. Check `.env` → `GOOGLE_REDIRECT_URI` matches Google Console
2. Verify Google Console → Authorized redirect URIs includes `http://localhost:3000/api/auth/callback/google`

### Issue: Access Token Expired

**Symptom:** Sync fails with "invalid_grant" error
**Solution:**
1. Check database `CalendarIntegration.expiresAt`
2. If expired, manually trigger sync to refresh token
3. If refresh fails, disconnect and reconnect calendar

### Issue: Events Not Syncing

**Symptom:** Manual sync succeeds but no events imported
**Solution:**
1. Check date range → Events must be within 90-day window
2. Verify calendar permissions granted during OAuth
3. Check Google Calendar directly → Ensure events exist
4. Review sync operation logs for error details

### Issue: Sync Status Stuck "In Progress"

**Symptom:** Sync operation never completes
**Solution:**
1. Check browser console for JavaScript errors
2. Verify API endpoint responding (Network tab)
3. Check database → Update operation status manually if needed:
   ```sql
   UPDATE "CalendarSyncOperation"
   SET status = 'FAILED', "errorMessage" = 'Timeout'
   WHERE status = 'IN_PROGRESS' AND "startedAt" < NOW() - INTERVAL '5 minutes';
   ```

---

## Appendix C: Database Inspection Queries

Quick queries for verifying test results:

```sql
-- Check calendar integrations
SELECT
  "id",
  "providerId",
  "googleEmail",
  "syncEnabled",
  "lastSyncedAt",
  "syncFailureCount"
FROM "CalendarIntegration";

-- Check sync operations
SELECT
  "id",
  "operationType",
  "status",
  "eventsProcessed",
  "startedAt",
  "completedAt",
  "errorMessage"
FROM "CalendarSyncOperation"
ORDER BY "startedAt" DESC
LIMIT 10;

-- Check imported events
SELECT
  "id",
  "title",
  "startTime",
  "endTime",
  "externalEventId"
FROM "CalendarEvent"
ORDER BY "startTime" DESC
LIMIT 10;

-- Check organization integrations
SELECT
  "id",
  "organizationId",
  "locationId",
  "googleEmail",
  "syncEnabled"
FROM "OrganizationCalendarIntegration";
```

---

**End of Guide**

**Questions or Issues?**
- Check `/docs/setup/GOOGLE-CLOUD-OAUTH-SETUP.md` for OAuth configuration
- Review `/docs/testing/CALENDAR-SYNC-BROWSER-TESTING-GUIDE.md` for additional test scenarios
- Contact development team for technical support
