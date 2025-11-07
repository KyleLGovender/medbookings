# Calendar Sync Browser Testing Guide

## Overview

This guide provides comprehensive **regression testing and technical validation** scenarios for the Google Calendar integration feature. Use this checklist for **pre-deployment verification**, **security validation**, and **edge case testing**.

**Target Audience:** Experienced QA engineers, senior developers, DevOps

**Testing Approach:** Seed data-based (reproducible state, fast setup)

**For complete end-to-end testing with fresh accounts and step-by-step user journey, see:**
📘 [`/docs/testing/REAL-WORLD-CALENDAR-TESTING-GUIDE.md`](/docs/testing/REAL-WORLD-CALENDAR-TESTING-GUIDE.md)

**Testing Environment:**
- Local development: `npm run dev`
- Test database with seed data
- Two Google accounts (one for provider, one for organization)
- Multiple browser tabs for testing real-time updates

---

## Prerequisites

Before starting tests:
1. ✅ Start local development server: `npm run dev`
2. ✅ Ensure database is running and seeded
3. ✅ Have Google Calendar OAuth credentials configured
4. ✅ Prepare 2 test Google accounts
5. ✅ Open browser DevTools (Network, Console tabs)

---

## Section 1: Provider - Initial OAuth Connection

### Test 1.1: Fresh Provider Connection
**Description:** Connect Google Calendar to a provider account that has never been connected before

**Steps:**
1. Navigate to `/provider-profile`
2. Click "Overview" tab
3. Scroll to "Calendar Sync" section
4. Verify "Connect Google Calendar" button is visible
5. Click "Connect Google Calendar"
6. **Expected:** Redirects to Google OAuth consent screen
7. Select test Google account
8. Grant all requested permissions (Calendar, Events, Meet, etc.)
9. **Expected:** Redirects back to `/profile/service-provider/view`
10. **Expected:** Calendar Sync section now shows "Connected" status with email
11. **Expected:** Sync statistics show "Never" for last sync

**Pass/Fail:** ☐

---

### Test 1.2: OAuth Scope Denial
**Description:** Test behavior when user denies required scopes

**Steps:**
1. Log out and create new provider account
2. Navigate to `/provider-profile` → Calendar Sync
3. Click "Connect Google Calendar"
4. On Google consent screen, click "Deny" or "Cancel"
5. **Expected:** Redirects back without error
6. **Expected:** Still shows "Connect Google Calendar" button
7. **Expected:** No error toast or console errors

**Pass/Fail:** ☐

---

### Test 1.3: Re-connection After Previous Integration
**Description:** Connect calendar to provider who previously disconnected

**Steps:**
1. Connect calendar (Test 1.1)
2. Disconnect calendar (follow Section 3 steps)
3. Click "Connect Google Calendar" again
4. **Expected:** Goes through OAuth flow again
5. **Expected:** Successfully reconnects
6. **Expected:** Historical sync operations from previous connection are still visible

**Pass/Fail:** ☐

---

## Section 2: Provider - Sync Operations

### Test 2.1: Manual Incremental Sync
**Description:** Trigger incremental sync and verify real-time updates

**Steps:**
1. Ensure provider calendar is connected
2. In Google Calendar (separate tab), create an event for tomorrow 2PM-3PM
3. Return to MedBookings Calendar Sync dashboard
4. Click "Sync Now" (default is incremental)
5. **Expected:** Button shows spinner "Syncing..."
6. Watch "Recent Sync Operations" table
7. **Expected:** New row appears with Status="In Progress"
8. **Expected:** Within 5-10 seconds, status updates to "Success"
9. **Expected:** Success toast: "Sync Completed. Successfully processed X events"
10. **Expected:** Last Synced timestamp updates
11. **Expected:** Events Processed count increases

**Pass/Fail:** ☐

---

### Test 2.2: Manual Full Sync (90-Day Window)
**Description:** Trigger full sync with 90-day lookback

**Steps:**
1. Click dropdown arrow on "Sync Now" button
2. Select "Full Sync (Last 90 Days)"
3. **Expected:** Modal/dropdown closes
4. **Expected:** Sync begins immediately
5. **Expected:** Full sync takes longer than incremental (5-15 seconds)
6. **Expected:** Events Processed count higher than incremental
7. Check "Recent Sync Operations" table
8. **Expected:** Operation Type shows "FULL_SYNC"

**Pass/Fail:** ☐

---

### Test 2.3: Event Blocks Availability
**Description:** Verify external calendar events block provider slots

**Pre-test Setup:**
- Provider has availability created for tomorrow 9AM-5PM (30-min slots)

**Steps:**
1. In Google Calendar, create event tomorrow 10AM-11AM ("Dentist Appointment")
2. In MedBookings, trigger incremental sync
3. Navigate to provider's availability management page
4. **Expected:** 10:00 AM and 10:30 AM slots show as "BLOCKED"
5. **Expected:** Tooltip/reason shows "Blocked by calendar event"
6. Try to manually book blocked slot
7. **Expected:** Booking attempt fails with "Slot unavailable"

**Pass/Fail:** ☐

---

### Test 2.4: Real-Time Dashboard Updates
**Description:** Verify 5-second auto-refresh works

**Steps:**
1. Open provider profile in two browser tabs (Tab A, Tab B)
2. In Tab A, trigger manual sync
3. Switch to Tab B immediately (don't touch it)
4. Watch Tab B's "Recent Sync Operations" table
5. **Expected:** Within 5 seconds, new sync operation appears without manual refresh
6. **Expected:** Status updates from "In Progress" → "Success" automatically

**Pass/Fail:** ☐

---

### Test 2.5: Sync Conflict Detection
**Description:** Test double-booking prevention

**Pre-test Setup:**
- Provider has existing booking tomorrow 2PM-3PM in MedBookings
- Slot is marked as BOOKED

**Steps:**
1. In Google Calendar, create overlapping event tomorrow 2:30PM-3:30PM
2. Trigger sync in MedBookings
3. **Expected:** Sync completes with CONFLICT_DETECTED status OR
4. **Expected:** Conflict modal appears showing:
   - Existing booking (2PM-3PM)
   - External event (2:30PM-3:30PM)
   - Overlap period (2:30PM-3PM)
5. **Expected:** Dashboard shows conflict badge/warning

**Pass/Fail:** ☐

---

## Section 3: Provider - Disconnect Flow

### Test 3.1: Type-to-Confirm Validation
**Description:** Verify type-to-confirm prevents accidental disconnect

**Steps:**
1. In Calendar Sync settings, click "Disconnect" button
2. **Expected:** Modal appears: "Disconnect Calendar Integration"
3. **Expected:** Warning text about slots becoming available
4. **Expected:** Input field: "To confirm, type [Provider Name] below:"
5. **Expected:** "Disconnect" button is DISABLED
6. Type incorrect name: "wrong name"
7. **Expected:** Error text: "Name does not match"
8. **Expected:** "Disconnect" button remains DISABLED
9. Type correct name (case doesn't matter): "dr smith" (if name is "Dr Smith")
10. **Expected:** Error text disappears
11. **Expected:** "Disconnect" button becomes ENABLED

**Pass/Fail:** ☐

---

### Test 3.2: Successful Disconnect
**Description:** Complete disconnect and verify cleanup

**Pre-test Setup:**
- Provider has 3 blocked slots from calendar events

**Steps:**
1. Complete type-to-confirm (type provider name)
2. Click "Disconnect" button
3. **Expected:** Button shows spinner: "Disconnecting..."
4. **Expected:** Network request to `/api/trpc/calendarSync.disconnectProviderCalendar`
5. **Expected:** Success toast: "Calendar Disconnected. X slots are now available."
6. **Expected:** Modal closes automatically
7. **Expected:** Calendar Sync section now shows "Connect Google Calendar" button
8. Navigate to availability page
9. **Expected:** Previously blocked slots are now AVAILABLE
10. Check "Recent Sync Operations" (if still visible)
11. **Expected:** Historical operations are preserved (not deleted)

**Pass/Fail:** ☐

---

### Test 3.3: Google Token Revocation Verification
**Description:** Verify OAuth tokens are revoked with Google

**Steps:**
1. Before disconnect: Note the Google account email connected
2. Disconnect calendar (Test 3.2)
3. Go to Google Account → Security → Third-party apps
4. **Expected:** MedBookings app no longer listed OR shows "No access"
5. Alternative check: In Google Calendar, check if MedBookings events are still creating
6. **Expected:** No new events are created after disconnect

**Pass/Fail:** ☐

---

## Section 4: Organization - Multi-Location Calendar Sync

### Test 4.1: Organization-Wide Connection
**Description:** Connect calendar at organization level (no specific location)

**Steps:**
1. Navigate to `/organizations/{orgId}` as organization owner
2. Scroll to "Calendar Sync" section
3. **Expected:** Location selector shows "All Locations" by default
4. Click "Connect Google Calendar"
5. Complete OAuth flow
6. **Expected:** Redirects to `/organization/{orgId}/settings/calendar`
7. **Expected:** Integration shows as connected for organization-wide

**Pass/Fail:** ☐

---

### Test 4.2: Location-Specific Connection
**Description:** Connect separate calendar for specific location

**Pre-test Setup:**
- Organization has 3 locations: Downtown, Westside, Eastside

**Steps:**
1. In Calendar Sync section, select "Downtown" from location dropdown
2. Click "Connect Google Calendar"
3. **Expected:** OAuth URL includes `locationId={downtown-id}`
4. Use DIFFERENT Google account than org-wide
5. Complete OAuth
6. **Expected:** Redirects to `/organization/{orgId}/locations/{downtown-id}/calendar`
7. Select "Westside" from dropdown
8. **Expected:** Shows "Not Connected" for Westside
9. Select "Downtown" again
10. **Expected:** Shows connected status for Downtown only

**Pass/Fail:** ☐

---

### Test 4.3: Location Selector Filtering
**Description:** Verify sync operations filter by selected location

**Pre-test Setup:**
- Downtown location connected and has sync operations
- Westside location connected with different operations

**Steps:**
1. Select "All Locations" from dropdown
2. **Expected:** Shows combined sync operations from all locations
3. Select "Downtown"
4. **Expected:** Only shows Downtown sync operations
5. **Expected:** Statistics recalculate for Downtown only
6. Select "Westside"
7. **Expected:** Statistics change to reflect Westside data

**Pass/Fail:** ☐

---

### Test 4.4: Bulk Disconnect - Visibility
**Description:** Verify "Disconnect All" button appears correctly

**Steps:**
1. Connect calendar to Organization (org-wide)
2. **Expected:** No "Disconnect All Locations" button (only 1 integration)
3. Connect calendar to Downtown location
4. **Expected:** "Disconnect All Locations" button now appears
5. Connect calendar to Westside location (total 3 integrations)
6. **Expected:** "Disconnect All Locations" button still visible

**Pass/Fail:** ☐

---

### Test 4.5: Bulk Disconnect - Type-to-Confirm
**Description:** Verify bulk disconnect dialog and confirmation

**Pre-test Setup:**
- Organization "Acme Medical Group" has 3 location integrations

**Steps:**
1. Click "Disconnect All Locations" button
2. **Expected:** Modal: "Disconnect All Calendar Integrations"
3. **Expected:** Warning: "This will disconnect ALL 3 location calendar integrations"
4. **Expected:** Scrollable list showing all 3 locations
5. **Expected:** Input: "To confirm, type Acme Medical Group below:"
6. Type organization name correctly
7. **Expected:** Button enabled: "Disconnect All 3 Locations"
8. Click disconnect
9. **Expected:** Button shows: "Disconnecting All..."
10. **Expected:** Success toast: "Disconnected 3 locations. X slots are now available."
11. **Expected:** All locations show "Not Connected"

**Pass/Fail:** ☐

---

## Section 5: Edge Cases & Error Handling

### Test 5.1: Expired OAuth Token Auto-Refresh
**Description:** Verify tokens refresh automatically before expiry

**Setup (Manual):**
- In database, update `CalendarIntegration.expiresAt` to 2 minutes from now

**Steps:**
1. Wait 3 minutes (token should be expired)
2. Trigger manual sync
3. **Expected:** Sync succeeds without error
4. Check browser console logs
5. **Expected:** Log message: "Refreshing Google Calendar access token"
6. Check database: `CalendarIntegration.expiresAt`
7. **Expected:** Updated to new future timestamp

**Pass/Fail:** ☐

---

### Test 5.2: Network Failure During Sync
**Description:** Test behavior when Google Calendar API is unreachable

**Setup:**
- Disconnect internet OR use browser DevTools to simulate offline

**Steps:**
1. Trigger manual sync
2. **Expected:** Sync operation starts (Status: IN_PROGRESS)
3. **Expected:** After timeout (30-60 seconds), status updates to FAILED
4. **Expected:** Error toast: "Sync Failed. Failed to sync calendar"
5. **Expected:** `syncFailureCount` increments in integration record
6. Reconnect internet
7. Trigger sync again
8. **Expected:** Sync succeeds, `syncFailureCount` resets to 0

**Pass/Fail:** ☐

---

### Test 5.3: Concurrent Bookings (Race Condition)
**Description:** Verify slot locking prevents double-booking

**Setup (Requires 2 Users):**
- User A and User B both viewing same available slot (tomorrow 2PM)
- Slot has 1 opening

**Steps:**
1. User A: Click "Book Now" for 2PM slot
2. User B: Immediately click "Book Now" for same 2PM slot (within 1 second)
3. **Expected:** One user succeeds, other gets error
4. **Expected:** Error message: "Slot unavailable" or "Already booked"
5. **Expected:** Database shows only ONE booking for that slot
6. **Expected:** Slot status = BOOKED (not duplicated)

**Pass/Fail:** ☐

---

### Test 5.4: Permission Denied (Non-Owner Access)
**Description:** Verify authorization checks prevent unauthorized access

**Setup:**
- User A is organization OWNER
- User B is organization MEMBER (not owner)

**Steps:**
1. As User B, navigate to `/organizations/{orgId}`
2. **Expected:** Calendar Sync section is NOT visible (owner-only)
3. As User B, manually navigate to `/organizations/{orgId}/settings/calendar`
4. **Expected:** 403 Forbidden OR redirect to profile
5. As User B, attempt API call: `api.calendarSync.disconnectOrganizationCalendar`
6. **Expected:** tRPC error: "Organization admin or owner access required"

**Pass/Fail:** ☐

---

### Test 5.5: Invalid Sync Token Recovery
**Description:** Test recovery from corrupted sync token

**Setup:**
- In database, set `CalendarIntegration.nextSyncToken = "invalid_token_123"`

**Steps:**
1. Trigger incremental sync
2. **Expected:** Sync fails with specific error
3. **Expected:** Error message: "Sync token invalid - please run FULL_SYNC"
4. Open sync button dropdown, select "Full Sync"
5. **Expected:** Full sync succeeds
6. **Expected:** New valid sync token stored
7. Trigger incremental sync again
8. **Expected:** Now succeeds with valid token

**Pass/Fail:** ☐

---

## Section 6: Performance & Real-Time Testing

### Test 6.1: Dashboard Performance with 100+ Operations
**Description:** Verify table pagination and performance

**Setup:**
- Use database seed script to create 150 sync operations for provider

**Steps:**
1. Navigate to provider Calendar Sync dashboard
2. **Expected:** "Recent Sync Operations" table shows 20 rows (paginated)
3. Scroll table
4. **Expected:** Smooth scrolling, no lag
5. **Expected:** Statistics calculate correctly even with 150 operations
6. Trigger new sync
7. **Expected:** New operation appears at top, oldest disappears from view

**Pass/Fail:** ☐

---

### Test 6.2: Multiple Browser Tabs Sync
**Description:** Verify real-time updates across tabs

**Steps:**
1. Open provider profile in 3 browser tabs (Tab A, B, C)
2. In Tab A, trigger manual sync
3. **Expected:** Within 5 seconds:
   - Tab B shows new sync operation (auto-refresh)
   - Tab C shows new sync operation (auto-refresh)
4. In Tab B, disconnect calendar
5. **Expected:** Within 5 seconds:
   - Tab A shows "Connect" button (integration removed)
   - Tab C shows "Connect" button

**Pass/Fail:** ☐

---

### Test 6.3: Slow Network Conditions
**Description:** Test UI responsiveness during slow network

**Setup:**
- Browser DevTools → Network → Set throttling to "Slow 3G"

**Steps:**
1. Trigger manual sync
2. **Expected:** Spinner shows immediately
3. **Expected:** UI remains responsive (can click other tabs)
4. **Expected:** Sync completes within 60 seconds
5. **Expected:** No UI freezing or unresponsive behavior

**Pass/Fail:** ☐

---

## Section 7: Security Testing

### Test 7.1: CSRF Protection
**Description:** Verify CSRF tokens on OAuth callback

**Steps:**
1. Start OAuth flow, get redirected to Google
2. In browser DevTools, inspect OAuth redirect URL
3. **Expected:** URL contains `state=` parameter with encoded data
4. After OAuth approval, check callback request
5. **Expected:** Callback validates `state` parameter
6. Manually craft callback with invalid state: `/api/auth/google/calendar/callback?code=xyz&state=invalid`
7. **Expected:** Returns 403 Forbidden or 400 Bad Request

**Pass/Fail:** ☐

---

### Test 7.2: No Tokens in Browser
**Description:** Verify OAuth tokens are never exposed to client

**Steps:**
1. Complete OAuth flow and connection
2. Open browser DevTools → Network tab
3. Filter for "calendarSync" requests
4. Inspect all request/response payloads
5. **Expected:** NO `accessToken` or `refreshToken` in any response
6. Open browser DevTools → Application → LocalStorage / SessionStorage
7. **Expected:** NO tokens stored in browser storage
8. Open React DevTools → Components → ProviderCalendarSyncDashboard
9. **Expected:** Props/state do NOT contain tokens

**Pass/Fail:** ☐

---

### Test 7.3: Authorization Checks on tRPC Procedures
**Description:** Verify all calendar sync procedures check ownership

**Setup:**
- Provider A: id=provider-123
- Provider B: id=provider-456

**Steps:**
1. As Provider A, get JWT token (from DevTools → Application → Cookies)
2. Use API client (e.g., Postman) with Provider A's token
3. Attempt to sync Provider B's calendar:
   ```
   POST /api/trpc/calendarSync.syncGoogleCalendar
   { "providerId": "provider-456" }
   ```
4. **Expected:** 403 Forbidden: "Not authorized to sync this provider calendar"
5. Repeat for disconnect, getSyncStatus procedures
6. **Expected:** All return 403 when accessing other provider's data

**Pass/Fail:** ☐

---

## Section 8: Export & Booking Integration

### Test 8.1: Booking Exports to Google Calendar
**Description:** Verify MedBookings bookings create Google Calendar events

**Steps:**
1. Ensure provider has calendar connected
2. As client, book appointment for tomorrow 3PM
3. Booking status changes to CONFIRMED
4. **Expected:** Background job triggers export
5. Check provider's Google Calendar (separate browser tab)
6. **Expected:** New event created: "MedBookings: [Service Name]"
7. **Expected:** Event time matches booking (3PM-4PM)
8. **Expected:** Event includes client name, booking details
9. **Expected:** If booking is online, event has Google Meet link

**Pass/Fail:** ☐

---

### Test 8.2: Booking Cancellation Deletes Event
**Description:** Verify cancelled bookings remove Google Calendar events

**Pre-test Setup:**
- Booking exists and has been exported to Google Calendar

**Steps:**
1. As client or provider, cancel the booking
2. Booking status changes to CANCELLED
3. **Expected:** Background job triggers event deletion
4. Refresh provider's Google Calendar
5. **Expected:** Event is removed from Google Calendar
6. **Expected:** Slot becomes AVAILABLE again in MedBookings

**Pass/Fail:** ☐

---

## Section 9: Timezone Handling

### Test 9.1: UTC Storage Verification
**Description:** Verify all timestamps stored in UTC

**Steps:**
1. Create sync operation at 2:00 PM local time (SAST = UTC+2)
2. Check database directly: `CalendarSyncOperation.createdAt`
3. **Expected:** Timestamp is 12:00 PM (UTC, 2 hours behind)
4. Check Google Calendar event creation
5. **Expected:** Event time sent to Google API is in UTC
6. In MedBookings UI, check "Last Synced" display
7. **Expected:** Shows local time "2 hours ago" (not UTC time)

**Pass/Fail:** ☐

---

### Test 9.2: Cross-Timezone Booking
**Description:** Test bookings when provider/client in different timezones

**Setup:**
- Change system timezone to different region (e.g., GMT)

**Steps:**
1. As provider in SAST (UTC+2), create availability 9AM-5PM
2. As client in GMT (UTC+0), view provider's availability
3. **Expected:** Availability shows 7AM-3PM (converted to GMT)
4. Book slot at "8AM GMT"
5. Provider views booking
6. **Expected:** Booking shows as "10AM SAST" (correct conversion)
7. Google Calendar event
8. **Expected:** Shows correct time in both calendars

**Pass/Fail:** ☐

---

## Final Checklist

### Pre-Production Verification
- ☐ All 50+ test cases passed
- ☐ No console errors or warnings
- ☐ No 404 routes or broken links
- ☐ No hardcoded mock data visible
- ☐ All OAuth credentials configured (production keys)
- ☐ Rate limiting tested (Upstash Redis configured)
- ☐ Error messages are user-friendly (no stack traces)
- ☐ Loading states work on slow connections
- ☐ Mobile responsive design tested
- ☐ Accessibility: Keyboard navigation works
- ☐ Accessibility: Screen reader compatible

### Performance Benchmarks
- ☐ Initial page load: < 3 seconds
- ☐ Manual sync operation: < 10 seconds
- ☐ Dashboard auto-refresh: Every 5 seconds (no performance impact)
- ☐ Disconnect operation: < 5 seconds
- ☐ OAuth flow: < 30 seconds total

### Security Verification
- ☐ No tokens in browser (verified in DevTools)
- ☐ CSRF protection on all OAuth flows
- ☐ Authorization checks on all tRPC procedures
- ☐ PHI not logged to console (audit logs only)
- ☐ Sensitive data sanitized in error messages

---

## Debugging Tips

### Common Issues

**Issue:** "Connect Google Calendar" button does nothing
- **Check:** Browser console for errors
- **Check:** OAuth credentials configured in `.env.local`
- **Check:** Redirect URL matches in Google Cloud Console

**Issue:** Sync shows "In Progress" forever
- **Check:** Background job logs for errors
- **Check:** Google Calendar API quota (may be exceeded)
- **Check:** Network tab for failed API requests

**Issue:** Real-time updates not working
- **Check:** `refetchInterval` is set to 5000ms in hook
- **Check:** React Query dev tools (query is refetching)
- **Check:** Multiple tabs are using same providerId

**Issue:** Disconnect doesn't revoke tokens
- **Check:** Network tab for revoke API call
- **Check:** Google Account → Third-party apps for app status
- **Check:** Backend logs for revocation errors

---

## Test Data Setup

### Seed Script
```bash
# Run this before testing
npx tsx scripts/seed-calendar-test-data.ts
```

**Creates:**
- 2 test providers (connected + not connected)
- 1 test organization with 3 locations
- 50 historical sync operations
- Sample availability with blocked slots

### Manual Test Accounts
- **Provider Test Account:** test-provider@medbookings.test
- **Organization Owner:** test-org-owner@medbookings.test
- **Client Account:** test-client@medbookings.test

---

## Reporting Issues

When reporting bugs found during testing, include:

1. **Test Case ID:** (e.g., "Test 2.3 - Event Blocks Availability")
2. **Steps to Reproduce:** Exact sequence of actions
3. **Expected Result:** What should happen
4. **Actual Result:** What actually happened
5. **Screenshots:** Browser console errors, UI state
6. **Environment:** Browser, OS, account used
7. **Logs:** Relevant server logs if available

---

**Testing completed by:** _______________
**Date:** _______________
**Pass Rate:** _____ / 50+ tests passed
**Ready for Production:** ☐ Yes ☐ No (requires fixes)
