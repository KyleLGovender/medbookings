import { NextResponse } from 'next/server';

import { authConfig } from '@/lib/auth';
import { nowUTC } from '@/lib/timezone';

/**
 * Diagnostic endpoint to test NextAuth configuration and environment variables
 * Navigate to: /api/auth/test-config
 */
export async function GET() {
  const results: any = {
    timestamp: nowUTC().toISOString(),
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
  results.tests.authConfig = {};

  try {
    results.tests.authConfig.hasSecret = !!authConfig.secret;
    results.tests.authConfig.hasProviders = Array.isArray(authConfig.providers);
    results.tests.authConfig.providerCount = authConfig.providers?.length || 0;
    results.tests.authConfig.hasSession = !!authConfig.session;
    results.tests.authConfig.sessionStrategy = authConfig.session?.strategy;
    results.tests.authConfig.hasCallbacks = !!authConfig.callbacks;
    results.tests.authConfig.useSecureCookies = authConfig.useSecureCookies;

    // Check if we can access provider details
    if (authConfig.providers && authConfig.providers.length > 0) {
      results.tests.authConfig.providers = authConfig.providers.map((p: any) => ({
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
    results.tests.authConfig = {
      error: 'Failed to access authConfig',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    results.summary.failed++;
  }

  // Test 4: NextAuth v5 Handler Availability
  results.tests.nextAuthHandler = {};

  try {
    // In NextAuth v5, handlers are pre-initialized and exported from auth config
    const { handlers, auth } = await import('@/lib/auth');

    results.tests.nextAuthHandler = {
      success: true,
      handlersAvailable: !!handlers,
      authFunctionAvailable: !!auth,
      handlersType: typeof handlers,
      authType: typeof auth,
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
    results.summary.failed === 0 ? (results.summary.warnings > 0 ? 'WARNING' : 'PASS') : 'FAIL';

  return NextResponse.json(results, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
