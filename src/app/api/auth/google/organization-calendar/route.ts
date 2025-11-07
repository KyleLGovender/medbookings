/**
 * Organization Google Calendar OAuth Initiation Route
 *
 * Initiates OAuth flow for organizations to connect their Google Calendar.
 * Supports both organization-wide and location-specific calendar integrations.
 *
 * Query Parameters:
 * - organizationId: Required - The organization ID
 * - locationId: Optional - If provided, creates location-specific integration
 *
 * State Parameter:
 * - Encodes: organizationId|locationId (or just organizationId if no location)
 */
import { NextRequest } from 'next/server';

import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';

import env from '@/config/env/server';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  const organizationId = req.nextUrl.searchParams.get('organizationId');
  const locationId = req.nextUrl.searchParams.get('locationId');

  if (!token || !organizationId) {
    logger.warn('Unauthorized organization calendar OAuth attempt', {
      hasToken: !!token,
      hasOrganizationId: !!organizationId,
    });
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify user has permission to connect calendar for this organization
  // TODO: Add permission check here (organization admin/owner only)

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXTAUTH_URL}/api/auth/google/organization-calendar/callback`
  );

  // Encode organizationId and locationId in state parameter
  const state = locationId ? `${organizationId}|${locationId}` : organizationId;

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/meetings.space.created',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
  });

  logger.info('Initiating organization calendar OAuth flow', {
    organizationId,
    locationId,
  });

  return Response.redirect(url);
}
