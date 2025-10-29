import { NextRequest, NextResponse } from 'next/server';

import { nowUTC } from '@/lib/timezone';

/**
 * Custom NextAuth error handler
 * This overrides the default error page to show detailed diagnostic information
 *
 * NextAuth redirects to /api/auth/error?error=ErrorType when something goes wrong
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const error = searchParams.get('error');

  const diagnostics: any = {
    timestamp: nowUTC().toISOString(),
    error: error || 'Unknown',
    url: req.url,
    details: {},
  };

  // Map of NextAuth error types to descriptions
  const errorDescriptions: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration',
    AccessDenied: 'Access was denied',
    Verification: 'The verification token has expired or has already been used',
    Default: 'An error occurred',
    OAuthSignin: 'Error in constructing an authorization URL',
    OAuthCallback: 'Error in handling the response from an OAuth provider',
    OAuthCreateAccount: 'Could not create OAuth provider user in the database',
    EmailCreateAccount: 'Could not create email provider user in the database',
    Callback: 'Error in the OAuth callback handler route',
    OAuthAccountNotLinked:
      'Email on the account is already linked, but not with this OAuth account',
    EmailSignin: 'Sending the e-mail with the verification token failed',
    CredentialsSignin: 'The authorize callback returned null',
    SessionRequired: 'The content of this page requires you to be signed in',
  };

  diagnostics.details.description =
    errorDescriptions[error || 'Default'] || errorDescriptions.Default;

  // Provide specific diagnostics for Configuration errors
  if (error === 'Configuration') {
    diagnostics.details.possibleCauses = [
      'Invalid NEXTAUTH_URL environment variable',
      'Invalid NEXTAUTH_SECRET (must be at least 32 characters)',
      'Invalid OAuth provider credentials',
      'Missing required environment variables',
      'URL validation failure (whitespace, invalid format)',
      'Provider configuration error',
    ];

    diagnostics.details.environmentCheck = {
      NEXTAUTH_URL: {
        exists: !!process.env.NEXTAUTH_URL,
        length: process.env.NEXTAUTH_URL?.length || 0,
        hasWhitespace: process.env.NEXTAUTH_URL !== process.env.NEXTAUTH_URL?.trim(),
        preview: `${process.env.NEXTAUTH_URL?.substring(0, 30)}...`,
      },
      NEXTAUTH_SECRET: {
        exists: !!process.env.NEXTAUTH_SECRET,
        length: process.env.NEXTAUTH_SECRET?.length || 0,
        isLongEnough: (process.env.NEXTAUTH_SECRET?.length || 0) >= 32,
      },
      GOOGLE_CLIENT_ID: {
        exists: !!process.env.GOOGLE_CLIENT_ID,
        length: process.env.GOOGLE_CLIENT_ID?.length || 0,
      },
      GOOGLE_CLIENT_SECRET: {
        exists: !!process.env.GOOGLE_CLIENT_SECRET,
        length: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      },
    };

    // Check for specific issues
    diagnostics.details.detectedIssues = [];

    if (!process.env.NEXTAUTH_URL) {
      diagnostics.details.detectedIssues.push('NEXTAUTH_URL is not set');
    } else if (process.env.NEXTAUTH_URL !== process.env.NEXTAUTH_URL.trim()) {
      diagnostics.details.detectedIssues.push(
        'NEXTAUTH_URL has leading or trailing whitespace - this will cause URL validation to fail!'
      );
    }

    if ((process.env.NEXTAUTH_SECRET?.length || 0) < 32) {
      diagnostics.details.detectedIssues.push(
        'NEXTAUTH_SECRET is too short (must be at least 32 characters)'
      );
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      diagnostics.details.detectedIssues.push('GOOGLE_CLIENT_ID is not set');
    }

    if (!process.env.GOOGLE_CLIENT_SECRET) {
      diagnostics.details.detectedIssues.push('GOOGLE_CLIENT_SECRET is not set');
    }

    // Try to parse NEXTAUTH_URL
    if (process.env.NEXTAUTH_URL) {
      try {
        const url = new URL(process.env.NEXTAUTH_URL);
        diagnostics.details.parsedURL = {
          protocol: url.protocol,
          host: url.host,
          pathname: url.pathname,
          isValid: true,
        };
      } catch (e) {
        diagnostics.details.detectedIssues.push(
          `NEXTAUTH_URL is not a valid URL: ${e instanceof Error ? e.message : String(e)}`
        );
        diagnostics.details.parsedURL = {
          isValid: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }
  }

  // Suggestions for fixing
  diagnostics.details.nextSteps = [
    '1. Check /api/auth/test-config for detailed diagnostics',
    '2. Verify all environment variables are set correctly in AWS Amplify',
    '3. Look for whitespace or special characters in environment variable values',
    '4. Check CloudWatch logs for detailed error messages',
    '5. Verify Google OAuth credentials match those in Google Cloud Console',
  ];

  // Return HTML for browser or JSON for API clients
  const acceptsHtml = req.headers.get('accept')?.includes('text/html');

  if (acceptsHtml) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>NextAuth Error - ${error}</title>
  <style>
    body { font-family: system-ui; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #d32f2f; }
    h2 { color: #555; margin-top: 30px; }
    .error-type { background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .issue { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 10px 0; }
    .success { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 10px 0; }
    pre { background: #f5f5f5; padding: 15px; overflow-x: auto; border-radius: 4px; }
    .env-check { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
    .exists { color: #4caf50; }
    .missing { color: #d32f2f; }
    a { color: #1976d2; }
  </style>
</head>
<body>
  <h1>NextAuth Error: ${error}</h1>

  <div class="error-type">
    <strong>${diagnostics.details.description}</strong>
  </div>

  ${
    diagnostics.details.detectedIssues?.length > 0
      ? `
  <h2>Detected Issues:</h2>
  ${diagnostics.details.detectedIssues.map((issue: string) => `<div class="issue">⚠️ ${issue}</div>`).join('')}
  `
      : ''
  }

  ${
    error === 'Configuration'
      ? `
  <h2>Environment Variables:</h2>
  <div class="env-check">
    <strong>NEXTAUTH_URL:</strong>
    ${
      diagnostics.details.environmentCheck.NEXTAUTH_URL.exists
        ? `<span class="exists">✓ Set</span> (${diagnostics.details.environmentCheck.NEXTAUTH_URL.length} chars)
       ${
         diagnostics.details.environmentCheck.NEXTAUTH_URL.hasWhitespace
           ? '<strong style="color: #d32f2f;"> ⚠️ HAS WHITESPACE!</strong>'
           : ''
       }`
        : '<span class="missing">✗ Not set</span>'
    }
  </div>
  <div class="env-check">
    <strong>NEXTAUTH_SECRET:</strong>
    ${
      diagnostics.details.environmentCheck.NEXTAUTH_SECRET.exists
        ? `<span class="exists">✓ Set</span> (${diagnostics.details.environmentCheck.NEXTAUTH_SECRET.length} chars)
       ${
         !diagnostics.details.environmentCheck.NEXTAUTH_SECRET.isLongEnough
           ? '<strong style="color: #d32f2f;"> ⚠️ TOO SHORT!</strong>'
           : ''
       }`
        : '<span class="missing">✗ Not set</span>'
    }
  </div>
  <div class="env-check">
    <strong>GOOGLE_CLIENT_ID:</strong>
    ${
      diagnostics.details.environmentCheck.GOOGLE_CLIENT_ID.exists
        ? `<span class="exists">✓ Set</span> (${diagnostics.details.environmentCheck.GOOGLE_CLIENT_ID.length} chars)`
        : '<span class="missing">✗ Not set</span>'
    }
  </div>
  <div class="env-check">
    <strong>GOOGLE_CLIENT_SECRET:</strong>
    ${
      diagnostics.details.environmentCheck.GOOGLE_CLIENT_SECRET.exists
        ? `<span class="exists">✓ Set</span> (${diagnostics.details.environmentCheck.GOOGLE_CLIENT_SECRET.length} chars)`
        : '<span class="missing">✗ Not set</span>'
    }
  </div>
  `
      : ''
  }

  <h2>Next Steps:</h2>
  <ol>
    ${diagnostics.details.nextSteps.map((step: string) => `<li>${step}</li>`).join('')}
  </ol>

  <h2>Diagnostic Endpoint:</h2>
  <p>For detailed configuration testing, visit: <a href="/api/auth/test-config">/api/auth/test-config</a></p>

  <h2>Full Diagnostics (JSON):</h2>
  <pre>${JSON.stringify(diagnostics, null, 2)}</pre>

  <p><a href="/">← Back to Home</a></p>
</body>
</html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      },
    });
  }

  // Return JSON for API clients
  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
