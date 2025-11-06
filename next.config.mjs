import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';
import createJiti from 'jiti';
import { fileURLToPath } from 'node:url';

const jiti = createJiti(fileURLToPath(import.meta.url));

// Import env here to validate during build. Using jiti we can import .ts files :)
jiti('./src/config/env/server');

// Configure bundle analyzer
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable instrumentation hook for Sentry initialization
    instrumentationHook: true,
    // typedRoutes: true,
  },
  transpilePackages: ['react-hook-form'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wfhq93qoozwnz2zu.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Add any custom webpack config here
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Suppress webpack warnings for jiti dynamic imports
    config.ignoreWarnings = [{ module: /node_modules\/jiti/ }, ...(config.ignoreWarnings || [])];

    return config;
  },
  eslint: {
    // Disabled during builds - validated by pre-commit hooks and GitHub Actions CI
    // See .github/workflows/claude-compliance.yml for CI validation
    // This prevents Vercel build timeouts on large codebases (12,964 TS files)
    ignoreDuringBuilds: true,
  },
  // Security headers for production (POPIA compliance)
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
};

// Wrap with Sentry config for error tracking
// Note: withSentryConfig should be the outermost wrapper
export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Enable logging to monitor source map upload progress
    silent: false,
    telemetry: false,

    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // TEST: Re-enable source map uploads now that ESLint is disabled
    // ESLint was the primary timeout culprit (30+ min), source maps add ~3-5 min
    // This tests if builds complete in <10 min with source maps enabled
    disableSourceMapUpload: false,

    // Use auth token from environment for uploads
    // authToken is automatically read from SENTRY_AUTH_TOKEN env var
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // TEST: Re-enable file uploads to get readable stack traces in Sentry
    // This was previously disabled due to timeout concerns, but ESLint was the real culprit
    widenClientFileUpload: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles (users can't access them)
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: true,
  }
);
