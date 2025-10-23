import { NextResponse } from 'next/server';

/**
 * Authentication Diagnostics API Endpoint
 *
 * Access this endpoint to check authentication configuration on any environment.
 * Safe for production - doesn't expose secrets, only checks if they exist.
 *
 * Note: This endpoint reads directly from process.env to avoid validation errors
 * that would crash the endpoint before it can report what's missing.
 *
 * Usage:
 * - Local: http://localhost:3000/api/auth/diagnostics
 * - Staging: https://staging.medbookings.co.za/api/auth/diagnostics
 * - Production: https://medbookings.co.za/api/auth/diagnostics
 */
export async function GET() {
  try {
    // Read directly from process.env to avoid validation errors
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const authSecret = process.env.AUTH_SECRET;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const databaseUrl = process.env.DATABASE_URL;

    const checks = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {
        environmentVariables: {
          NEXTAUTH_URL: {
            exists: !!nextAuthUrl,
            value: nextAuthUrl || 'NOT SET',
            valid: isValidUrl(nextAuthUrl),
          },
          AUTH_SECRET: {
            exists: !!authSecret,
            length: authSecret?.length || 0,
            valid: (authSecret?.length || 0) >= 32,
          },
          GOOGLE_CLIENT_ID: {
            exists: !!googleClientId,
            length: googleClientId?.length || 0,
            startsWithExpectedFormat:
              googleClientId?.includes('.apps.googleusercontent.com') || false,
          },
          GOOGLE_CLIENT_SECRET: {
            exists: !!googleClientSecret,
            length: googleClientSecret?.length || 0,
          },
          DATABASE_URL: {
            exists: !!databaseUrl,
            protocol: getDatabaseProtocol(databaseUrl),
          },
        },
        expectedCallbackUrls: {
          google: `${nextAuthUrl || 'https://staging.medbookings.co.za'}/api/auth/callback/google`,
        },
        configurationFiles: {
          authRoute: 'src/app/api/auth/[...nextauth]/route.ts',
          authConfig: 'src/lib/auth.ts',
          errorPage: 'src/app/(general)/(auth)/error/page.tsx',
        },
      },
      status: 'unknown',
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Analyze and identify issues
    if (!checks.checks.environmentVariables.NEXTAUTH_URL.exists) {
      checks.issues.push('NEXTAUTH_URL is not set');
      checks.recommendations.push(
        'Set NEXTAUTH_URL to your deployment URL (e.g., https://staging.medbookings.co.za)'
      );
    } else if (!checks.checks.environmentVariables.NEXTAUTH_URL.valid) {
      checks.issues.push('NEXTAUTH_URL is not a valid URL');
      checks.recommendations.push('Ensure NEXTAUTH_URL starts with https:// and is a valid URL');
    }

    if (!checks.checks.environmentVariables.AUTH_SECRET.exists) {
      checks.issues.push('AUTH_SECRET is not set');
      checks.recommendations.push('Generate and set AUTH_SECRET using: openssl rand -base64 32');
    } else if (!checks.checks.environmentVariables.AUTH_SECRET.valid) {
      checks.issues.push('AUTH_SECRET is too short (should be at least 32 characters)');
      checks.recommendations.push('Generate a new AUTH_SECRET using: openssl rand -base64 32');
    }

    if (!checks.checks.environmentVariables.GOOGLE_CLIENT_ID.exists) {
      checks.issues.push('GOOGLE_CLIENT_ID is not set');
      checks.recommendations.push(
        'Get credentials from Google Cloud Console and set GOOGLE_CLIENT_ID'
      );
    } else if (!checks.checks.environmentVariables.GOOGLE_CLIENT_ID.startsWithExpectedFormat) {
      checks.issues.push(
        'GOOGLE_CLIENT_ID may not be valid (expected format: xxx.apps.googleusercontent.com)'
      );
      checks.recommendations.push('Verify GOOGLE_CLIENT_ID from Google Cloud Console');
    }

    if (!checks.checks.environmentVariables.GOOGLE_CLIENT_SECRET.exists) {
      checks.issues.push('GOOGLE_CLIENT_SECRET is not set');
      checks.recommendations.push(
        'Get credentials from Google Cloud Console and set GOOGLE_CLIENT_SECRET'
      );
    }

    if (!checks.checks.environmentVariables.DATABASE_URL.exists) {
      checks.issues.push('DATABASE_URL is not set');
      checks.recommendations.push('Configure DATABASE_URL to connect to your PostgreSQL database');
    }

    // Always add Google OAuth redirect URI reminder
    checks.recommendations.push(
      `Verify Google Cloud Console has this redirect URI: ${checks.checks.expectedCallbackUrls.google}`
    );

    // Determine overall status
    if (checks.issues.length === 0) {
      checks.status = 'healthy';
    } else if (checks.issues.length <= 2) {
      checks.status = 'warning';
    } else {
      checks.status = 'error';
    }

    // Return appropriate status code
    const statusCode = checks.status === 'healthy' ? 200 : checks.status === 'warning' ? 207 : 500;

    return NextResponse.json(checks, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    // If env validation fails, return error details
    console.error('Diagnostics endpoint error:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        status: 'error',
        error: 'Failed to load environment configuration',
        message: error.message,
        issues: ['Environment validation failed - check server logs for details'],
        recommendations: [
          'Verify all required environment variables are set in Amplify',
          'Check server logs for specific missing variables',
          'Required: NEXTAUTH_URL, AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL',
        ],
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}

// Helper functions
function isValidUrl(urlString: string | undefined): boolean {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getDatabaseProtocol(databaseUrl: string | undefined): string | null {
  if (!databaseUrl) return null;
  try {
    const url = new URL(databaseUrl);
    return url.protocol.replace(':', '');
  } catch {
    return null;
  }
}
