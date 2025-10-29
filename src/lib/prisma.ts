import { PrismaClient } from '@prisma/client';

// NOTE: Import env for validation, but use process.env directly for Prisma initialization
// This avoids validation issues when Prisma module loads before env values are injected
import env from '@/config/env/server';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Serverless-optimized Prisma configuration for AWS Lambda
// CRITICAL: Use process.env directly (not env Proxy) to avoid initialization issues
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// In production (serverless), always use a fresh instance per Lambda container
// In development, reuse the instance to avoid connection exhaustion
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  globalForPrisma.prisma = prisma;
}

// Track connection state for serverless environments
let connectionPromise: Promise<void> | null = null;

/**
 * Ensures Prisma is connected before executing queries.
 * This is critical in serverless environments (AWS Lambda) where the connection
 * might not be established when the first query is attempted.
 *
 * @returns Promise that resolves when Prisma is connected
 * @throws Error if connection fails
 */
export async function ensurePrismaConnected(): Promise<void> {
  if (!connectionPromise) {
    connectionPromise = prisma
      .$connect()
      .then(() => {
        // eslint-disable-next-line no-console
        console.log('[Prisma] Database connected successfully');
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[Prisma] Database connection failed:', error);
        // Reset promise so next call retries
        connectionPromise = null;
        throw error;
      });
  }
  return connectionPromise;
}

// In production (serverless), eagerly start the connection process
// but don't block module initialization
if (process.env.NODE_ENV === 'production') {
  ensurePrismaConnected();
}
