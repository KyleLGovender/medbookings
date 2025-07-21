import { NextRequest } from 'next/server';

import { google } from 'googleapis';

import env from '@/config/env/server';
import { prisma } from '@/lib/prisma';

const defaultMeetSettings = {
  requireAuthentication: true,
  allowExternalGuests: true,
  defaultConferenceSolution: 'google_meet',
};

export async function GET(req: NextRequest) {
  const { code, state: providerId } = Object.fromEntries(req.nextUrl.searchParams);

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXTAUTH_URL}/api/auth/google/calendar/callback`
  );

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    return new Response('Invalid tokens received', { status: 400 });
  }

  const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);

  // After getting tokens
  const oauth2ClientAfterTokens = new google.auth.OAuth2();
  oauth2ClientAfterTokens.setCredentials(tokens);

  // Get user's email and primary calendar
  const people = google.people({ version: 'v1', auth: oauth2ClientAfterTokens });
  const calendar = google.calendar({ version: 'v3', auth: oauth2ClientAfterTokens });

  const [userProfile, calendarList] = await Promise.all([
    people.people.get({ resourceName: 'people/me', personFields: 'emailAddresses' }),
    calendar.calendarList.list({ maxResults: 1, minAccessRole: 'owner' }),
  ]);

  // Store everything in CalendarIntegration
  await prisma.calendarIntegration.upsert({
    where: { providerId },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date!),
      calendarProvider: 'GOOGLE',
      googleEmail: userProfile.data.emailAddresses?.[0].value,
      calendarId: calendarList.data.items?.[0].id,
      grantedScopes: tokens.scope?.split(' '),
      meetSettings: defaultMeetSettings,
    },
    create: {
      providerId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date!),
      calendarProvider: 'GOOGLE',
      googleEmail: userProfile.data.emailAddresses?.[0].value,
      calendarId: calendarList.data.items?.[0].id,
      grantedScopes: tokens.scope?.split(' '),
      meetSettings: defaultMeetSettings,
    },
  });

  return Response.redirect(`${env.NEXTAUTH_URL}/profile/service-provider/view`);
}
