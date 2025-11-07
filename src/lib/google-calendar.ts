/**
 * Google Calendar API Utilities
 *
 * Provides functions for bidirectional Google Calendar integration:
 * - Token management (refresh, validation)
 * - Event operations (fetch, create, update, delete)
 * - CalendarEvent record processing
 *
 * CRITICAL: All functions use token auto-refresh before API calls
 */
import type { Booking, CalendarEvent, CalendarIntegration } from '@prisma/client';
import { addDays } from 'date-fns';
import { type OAuth2Client } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';

import env from '@/config/env/server';
import { logger, sanitizeEmail } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { fromTimestamp, nowUTC, parseUTC } from '@/lib/timezone';

// ============================================================================
// Types
// ============================================================================

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  etag?: string;
  eventType?: string;
  organizer?: {
    email?: string;
  };
  attendees?: Array<{
    email?: string;
  }>;
  hangoutLink?: string;
  conferenceData?: {
    conferenceId?: string;
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
}

export interface FetchEventsOptions {
  timeMin: Date;
  timeMax: Date;
  syncToken?: string | null;
  maxResults?: number;
}

export interface FetchEventsResult {
  events: GoogleCalendarEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
}

export interface CreateEventOptions {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  createMeetLink?: boolean;
  conferenceRequestId?: string;
}

export interface CreateEventResult {
  eventId: string;
  meetLink?: string;
  hangoutLink?: string;
}

// ============================================================================
// OAuth2 Client Management
// ============================================================================

/**
 * Create OAuth2 client with credentials
 */
function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXTAUTH_URL}/api/auth/google/calendar/callback`
  );
}

/**
 * Get OAuth2 client with valid access token for a CalendarIntegration
 * Automatically refreshes token if expired
 */
async function getAuthenticatedClient(
  integrationId: string
): Promise<{ client: OAuth2Client; integration: CalendarIntegration }> {
  const integration = await prisma.calendarIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration) {
    throw new Error(`CalendarIntegration not found: ${integrationId}`);
  }

  const oauth2Client = createOAuth2Client();

  // Check if token needs refresh
  const now = nowUTC();
  const tokenExpiresIn = integration.expiresAt.getTime() - now.getTime();
  const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

  if (tokenExpiresIn < REFRESH_BUFFER_MS) {
    logger.info('Refreshing Google Calendar access token', {
      integrationId: integration.id,
      providerId: integration.providerId,
      expiresAt: integration.expiresAt.toISOString(),
    });

    // Set refresh token to get new access token
    oauth2Client.setCredentials({
      refresh_token: integration.refreshToken,
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update integration with new tokens
      const updatedIntegration = await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: credentials.access_token,
          expiresAt: credentials.expiry_date
            ? fromTimestamp(credentials.expiry_date)
            : addDays(nowUTC(), 7), // Fallback: 7 days
          // Refresh token may be rotated by Google
          ...(credentials.refresh_token && {
            refreshToken: credentials.refresh_token,
          }),
        },
      });

      logger.info('Access token refreshed successfully', {
        integrationId: integration.id,
        providerId: integration.providerId,
        newExpiresAt: updatedIntegration.expiresAt.toISOString(),
      });

      // Set updated credentials
      oauth2Client.setCredentials({
        access_token: updatedIntegration.accessToken,
        refresh_token: updatedIntegration.refreshToken,
        expiry_date: updatedIntegration.expiresAt.getTime(),
      });

      return { client: oauth2Client, integration: updatedIntegration };
    } catch (error) {
      logger.error('Failed to refresh Google Calendar token', {
        integrationId: integration.id,
        providerId: integration.providerId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Increment failure count
      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          syncFailureCount: { increment: 1 },
        },
      });

      throw new Error(
        'Failed to refresh Google Calendar token. Provider may need to re-authenticate.'
      );
    }
  } else {
    // Token still valid, use existing credentials
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.expiresAt.getTime(),
    });

    return { client: oauth2Client, integration };
  }
}

// ============================================================================
// Event Fetching (Import)
// ============================================================================

/**
 * Fetch events from Google Calendar
 * Supports both full sync and incremental sync using syncToken
 */
export async function fetchGoogleCalendarEvents(
  integrationId: string,
  options: FetchEventsOptions
): Promise<FetchEventsResult> {
  const { client, integration } = await getAuthenticatedClient(integrationId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  if (!integration.calendarId) {
    throw new Error('No calendarId configured for integration');
  }

  logger.info('Fetching Google Calendar events', {
    integrationId,
    providerId: integration.providerId,
    timeMin: options.timeMin.toISOString(),
    timeMax: options.timeMax.toISOString(),
    usingSyncToken: !!options.syncToken,
  });

  try {
    const response = await calendar.events.list({
      calendarId: integration.calendarId,
      timeMin: options.syncToken ? undefined : options.timeMin.toISOString(),
      timeMax: options.syncToken ? undefined : options.timeMax.toISOString(),
      syncToken: options.syncToken || undefined,
      maxResults: options.maxResults || 250,
      singleEvents: true, // Expand recurring events into instances
      orderBy: options.syncToken ? undefined : 'startTime',
    });

    const events = (response.data.items || []) as GoogleCalendarEvent[];

    logger.info('Fetched Google Calendar events successfully', {
      integrationId,
      providerId: integration.providerId,
      eventCount: events.length,
      nextSyncToken: response.data.nextSyncToken,
      nextPageToken: response.data.nextPageToken,
    });

    return {
      events,
      nextSyncToken: response.data.nextSyncToken || undefined,
      nextPageToken: response.data.nextPageToken || undefined,
    };
  } catch (error) {
    logger.error('Failed to fetch Google Calendar events', {
      integrationId,
      providerId: integration.providerId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Check if sync token is invalid (need full sync)
    if (error instanceof Error && error.message.includes('Sync token is no longer valid')) {
      logger.warn('Sync token invalid, full sync required', {
        integrationId,
        providerId: integration.providerId,
      });

      // Clear sync token
      await prisma.calendarIntegration.update({
        where: { id: integrationId },
        data: { nextSyncToken: null },
      });

      throw new Error('SYNC_TOKEN_INVALID');
    }

    throw error;
  }
}

/**
 * Process Google Calendar event into CalendarEvent record
 * Handles all-day events, recurring events, etc.
 */
export async function processGoogleEvent(
  event: GoogleCalendarEvent,
  integrationId: string
): Promise<Omit<CalendarEvent, 'createdAt' | 'updatedAt' | 'id'>> {
  const startTime = event.start.dateTime
    ? parseUTC(event.start.dateTime)
    : parseUTC(event.start.date!);

  const endTime = event.end.dateTime ? parseUTC(event.end.dateTime) : parseUTC(event.end.date!);

  const isAllDay = !event.start.dateTime;

  return {
    calendarIntegrationId: integrationId,
    externalEventId: event.id,
    externalCalendarId: event.organizer?.email || 'primary',
    title: event.summary || 'Untitled Event',
    startTime,
    endTime,
    isAllDay,
    eventType: event.eventType || null,
    etag: event.etag || null,
    lastSyncedAt: nowUTC(),
    lastModifiedInExternal: null, // Google doesn't provide this in list
    syncStatus: 'SYNCED',
    blocksAvailability: true, // Default to blocking (can be configured)
    hasConflict: false,
    conflictDetails: null,
    conflictResolvedAt: null,
    version: 1,
  };
}

// ============================================================================
// Event Creation (Export)
// ============================================================================

/**
 * Create event in Google Calendar
 * Optionally generates Google Meet link
 */
export async function createGoogleEvent(
  integrationId: string,
  options: CreateEventOptions
): Promise<CreateEventResult> {
  const { client, integration } = await getAuthenticatedClient(integrationId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  if (!integration.calendarId) {
    throw new Error('No calendarId configured for integration');
  }

  logger.info('Creating Google Calendar event', {
    integrationId,
    providerId: integration.providerId,
    summary: options.summary,
    startTime: options.startTime.toISOString(),
    createMeetLink: options.createMeetLink,
  });

  try {
    const eventData: calendar_v3.Schema$Event = {
      summary: options.summary,
      description: options.description,
      start: {
        dateTime: options.startTime.toISOString(),
        timeZone: 'Africa/Johannesburg',
      },
      end: {
        dateTime: options.endTime.toISOString(),
        timeZone: 'Africa/Johannesburg',
      },
      attendees: options.attendees?.map((email) => ({ email })),
    };

    // Add conference data for Google Meet link
    if (options.createMeetLink && integration.autoCreateMeetLinks) {
      eventData.conferenceData = {
        createRequest: {
          requestId: options.conferenceRequestId || `medbookings-${nowUTC().getTime()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      };
    }

    const response = await calendar.events.insert({
      calendarId: integration.calendarId,
      conferenceDataVersion: options.createMeetLink ? 1 : 0,
      requestBody: eventData,
    });

    const event = response.data;

    logger.info('Created Google Calendar event successfully', {
      integrationId,
      providerId: integration.providerId,
      eventId: event.id,
      meetLinkCreated: !!event.hangoutLink,
    });

    return {
      eventId: event.id!,
      meetLink: event.hangoutLink || undefined,
      hangoutLink: event.hangoutLink || undefined,
    };
  } catch (error) {
    logger.error('Failed to create Google Calendar event', {
      integrationId,
      providerId: integration.providerId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

/**
 * Create Google Calendar event from MedBookings booking
 * Includes booking details and creates Meet link if online
 */
export async function createGoogleEventFromBooking(
  booking: Booking & {
    slot: {
      startTime: Date;
      endTime: Date;
      service: { name: string };
      availability: { provider: { name: string; user: { email?: string | null } } };
    };
    client?: { name?: string | null; email?: string | null } | null;
  },
  integrationId: string
): Promise<CreateEventResult> {
  const providerName = booking.slot.availability.provider.name;
  const providerEmail = booking.slot.availability.provider.user.email;
  const clientName = booking.isGuestBooking ? booking.guestName : booking.client?.name;
  const clientEmail = booking.isGuestBooking ? booking.guestEmail : booking.client?.email;

  const summary = `MedBookings: ${booking.slot.service.name}`;
  const description = [
    `Booking ID: ${booking.id}`,
    `Provider: ${providerName}`,
    clientName ? `Client: ${clientName}` : null,
    booking.isOnline ? 'Type: Online Consultation' : 'Type: In-Person',
  ]
    .filter(Boolean)
    .join('\n');

  const attendees = [providerEmail, clientEmail].filter((email): email is string => !!email);

  return createGoogleEvent(integrationId, {
    summary,
    description,
    startTime: booking.slot.startTime,
    endTime: booking.slot.endTime,
    attendees,
    createMeetLink: booking.isOnline,
    conferenceRequestId: booking.id,
  });
}

// ============================================================================
// Event Updates
// ============================================================================

/**
 * Update existing Google Calendar event
 */
export async function updateGoogleEvent(
  integrationId: string,
  externalEventId: string,
  updates: Partial<CreateEventOptions>
): Promise<void> {
  const { client, integration } = await getAuthenticatedClient(integrationId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  if (!integration.calendarId) {
    throw new Error('No calendarId configured for integration');
  }

  logger.info('Updating Google Calendar event', {
    integrationId,
    providerId: integration.providerId,
    externalEventId,
  });

  try {
    const eventData: calendar_v3.Schema$Event = {};

    if (updates.summary) eventData.summary = updates.summary;
    if (updates.description) eventData.description = updates.description;
    if (updates.startTime) {
      eventData.start = {
        dateTime: updates.startTime.toISOString(),
        timeZone: 'Africa/Johannesburg',
      };
    }
    if (updates.endTime) {
      eventData.end = {
        dateTime: updates.endTime.toISOString(),
        timeZone: 'Africa/Johannesburg',
      };
    }
    if (updates.attendees) {
      eventData.attendees = updates.attendees.map((email) => ({ email }));
    }

    await calendar.events.patch({
      calendarId: integration.calendarId,
      eventId: externalEventId,
      requestBody: eventData,
    });

    logger.info('Updated Google Calendar event successfully', {
      integrationId,
      providerId: integration.providerId,
      externalEventId,
    });
  } catch (error) {
    logger.error('Failed to update Google Calendar event', {
      integrationId,
      providerId: integration.providerId,
      externalEventId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

// ============================================================================
// Event Deletion
// ============================================================================

/**
 * Delete event from Google Calendar
 */
export async function deleteGoogleEvent(
  integrationId: string,
  externalEventId: string
): Promise<void> {
  const { client, integration } = await getAuthenticatedClient(integrationId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  if (!integration.calendarId) {
    throw new Error('No calendarId configured for integration');
  }

  logger.info('Deleting Google Calendar event', {
    integrationId,
    providerId: integration.providerId,
    externalEventId,
  });

  try {
    await calendar.events.delete({
      calendarId: integration.calendarId,
      eventId: externalEventId,
    });

    logger.info('Deleted Google Calendar event successfully', {
      integrationId,
      providerId: integration.providerId,
      externalEventId,
    });
  } catch (error) {
    // If event already deleted (404), consider it successful
    if (error instanceof Error && error.message.includes('404')) {
      logger.warn('Google Calendar event already deleted', {
        integrationId,
        providerId: integration.providerId,
        externalEventId,
      });
      return;
    }

    logger.error('Failed to delete Google Calendar event', {
      integrationId,
      providerId: integration.providerId,
      externalEventId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

// ============================================================================
// Token Revocation
// ============================================================================

/**
 * Revoke Google Calendar OAuth tokens
 * Called during disconnect flow to immediately invalidate access
 */
export async function revokeGoogleCalendarToken(integrationId: string): Promise<void> {
  const integration = await prisma.calendarIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration) {
    throw new Error(`CalendarIntegration not found: ${integrationId}`);
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  logger.info('Revoking Google Calendar OAuth tokens', {
    integrationId,
    providerId: integration.providerId,
    email: sanitizeEmail(integration.googleEmail || ''),
  });

  try {
    // Revoke the refresh token (this also invalidates the access token)
    await oauth2Client.revokeToken(integration.refreshToken);

    logger.info('Successfully revoked Google Calendar tokens', {
      integrationId,
      providerId: integration.providerId,
    });
  } catch (error) {
    // Log error but don't throw - token may already be revoked or expired
    logger.warn('Failed to revoke Google Calendar token (may already be invalid)', {
      integrationId,
      providerId: integration.providerId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue with disconnect even if revocation fails
  }
}

/**
 * Revoke Organization Calendar OAuth tokens
 */
export async function revokeOrganizationCalendarToken(integrationId: string): Promise<void> {
  const integration = await prisma.organizationCalendarIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration) {
    throw new Error(`OrganizationCalendarIntegration not found: ${integrationId}`);
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  logger.info('Revoking organization Google Calendar OAuth tokens', {
    integrationId,
    organizationId: integration.organizationId,
    locationId: integration.locationId,
    email: sanitizeEmail(integration.googleEmail || ''),
  });

  try {
    await oauth2Client.revokeToken(integration.refreshToken);

    logger.info('Successfully revoked organization calendar tokens', {
      integrationId,
      organizationId: integration.organizationId,
      locationId: integration.locationId,
    });
  } catch (error) {
    logger.warn('Failed to revoke organization calendar token (may already be invalid)', {
      integrationId,
      organizationId: integration.organizationId,
      locationId: integration.locationId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue with disconnect even if revocation fails
  }
}

// ============================================================================
// Webhook Management (Reserved for Future Implementation)
// ============================================================================

/**
 * Setup webhook for real-time calendar change notifications
 * NOTE: Not implemented in current sprint - periodic sync only
 */
export async function setupWebhook(integrationId: string): Promise<{
  channelId: string;
  resourceId: string;
  expiration: Date;
}> {
  throw new Error('Webhook support not implemented - using periodic sync');
}

/**
 * Renew existing webhook subscription
 * NOTE: Not implemented in current sprint - periodic sync only
 */
export async function renewWebhook(integrationId: string): Promise<void> {
  throw new Error('Webhook support not implemented - using periodic sync');
}

/**
 * Stop webhook subscription
 * NOTE: Not implemented in current sprint - periodic sync only
 */
export async function stopWebhook(integrationId: string): Promise<void> {
  throw new Error('Webhook support not implemented - using periodic sync');
}
