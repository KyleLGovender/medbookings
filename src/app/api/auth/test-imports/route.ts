import { NextResponse } from 'next/server';

import { nowUTC } from '@/lib/timezone';

/**
 * Test which module import is failing
 */
export async function GET() {
  const results: any = {
    timestamp: nowUTC().toISOString(),
    imports: [],
  };

  // Test 1: Import env module
  try {
    const env = await import('@/config/env/server');
    results.imports.push({
      module: '@/config/env/server',
      status: 'SUCCESS',
      hasDefault: !!env.default,
    });
  } catch (error) {
    results.imports.push({
      module: '@/config/env/server',
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 2: Import prisma
  try {
    const prisma = await import('@/lib/prisma');
    results.imports.push({
      module: '@/lib/prisma',
      status: 'SUCCESS',
      hasPrisma: !!prisma.prisma,
    });
  } catch (error) {
    results.imports.push({
      module: '@/lib/prisma',
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 3: Import logger
  try {
    const logger = await import('@/lib/logger');
    results.imports.push({
      module: '@/lib/logger',
      status: 'SUCCESS',
      hasLogger: !!logger.logger,
    });
  } catch (error) {
    results.imports.push({
      module: '@/lib/logger',
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 4: Import password-hash
  try {
    const passwordHash = await import('@/lib/password-hash');
    results.imports.push({
      module: '@/lib/password-hash',
      status: 'SUCCESS',
      hasHashPassword: !!passwordHash.hashPassword,
    });
  } catch (error) {
    results.imports.push({
      module: '@/lib/password-hash',
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 5: Import timezone
  try {
    const timezone = await import('@/lib/timezone');
    results.imports.push({
      module: '@/lib/timezone',
      status: 'SUCCESS',
      hasNowUTC: !!timezone.nowUTC,
    });
  } catch (error) {
    results.imports.push({
      module: '@/lib/timezone',
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 6: Finally, try to import auth
  try {
    const auth = await import('@/lib/auth');
    results.imports.push({
      module: '@/lib/auth',
      status: 'SUCCESS',
      hasAuthOptions: !!auth.authOptions,
    });
  } catch (error) {
    results.imports.push({
      module: '@/lib/auth',
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    });
  }

  // Summary
  const success = results.imports.filter((i: any) => i.status === 'SUCCESS').length;
  const failed = results.imports.filter((i: any) => i.status === 'FAILED').length;

  results.summary = {
    total: results.imports.length,
    success,
    failed,
    firstFailure: results.imports.find((i: any) => i.status === 'FAILED')?.module || null,
  };

  return NextResponse.json(results, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
