import { NextRequest, NextResponse } from 'next/server';

import { nowUTC } from '@/lib/timezone';

/**
 * Diagnostic endpoint to check if AUTH_TRUST_HOST is available at runtime
 * This helps debug why NextAuth is still using localhost:3000 for OAuth redirects
 */
export async function GET(req: NextRequest) {
  const diagnostics = {
    timestamp: nowUTC().toISOString(),
    purpose: 'Check if AUTH_TRUST_HOST environment variable is available at runtime',

    // Check AUTH_TRUST_HOST specifically
    authTrustHost: {
      exists: !!process.env.AUTH_TRUST_HOST,
      value: process.env.AUTH_TRUST_HOST || 'NOT_SET',
      type: typeof process.env.AUTH_TRUST_HOST,
      isTruthy: !!process.env.AUTH_TRUST_HOST,
      stringValue: String(process.env.AUTH_TRUST_HOST),
    },

    // Check related NextAuth environment variables
    relatedVars: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
      NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length || 0,
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      VERCEL: process.env.VERCEL || 'NOT_SET',
    },

    // Check request headers (CloudFront should set these)
    requestHeaders: {
      host: req.headers.get('host') || 'NOT_SET',
      xForwardedHost: req.headers.get('x-forwarded-host') || 'NOT_SET',
      xForwardedProto: req.headers.get('x-forwarded-proto') || 'NOT_SET',
      xForwardedFor: req.headers.get('x-forwarded-for') || 'NOT_SET',
    },

    // Simulate what NextAuth's detectOrigin() would do
    nextAuthLogic: {
      hasVERCEL: !!process.env.VERCEL,
      hasAUTH_TRUST_HOST: !!process.env.AUTH_TRUST_HOST,
      shouldTrustHeaders: !!(process.env.VERCEL ?? process.env.AUTH_TRUST_HOST),
      detectedOrigin: (() => {
        const forwardedHost = req.headers.get('x-forwarded-host');
        const forwardedProto = req.headers.get('x-forwarded-proto');

        // Simulate NextAuth v4's detectOrigin logic
        if (process.env.VERCEL ?? process.env.AUTH_TRUST_HOST) {
          const protocol = forwardedProto === 'http' ? 'http' : 'https';
          return `${protocol}://${forwardedHost}`;
        }

        return process.env.NEXTAUTH_URL || 'http://localhost:3000';
      })(),
    },

    // Check if we're in production
    environment: {
      isProduction: process.env.NODE_ENV === 'production',
      isAmplify: !!process.env.AWS_EXECUTION_ENV,
      platform: process.env.AWS_EXECUTION_ENV || 'unknown',
    },

    // All environment variables starting with NEXT or AUTH (without values for security)
    availableAuthVars: Object.keys(process.env)
      .filter((key) => key.startsWith('NEXT') || key.startsWith('AUTH'))
      .reduce(
        (acc, key) => {
          acc[key] = {
            exists: true,
            length: process.env[key]?.length || 0,
            type: typeof process.env[key],
          };
          return acc;
        },
        {} as Record<string, { exists: boolean; length: number; type: string }>
      ),

    analysis: {
      problem: '',
      solution: '',
    },
  };

  // Analyze the results
  if (!diagnostics.authTrustHost.exists) {
    diagnostics.analysis.problem =
      'AUTH_TRUST_HOST is NOT available at runtime. NextAuth will fall back to localhost:3000.';
    diagnostics.analysis.solution =
      'AUTH_TRUST_HOST needs to be set in AWS Amplify branch-level environment variables AND exposed via next.config.mjs env{} configuration.';
  } else if (diagnostics.nextAuthLogic.detectedOrigin.includes('localhost')) {
    diagnostics.analysis.problem =
      'AUTH_TRUST_HOST exists but NextAuth is still detecting localhost. This suggests CloudFront headers are missing or NextAuth logic has an issue.';
    diagnostics.analysis.solution =
      'Check if X-Forwarded-Host header is being set by CloudFront. Consider setting VERCEL=1 as an alternative.';
  } else {
    diagnostics.analysis.problem = 'No obvious issues detected in environment configuration.';
    diagnostics.analysis.solution =
      'AUTH_TRUST_HOST is set and NextAuth should detect the correct origin. If OAuth is still failing, check Google Cloud Console redirect URIs or CloudWatch logs for additional errors.';
  }

  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
