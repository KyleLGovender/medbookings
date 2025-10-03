/**
 * Audit Logging Utility for POPIA Compliance
 *
 * This utility provides database-backed audit logging for security-sensitive
 * operations and PHI access tracking, as required by POPIA regulations.
 *
 * IMPORTANT: All audit logs are stored in the database for compliance purposes.
 * Console logging via logger.audit() is for real-time monitoring only.
 */
import { type AuditCategory, type Prisma } from '@prisma/client';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { nowUTC } from '@/lib/timezone';

interface AuditLogParams {
  // Required fields
  action: string;
  category?: AuditCategory;

  // Actor (who)
  userId?: string;
  userEmail?: string; // Should be pre-sanitized

  // Target (what)
  resource?: string;
  resourceId?: string;

  // Context
  ipAddress?: string;
  userAgent?: string;

  // Additional data (must be sanitized - no raw PHI)
  metadata?: Prisma.InputJsonValue;
}

/**
 * Create an audit log entry in the database
 *
 * This function is async but does not throw errors to avoid disrupting
 * the main application flow if audit logging fails.
 *
 * @example
 * ```ts
 * await createAuditLog({
 *   action: 'Provider approved',
 *   category: 'ADMIN_ACTION',
 *   userId: ctx.session.user.id,
 *   userEmail: sanitizeEmail(ctx.session.user.email),
 *   resource: 'Provider',
 *   resourceId: sanitizeProviderId(provider.id),
 *   metadata: { providerName: provider.name }
 * });
 * ```
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        category: params.category || 'GENERAL',
        userId: params.userId,
        userEmail: params.userEmail,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not disrupt main flow
    // Use console.error here since logger might cause circular dependency
    // eslint-disable-next-line no-console
    logger.error('Failed to create audit log:', error);
  }
}

/**
 * Query audit logs with filtering
 *
 * @example
 * ```ts
 * const logs = await queryAuditLogs({
 *   userId: 'user_123',
 *   category: 'ADMIN_ACTION',
 *   limit: 50
 * });
 * ```
 */
export async function queryAuditLogs(params: {
  userId?: string;
  action?: string;
  category?: AuditCategory;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.AuditLogWhereInput = {};

  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = { contains: params.action };
  if (params.category) where.category = params.category;
  if (params.resource) where.resource = params.resource;
  if (params.resourceId) where.resourceId = params.resourceId;

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: params.limit || 100,
    skip: params.offset || 0,
  });
}

/**
 * Get audit log statistics for a date range
 *
 * Useful for compliance reporting and security monitoring
 *
 * @example
 * ```ts
 * const stats = await getAuditStats({
 *   startDate: parseUTC('2025-01-01'),
 *   endDate: parseUTC('2025-01-31')
 * });
 * ```
 */
export async function getAuditStats(params: { startDate: Date; endDate: Date }) {
  const where: Prisma.AuditLogWhereInput = {
    createdAt: {
      gte: params.startDate,
      lte: params.endDate,
    },
  };

  const [totalLogs, byCategory, byAction] = await Promise.all([
    // Total logs
    prisma.auditLog.count({ where }),

    // Group by category
    prisma.auditLog.groupBy({
      by: ['category'],
      where,
      _count: true,
    }),

    // Top actions
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    totalLogs,
    byCategory,
    topActions: byAction,
  };
}

/**
 * Cleanup old audit logs
 *
 * POPIA requires retention of audit logs for a specific period.
 * Run this as a scheduled job to clean up logs older than the retention period.
 *
 * @param retentionDays Number of days to retain logs (default: 365)
 *
 * @example
 * ```ts
 * // Delete logs older than 1 year
 * await cleanupOldAuditLogs(365);
 * ```
 */
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
  const cutoffDate = nowUTC();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Helper: Extract IP address from Next.js request
 */
export function getIpFromRequest(req: Request | { headers: Headers }): string | undefined {
  const headers = req.headers;

  // Try various headers that might contain the real IP
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0]?.trim();
  }

  return undefined;
}

/**
 * Helper: Extract user agent from request
 */
export function getUserAgentFromRequest(req: Request | { headers: Headers }): string | undefined {
  return req.headers.get('user-agent') || undefined;
}
