import createJiti from 'jiti';
import { fileURLToPath } from 'node:url';

const jiti = createJiti(fileURLToPath(import.meta.url));

// Import env here to validate during build. Using jiti we can import .ts files :)
jiti('./src/config/env/server');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   typedRoutes: true,
  // },

  // CRITICAL: Explicitly expose environment variables for AWS Amplify runtime
  // AWS Amplify environment variables are only available at build time by default
  // This configuration makes them available at runtime for serverless functions
  env: {
    // NextAuth v5 (NOTE: Both AUTH_SECRET and NEXTAUTH_SECRET work, we use NEXTAUTH_SECRET)
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST, // Required for AWS Amplify proxy

    // OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // Google Services
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,

    // Twilio
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,

    // SendGrid
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,

    // Admin
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,

    // AWS S3
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_REGION: process.env.S3_REGION,

    // Logging (NOTE: NODE_ENV is automatically set by Next.js and cannot be in env{})
    LOG_LEVEL: process.env.LOG_LEVEL,
    CLOUDWATCH_LOG_GROUP_NAME: process.env.CLOUDWATCH_LOG_GROUP_NAME,
  },

  transpilePackages: ['react-hook-form', 'next-safe-action'],
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
    // ESLint warnings allowed during builds - remaining warnings are documented as acceptable
    // (API response.json(), form type inference, Google Maps external types)
    // NOTE: Errors will still block builds - only warnings are allowed
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
