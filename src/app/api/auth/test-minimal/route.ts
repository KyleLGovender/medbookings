import { NextResponse } from 'next/server';

import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import env from '@/config/env/server';
import { nowUTC } from '@/lib/timezone';

/**
 * Progressive NextAuth configuration testing
 * Tests NextAuth with increasing complexity to isolate the failing component
 *
 * Navigate to: /api/auth/test-minimal
 */
export async function GET() {
  const results: any = {
    timestamp: nowUTC().toISOString(),
    tests: [],
  };

  // Test 1: Minimal Configuration (just secret)
  try {
    const minimalConfig: NextAuthConfig = {
      secret: process.env.NEXTAUTH_SECRET,
      providers: [],
    };

    const handler1 = NextAuth(minimalConfig);

    results.tests.push({
      test: '1_minimal_secret_only',
      status: 'PASS',
      config: 'secret only, no providers',
      handlerCreated: !!handler1,
    });
  } catch (error) {
    results.tests.push({
      test: '1_minimal_secret_only',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined,
    });
  }

  // Test 2: With hardcoded Google provider
  try {
    const withHardcodedProvider: NextAuthConfig = {
      secret: process.env.NEXTAUTH_SECRET,
      providers: [
        GoogleProvider({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        }),
      ],
    };

    const handler2 = NextAuth(withHardcodedProvider);

    results.tests.push({
      test: '2_hardcoded_google_provider',
      status: 'PASS',
      config: 'secret + Google provider with hardcoded values',
      handlerCreated: !!handler2,
    });
  } catch (error) {
    results.tests.push({
      test: '2_hardcoded_google_provider',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 3: With env-based Google provider
  try {
    const withEnvProvider: NextAuthConfig = {
      secret: env.NEXTAUTH_SECRET,
      providers: [
        GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        }),
      ],
    };

    const handler3 = NextAuth(withEnvProvider);

    results.tests.push({
      test: '3_env_based_google_provider',
      status: 'PASS',
      config: 'secret + Google provider with env values',
      handlerCreated: !!handler3,
      envAccess: {
        secret: !!env.NEXTAUTH_SECRET,
        clientId: !!env.GOOGLE_CLIENT_ID,
        clientSecret: !!env.GOOGLE_CLIENT_SECRET,
      },
    });
  } catch (error) {
    results.tests.push({
      test: '3_env_based_google_provider',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      envAccess: {
        secretError: captureError(() => env.NEXTAUTH_SECRET),
        clientIdError: captureError(() => env.GOOGLE_CLIENT_ID),
        clientSecretError: captureError(() => env.GOOGLE_CLIENT_SECRET),
      },
    });
  }

  // Test 4: With session strategy
  try {
    const withSession: NextAuthConfig = {
      secret: env.NEXTAUTH_SECRET,
      providers: [
        GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        }),
      ],
      session: {
        strategy: 'jwt',
      },
    };

    const handler4 = NextAuth(withSession);

    results.tests.push({
      test: '4_with_session_strategy',
      status: 'PASS',
      config: 'previous + JWT session strategy',
      handlerCreated: !!handler4,
    });
  } catch (error) {
    results.tests.push({
      test: '4_with_session_strategy',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 5: With useSecureCookies
  try {
    const withSecureCookies: NextAuthConfig = {
      secret: env.NEXTAUTH_SECRET,
      providers: [
        GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        }),
      ],
      session: {
        strategy: 'jwt',
      },
      useSecureCookies: true,
    };

    const handler5 = NextAuth(withSecureCookies);

    results.tests.push({
      test: '5_with_secure_cookies',
      status: 'PASS',
      config: 'previous + useSecureCookies: true',
      handlerCreated: !!handler5,
    });
  } catch (error) {
    results.tests.push({
      test: '5_with_secure_cookies',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 6: With cookies configuration
  try {
    const withCookiesConfig: NextAuthConfig = {
      secret: env.NEXTAUTH_SECRET,
      providers: [
        GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        }),
      ],
      session: {
        strategy: 'jwt',
      },
      useSecureCookies: true,
      cookies: {
        sessionToken: {
          name: '__Secure-next-auth.session-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true,
          },
        },
      },
    };

    const handler6 = NextAuth(withCookiesConfig);

    results.tests.push({
      test: '6_with_cookies_config',
      status: 'PASS',
      config: 'previous + explicit cookies configuration',
      handlerCreated: !!handler6,
    });
  } catch (error) {
    results.tests.push({
      test: '6_with_cookies_config',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 7: With Google authorization params
  try {
    const withAuthParams: NextAuthConfig = {
      secret: env.NEXTAUTH_SECRET,
      providers: [
        GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
          authorization: {
            params: {
              scope: 'openid email profile',
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        }),
      ],
      session: {
        strategy: 'jwt',
      },
      useSecureCookies: true,
    };

    const handler7 = NextAuth(withAuthParams);

    results.tests.push({
      test: '7_with_authorization_params',
      status: 'PASS',
      config: 'previous + Google authorization params',
      handlerCreated: !!handler7,
    });
  } catch (error) {
    results.tests.push({
      test: '7_with_authorization_params',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Summary
  const passed = results.tests.filter((t: any) => t.status === 'PASS').length;
  const failed = results.tests.filter((t: any) => t.status === 'FAIL').length;

  results.summary = {
    total: results.tests.length,
    passed,
    failed,
    firstFailure: results.tests.find((t: any) => t.status === 'FAIL')?.test || null,
  };

  results.conclusion =
    failed === 0
      ? 'All tests passed! NextAuth configuration is valid.'
      : `Configuration fails at test: ${results.summary.firstFailure}`;

  return NextResponse.json(results, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

// Helper function to capture errors when accessing env vars
function captureError(fn: () => any): string | null {
  try {
    fn();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
