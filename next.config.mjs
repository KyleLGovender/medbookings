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
    // ESLint is now enforced during builds to ensure CLAUDE.md compliance
    // All violations must be fixed before deployment
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
