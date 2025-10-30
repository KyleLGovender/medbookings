import { NextRequest, NextResponse } from 'next/server';

import { nowUTC } from '@/lib/timezone';

/**
 * Debug endpoint to show what OAuth URL NextAuth would construct
 * This bypasses NextAuth and shows us directly what's happening
 */
export async function GET(req: NextRequest) {
  // Get the environment variables and headers that NextAuth uses
  const authTrustHost = process.env.AUTH_TRUST_HOST;
  const vercel = process.env.VERCEL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  const host = req.headers.get('host');
  const xForwardedHost = req.headers.get('x-forwarded-host');
  const xForwardedProto = req.headers.get('x-forwarded-proto');

  // Simulate NextAuth's detectOrigin logic
  let detectedOrigin: string;

  if (vercel ?? authTrustHost) {
    // Trust the proxy headers
    const useHost = xForwardedHost || host;
    const useProto = xForwardedProto === 'http' ? 'http' : 'https';
    detectedOrigin = `${useProto}://${useHost}`;
  } else {
    // Fall back to NEXTAUTH_URL or localhost
    detectedOrigin = nextAuthUrl || 'http://localhost:3000';
  }

  // Construct what the callback URL would be
  const callbackUrl = `${detectedOrigin}/api/auth/callback/google`;

  // Construct what the Google OAuth authorization URL would look like
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const scope = encodeURIComponent('openid email profile');
  const redirectUri = encodeURIComponent(callbackUrl);

  const googleAuthUrl = googleClientId
    ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&access_type=offline&prompt=consent`
    : 'N/A - GOOGLE_CLIENT_ID not set';

  const result = {
    timestamp: nowUTC().toISOString(),
    purpose: 'Show what OAuth URL NextAuth would construct',

    environmentVariables: {
      AUTH_TRUST_HOST: authTrustHost || 'NOT_SET',
      VERCEL: vercel || 'NOT_SET',
      NEXTAUTH_URL: nextAuthUrl || 'NOT_SET',
      GOOGLE_CLIENT_ID_exists: !!googleClientId,
    },

    requestHeaders: {
      host,
      xForwardedHost,
      xForwardedProto,
    },

    detectOriginLogic: {
      shouldTrustHeaders: !!(vercel ?? authTrustHost),
      usedHost: xForwardedHost || host,
      usedProto: xForwardedProto === 'http' ? 'http' : 'https',
      detectedOrigin,
    },

    constructedUrls: {
      callbackUrl,
      googleAuthorizationUrl: googleAuthUrl,
    },

    analysis: {
      problem: detectedOrigin.includes('localhost')
        ? '❌ PROBLEM: Detected origin contains localhost!'
        : '✅ Detected origin looks correct',
      callbackUrlStatus: callbackUrl.includes('localhost')
        ? '❌ Callback URL will use localhost (OAuth will fail)'
        : '✅ Callback URL looks correct',
      recommendation: detectedOrigin.includes('localhost')
        ? authTrustHost
          ? 'AUTH_TRUST_HOST is set but not being used. Check if NEXTAUTH_URL is set correctly, or if there is a timing/initialization issue.'
          : 'AUTH_TRUST_HOST is NOT set. Set it to "true" in AWS Amplify environment variables.'
        : 'Configuration looks correct. If OAuth is still failing, the issue might be in Google Cloud Console redirect URI configuration.',
    },
  };

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
