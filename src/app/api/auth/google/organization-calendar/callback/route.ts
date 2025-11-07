/**
 * Organization Google Calendar OAuth Callback Route
 *
 * Handles the OAuth callback from Google and stores the integration.
 * Creates OrganizationCalendarIntegration record with tokens and metadata.
 *
 * State Parameter Format:
 * - organizationId (organization-wide integration)
 * - organizationId|locationId (location-specific integration)
 */
import { NextRequest } from 'next/server';

import { google } from 'googleapis';

import env from '@/config/env/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { fromTimestamp } from '@/lib/timezone';

const defaultMeetSettings = {
  requireAuthentication: true,
  allowExternalGuests: true,
  defaultConferenceSolution: 'google_meet',
};

export async function GET(req: NextRequest) {
  const { code, state } = Object.fromEntries(req.nextUrl.searchParams);

  if (!code || !state) {
    logger.error('Missing code or state in organization calendar OAuth callback', {
      hasCode: !!code,
      hasState: !!state,
    });
    return new Response('Missing code or state parameter', { status: 400 });
  }

  // Decode state parameter
  const [organizationId, locationId] = state.split('|');

  logger.info('Processing organization calendar OAuth callback', {
    organizationId,
    locationId,
  });

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXTAUTH_URL}/api/auth/google/organization-calendar/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      logger.error('Invalid tokens received from Google', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
      });
      return new Response('Invalid tokens received', { status: 400 });
    }

    // Set credentials for API calls
    oauth2Client.setCredentials(tokens);

    // Get user's email and primary calendar
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const [userProfile, calendarList] = await Promise.all([
      people.people.get({ resourceName: 'people/me', personFields: 'emailAddresses' }),
      calendar.calendarList.list({ maxResults: 1, minAccessRole: 'owner' }),
    ]);

    const googleEmail = userProfile.data.emailAddresses?.[0]?.value;
    const calendarId = calendarList.data.items?.[0]?.id;

    if (!googleEmail || !calendarId) {
      // phi-safe: logging boolean flags, not actual email data
      logger.error('Failed to retrieve Google email or calendar ID', {
        hasEmail: !!googleEmail,
        hasCalendarId: !!calendarId,
      });
      return new Response('Failed to retrieve calendar information', { status: 500 });
    }

    // Store in OrganizationCalendarIntegration
    // Find existing integration first
    const existing = await prisma.organizationCalendarIntegration.findFirst({
      where: {
        organizationId,
        locationId: locationId || null,
      },
    });

    const integrationData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: fromTimestamp(tokens.expiry_date!),
      calendarProvider: 'GOOGLE',
      googleEmail,
      calendarId,
      grantedScopes: tokens.scope?.split(' ') || [],
      meetSettings: defaultMeetSettings,
      syncEnabled: true,
      backgroundSyncEnabled: true,
      syncFailureCount: 0, // Reset on reconnect
      nextRetryAt: null,
      lastErrorType: null,
    };

    const integration = existing
      ? await prisma.organizationCalendarIntegration.update({
          where: { id: existing.id },
          data: integrationData,
        })
      : await prisma.organizationCalendarIntegration.create({
          data: {
            organizationId,
            locationId: locationId || null,
            ...integrationData,
          },
        });

    logger.info('Organization calendar integration created/updated successfully', {
      integrationId: integration.id,
      organizationId,
      locationId,
      googleEmail,
    });

    // Redirect back to organization calendar settings page
    const redirectPath = locationId
      ? `/organization/${organizationId}/locations/${locationId}/calendar`
      : `/organization/${organizationId}/settings/calendar`;

    return Response.redirect(`${env.NEXTAUTH_URL}${redirectPath}`);
  } catch (error) {
    logger.error('Error processing organization calendar OAuth callback', {
      organizationId,
      locationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response('Failed to complete calendar integration', { status: 500 });
  }
}
