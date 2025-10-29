import { PrismaClient } from '@prisma/client';

import env from '@/config/env/server';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Serverless-optimized Prisma configuration for AWS Lambda
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

// In production (serverless), always use a fresh instance per Lambda container
// In development, reuse the instance to avoid connection exhaustion
if (env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  globalForPrisma.prisma = prisma;
}

// Graceful connection handling for serverless environments
// Ensure Prisma connects explicitly with timeout and error logging
if (env.NODE_ENV === 'production') {
  prisma
    .$connect()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('[Prisma] Database connected successfully');
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[Prisma] Database connection failed:', error);
      // Don't exit process - let Lambda retry on next invocation
    });
}
