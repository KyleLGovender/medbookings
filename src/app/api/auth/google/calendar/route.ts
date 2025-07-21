import { NextRequest } from 'next/server';

import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';

import env from '@/config/env/server';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  const providerId = req.nextUrl.searchParams.get('providerId');

  if (!token || !providerId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXTAUTH_URL}/api/auth/google/calendar/callback`
  );

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
    state: providerId,
  });

  return Response.redirect(url);
}
