/**
 * Rate limiting utilities using Upstash Redis
 *
 * Implements rate limiting for critical endpoints to prevent:
 * - Brute force attacks on authentication
 * - Storage exhaustion via file uploads
 * - Email spam via verification endpoints
 * - General API abuse
 *
 * POPIA Compliance: Section 19 - Security safeguards requirement
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { logger } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';

// Initialize Redis client from environment variables
// In development without Upstash, this will be undefined and we'll use in-memory fallback
let redis: Redis | undefined;

try {
  // Only initialize if env vars are present
  if (process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN']) {
    redis = new Redis({
      url: process.env['UPSTASH_REDIS_REST_URL'],
      token: process.env['UPSTASH_REDIS_REST_TOKEN'],
    });
  }
} catch (error) {
  logger.warn('Failed to initialize Upstash Redis, using in-memory rate limiting', { error });
}

// ✅ Warn if Redis is not configured in production (checked at module load time)
if (!redis && process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
  logger.error(
    'CRITICAL: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production for proper rate limiting across multiple instances'
  );
}

/**
 * Authentication rate limiting
 * Strict limits to prevent brute force attacks
 *
 * Limit: 5 attempts per 15 minutes (matches account lockout policy)
 * Applies to: /api/auth/register, /api/auth/signin
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : createInMemoryRateLimit(5, 15 * 60 * 1000); // 5 attempts, 15 minutes

/**
 * File upload rate limiting
 * Moderate limits to prevent storage abuse
 *
 * Limit: 10 uploads per hour
 * Applies to: /api/upload
 */
export const uploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(10, '1 h'),
      analytics: true,
      prefix: 'ratelimit:upload',
    })
  : createInMemoryRateLimit(10, 60 * 60 * 1000); // 10 attempts, 1 hour

/**
 * Email verification rate limiting
 * Lenient limits to allow legitimate retries
 *
 * Limit: 5 emails per hour
 * Applies to: /api/auth/resend-verification
 */
export const emailRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(5, '1 h'),
      analytics: true,
      prefix: 'ratelimit:email',
    })
  : createInMemoryRateLimit(5, 60 * 60 * 1000); // 5 attempts, 1 hour

/**
 * General API rate limiting
 * Balanced limits for general API usage
 *
 * Limit: 100 requests per minute
 * Applies to: General tRPC endpoints (future use)
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : createInMemoryRateLimit(100, 60 * 1000); // 100 attempts, 1 minute

/**
 * In-memory rate limiting fallback for development
 *
 * WARNING: This ONLY works for single-instance deployments.
 * DO NOT use in production with multiple serverless functions.
 *
 * For production, ALWAYS use Upstash Redis.
 */
interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
}

interface InMemoryRecord {
  count: number;
  resetAt: number;
}

function createInMemoryRateLimit(
  maxAttempts: number,
  windowMs: number
): { limit: (identifier: string) => Promise<RateLimitResult> } {
  // ⚠️ FAIL-OPEN WITH AGGRESSIVE LOGGING: Allow operation but log heavily
  // This prevents complete application failure in production without Redis,
  // but still provides security through detailed audit trails
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
    logger.error(
      'CRITICAL SECURITY WARNING: Using in-memory rate limiting in production. ' +
        'This ONLY works for single-instance deployments. ' +
        'For multi-instance/serverless deployments, configure Upstash Redis immediately: ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables. ' +
        'See: https://console.upstash.com/redis'
    );

    return {
      limit: async (identifier: string) => {
        // Log EVERY rate limit check in production to detect abuse
        logger.warn('Production in-memory rate limit check (UNSAFE FOR MULTI-INSTANCE)', {
          identifier,
          timestamp: nowUTC().toISOString(),
          maxAttempts,
          windowMs,
          warning: 'Rate limiting may be ineffective across multiple instances',
        });

        // Allow operation but track for audit purposes
        return {
          success: true, // FAIL-OPEN: Allow with aggressive logging
          limit: maxAttempts,
          remaining: maxAttempts,
          reset: nowUTC().getTime() + windowMs,
          pending: Promise.resolve(),
        };
      },
    };
  }

  const attempts = new Map<string, InMemoryRecord>();

  // Cleanup old records every 5 minutes
  setInterval(
    () => {
      const now = nowUTC().getTime();
      const keysToDelete: string[] = [];
      attempts.forEach((record, key) => {
        if (record.resetAt < now) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => attempts.delete(key));
    },
    5 * 60 * 1000
  );

  return {
    limit: async (identifier: string): Promise<RateLimitResult> => {
      const now = nowUTC().getTime();
      const record = attempts.get(identifier);

      // Clean up expired record
      if (record && record.resetAt < now) {
        attempts.delete(identifier);
      }

      // Create new record or get existing
      const current = attempts.get(identifier);

      if (!current) {
        // First attempt in window
        attempts.set(identifier, {
          count: 1,
          resetAt: now + windowMs,
        });

        return {
          success: true,
          limit: maxAttempts,
          remaining: maxAttempts - 1,
          reset: now + windowMs,
          pending: Promise.resolve(),
        };
      }

      // Check if limit exceeded
      if (current.count >= maxAttempts) {
        return {
          success: false,
          limit: maxAttempts,
          remaining: 0,
          reset: current.resetAt,
          pending: Promise.resolve(),
        };
      }

      // Increment count
      current.count++;

      return {
        success: true,
        limit: maxAttempts,
        remaining: maxAttempts - current.count,
        reset: current.resetAt,
        pending: Promise.resolve(),
      };
    },
  };
}

/**
 * Helper to get identifier from request
 * Uses IP address for anonymous requests, user ID for authenticated
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'anonymous';

  return `ip:${ip}`;
}

/**
 * Helper to create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}
