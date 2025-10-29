import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';

/**
 * Diagnostic endpoint to test NextAuth configuration and environment variables
 * Navigate to: /api/auth/test-config
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {},
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  // Test 1: Environment Variables Access
  results.tests.envVariables = {};

  const envVarsToTest = [
    'NODE_ENV',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL',
  ];

  for (const varName of envVarsToTest) {
    try {
      const value = process.env[varName];
      const exists = value !== undefined && value !== '';

      results.tests.envVariables[varName] = {
        exists,
        length: value?.length || 0,
        // Show first/last 4 chars for verification (not full value for security)
        preview: value
          ? value.length > 8
            ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
            : '***'
          : 'NOT SET',
        type: typeof value,
      };

      if (exists) {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }
    } catch (error) {
      results.tests.envVariables[varName] = {
        error: error instanceof Error ? error.message : String(error),
        exists: false,
      };
      results.summary.failed++;
    }
  }

  // Test 2: Lazy Env Module Access
  results.tests.lazyEnvModule = {};

  try {
    // Import the lazy env module
    const env = (await import('@/config/env/server')).default;

    // Test accessing each variable through the Proxy
    for (const varName of ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'GOOGLE_CLIENT_ID']) {
      try {
        const value = env[varName];
        results.tests.lazyEnvModule[varName] = {
          success: true,
          hasValue: !!value,
          length: value?.length || 0,
        };
        results.summary.passed++;
      } catch (error) {
        results.tests.lazyEnvModule[varName] = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
        results.summary.failed++;
      }
    }
  } catch (error) {
    results.tests.lazyEnvModule = {
      error: 'Failed to import env module',
      details: error instanceof Error ? error.message : String(error),
    };
    results.summary.failed++;
  }

  // Test 3: AuthOptions Structure
  results.tests.authOptions = {};

  try {
    results.tests.authOptions.hasSecret = !!authOptions.secret;
    results.tests.authOptions.hasProviders = Array.isArray(authOptions.providers);
    results.tests.authOptions.providerCount = authOptions.providers?.length || 0;
    results.tests.authOptions.hasSession = !!authOptions.session;
    results.tests.authOptions.sessionStrategy = authOptions.session?.strategy;
    results.tests.authOptions.hasCallbacks = !!authOptions.callbacks;
    results.tests.authOptions.useSecureCookies = authOptions.useSecureCookies;

    // Check if we can access provider details
    if (authOptions.providers && authOptions.providers.length > 0) {
      results.tests.authOptions.providers = authOptions.providers.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        // Don't expose actual secrets
        hasClientId: !!p.options?.clientId,
        hasClientSecret: !!p.options?.clientSecret,
      }));
    }

    results.summary.passed++;
  } catch (error) {
    results.tests.authOptions = {
      error: 'Failed to access authOptions',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    results.summary.failed++;
  }

  // Test 4: NextAuth Handler Creation
  results.tests.nextAuthHandler = {};

  try {
    const NextAuth = (await import('next-auth/next')).default;

    // Try to create the handler
    const testHandler = NextAuth(authOptions);

    results.tests.nextAuthHandler = {
      success: true,
      handlerCreated: !!testHandler,
      handlerType: typeof testHandler,
    };
    results.summary.passed++;
  } catch (error) {
    results.tests.nextAuthHandler = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    };
    results.summary.failed++;
  }

  // Test 5: URL Validation
  results.tests.urlValidation = {};

  try {
    const nextauthUrl = process.env.NEXTAUTH_URL;

    if (nextauthUrl) {
      // Test if it's a valid URL
      const url = new URL(nextauthUrl);

      results.tests.urlValidation = {
        success: true,
        protocol: url.protocol,
        host: url.host,
        pathname: url.pathname,
        hasTrailingSlash: nextauthUrl.endsWith('/'),
        hasWhitespace: nextauthUrl !== nextauthUrl.trim(),
        originalLength: nextauthUrl.length,
        trimmedLength: nextauthUrl.trim().length,
      };

      if (nextauthUrl !== nextauthUrl.trim()) {
        results.summary.warnings++;
        results.tests.urlValidation.warning = 'URL has leading/trailing whitespace';
      } else {
        results.summary.passed++;
      }
    } else {
      results.tests.urlValidation = {
        success: false,
        error: 'NEXTAUTH_URL not set',
      };
      results.summary.failed++;
    }
  } catch (error) {
    results.tests.urlValidation = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      value: process.env.NEXTAUTH_URL,
    };
    results.summary.failed++;
  }

  // Final status
  results.overallStatus =
    results.summary.failed === 0
      ? results.summary.warnings > 0
        ? 'WARNING'
        : 'PASS'
      : 'FAIL';

  return NextResponse.json(results, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
