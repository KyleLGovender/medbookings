import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import env from '@/config/env/server';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Convert Decimal to number in all responses
prisma.$use(async (params, next) => {
  const result = await next(params);

  const convertNullToUndefined = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;

    Object.keys(obj).forEach((key) => {
      if (obj[key] === null) {
        obj[key] = undefined;
      } else if (obj[key] instanceof Decimal) {
        obj[key] = Number(obj[key]);
      } else if (typeof obj[key] === 'object') {
        convertNullToUndefined(obj[key]);
      }
    });
    return obj;
  };

  return convertNullToUndefined(result);
});

if (env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
