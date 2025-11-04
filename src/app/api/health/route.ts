import { type NextRequest, NextResponse } from 'next/server';

import clientEnv from '@/config/env/client';
import env from '@/config/env/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/rate-limit';
import { nowUTC } from '@/lib/timezone';

/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Returns application health status including:
 * - Database connectivity
 * - Redis connectivity (production)
 * - Application uptime
 *
 * Status Codes:
 * - 200: All systems operational
 * - 503: Service unavailable (critical dependency failure)
 */
export async function GET(request: NextRequest) {
  const startTime = nowUTC().getTime();
  const timestamp = nowUTC();

  const health = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: timestamp.toISOString(),
    checks: {
      database: {
        status: 'unknown' as 'up' | 'down' | 'unknown',
        responseTime: 0,
        message: '',
      },
      redis: {
        status: 'unknown' as 'up' | 'down' | 'unknown' | 'not_configured',
        responseTime: 0,
        message: '',
      },
    },
    version: clientEnv.NEXT_PUBLIC_APP_VERSION || 'unknown',
    environment: env.NODE_ENV || 'unknown',
    uptime: process.uptime(),
  };

  // Check Database Connectivity
  try {
    const dbStart = nowUTC().getTime();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database.responseTime = nowUTC().getTime() - dbStart;
    health.checks.database.status = 'up';
    health.checks.database.message = 'Database connection successful';
  } catch (error) {
    health.checks.database.status = 'down';
    health.checks.database.message =
      error instanceof Error ? error.message : 'Database connection failed';
    health.status = 'unhealthy';
  }

  // Check Redis Connectivity (Production Only)
  if (env.NODE_ENV === 'production') {
    if (!redis) {
      health.checks.redis.status = 'down';
      health.checks.redis.message = 'Redis not configured (required in production)';
      health.status = 'unhealthy';
    } else {
      try {
        const redisStart = nowUTC().getTime();
        await redis.ping();
        health.checks.redis.responseTime = nowUTC().getTime() - redisStart;
        health.checks.redis.status = 'up';
        health.checks.redis.message = 'Redis connection successful';
      } catch (error) {
        health.checks.redis.status = 'down';
        health.checks.redis.message =
          error instanceof Error ? error.message : 'Redis connection failed';
        health.status = 'unhealthy';
      }
    }
  } else {
    // Development/Test - Redis is optional
    if (redis) {
      try {
        const redisStart = nowUTC().getTime();
        await redis.ping();
        health.checks.redis.responseTime = nowUTC().getTime() - redisStart;
        health.checks.redis.status = 'up';
        health.checks.redis.message = 'Redis connection successful';
      } catch (error) {
        health.checks.redis.status = 'down';
        health.checks.redis.message =
          error instanceof Error ? error.message : 'Redis connection failed';
        // Don't mark as unhealthy in dev if Redis fails
        health.status = 'degraded';
      }
    } else {
      health.checks.redis.status = 'not_configured';
      health.checks.redis.message = 'Redis not configured (optional in development)';
    }
  }

  // Calculate total response time
  const totalResponseTime = nowUTC().getTime() - startTime;

  // Return appropriate status code
  const statusCode = health.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(
    {
      ...health,
      responseTime: totalResponseTime,
    },
    { status: statusCode }
  );
}
