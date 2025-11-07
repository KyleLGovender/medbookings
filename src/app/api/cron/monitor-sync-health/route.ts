/**
 * Calendar Sync Health Monitoring Cron Job
 *
 * Monitors the health of all calendar integrations:
 * - Identifies stale syncs (lastSyncedAt > 30 minutes)
 * - Tracks integrations with high failure rates
 * - Detects disabled integrations that should be reviewed
 * - Sends summary email to admins
 *
 * Runs hourly (configured in vercel.json)
 * Security: Requires CRON_SECRET environment variable
 */
import { type NextRequest } from 'next/server';

import { addMinutes } from 'date-fns';

import env from '@/config/env/server';
import { sendEmail } from '@/lib/communications/email';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { nowUTC } from '@/lib/timezone';

interface HealthIssue {
  type: 'STALE_SYNC' | 'HIGH_FAILURE_RATE' | 'RECENTLY_DISABLED' | 'NEVER_SYNCED';
  providerId: string;
  providerName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  lastSyncedAt?: Date | null;
  failureCount?: number;
}

interface HealthSummary {
  totalIntegrations: number;
  activeIntegrations: number;
  disabledIntegrations: number;
  issues: HealthIssue[];
  healthyCount: number;
}

/**
 * Health monitoring cron job handler
 * GET /api/cron/monitor-sync-health
 */
export async function GET(req: NextRequest) {
  const startTime = nowUTC().getTime();

  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  const expectedAuth = `Bearer ${env.CRON_SECRET || process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    logger.warn('Unauthorized health monitoring cron job access attempt', {
      authHeader: authHeader ? 'present' : 'missing',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    });

    return new Response('Unauthorized', { status: 401 });
  }

  logger.info('Starting calendar sync health monitoring');

  try {
    const now = nowUTC();
    const staleThreshold = addMinutes(now, -30); // Syncs older than 30 min are stale
    const recentDisableThreshold = addMinutes(now, -60 * 24); // Last 24 hours

    // Fetch all integrations with provider info
    const integrations = await prisma.calendarIntegration.findMany({
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      take: 500, // Pagination: Monitor up to 500 integrations per run
    });

    logger.info('Fetched integrations for health check', {
      count: integrations.length,
    });

    const issues: HealthIssue[] = [];

    for (const integration of integrations) {
      // Check 1: Never synced
      if (integration.syncEnabled && !integration.lastSyncedAt) {
        issues.push({
          type: 'NEVER_SYNCED',
          providerId: integration.providerId,
          providerName: integration.provider.name,
          severity: 'MEDIUM',
          details: 'Integration enabled but has never synced',
          lastSyncedAt: null,
        });
      }

      // Check 2: Stale sync (enabled but not synced recently)
      if (
        integration.syncEnabled &&
        integration.backgroundSyncEnabled &&
        integration.lastSyncedAt &&
        integration.lastSyncedAt < staleThreshold
      ) {
        const minutesSinceSync = Math.floor(
          (now.getTime() - integration.lastSyncedAt.getTime()) / (1000 * 60)
        );

        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
        if (minutesSinceSync > 120) severity = 'HIGH';
        if (minutesSinceSync > 360) severity = 'CRITICAL';

        issues.push({
          type: 'STALE_SYNC',
          providerId: integration.providerId,
          providerName: integration.provider.name,
          severity,
          details: `Last synced ${minutesSinceSync} minutes ago`,
          lastSyncedAt: integration.lastSyncedAt,
          failureCount: integration.syncFailureCount,
        });
      }

      // Check 3: High failure rate (3+ failures)
      if (integration.syncEnabled && integration.syncFailureCount >= 3) {
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (integration.syncFailureCount >= 4) severity = 'MEDIUM';
        if (integration.syncFailureCount >= 5) severity = 'HIGH';

        issues.push({
          type: 'HIGH_FAILURE_RATE',
          providerId: integration.providerId,
          providerName: integration.provider.name,
          severity,
          details: `${integration.syncFailureCount} consecutive failures (error: ${integration.lastErrorType || 'unknown'})`,
          failureCount: integration.syncFailureCount,
          lastSyncedAt: integration.lastSyncedAt,
        });
      }

      // Check 4: Recently disabled integrations
      if (!integration.syncEnabled && integration.updatedAt > recentDisableThreshold) {
        issues.push({
          type: 'RECENTLY_DISABLED',
          providerId: integration.providerId,
          providerName: integration.provider.name,
          severity: 'MEDIUM',
          details: `Disabled ${Math.floor((now.getTime() - integration.updatedAt.getTime()) / (1000 * 60 * 60))} hours ago (${integration.syncFailureCount} failures, error: ${integration.lastErrorType || 'unknown'})`,
          failureCount: integration.syncFailureCount,
          lastSyncedAt: integration.lastSyncedAt,
        });
      }
    }

    // Fetch and check organization integrations
    const orgIntegrations = await prisma.organizationCalendarIntegration.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 500, // Pagination: Monitor up to 500 org integrations per run
    });

    logger.info('Fetched organization integrations for health check', {
      count: orgIntegrations.length,
    });

    for (const orgIntegration of orgIntegrations) {
      const integrationName = orgIntegration.location
        ? `${orgIntegration.organization.name} - ${orgIntegration.location.name}`
        : orgIntegration.organization.name;

      // Check 1: Never synced
      if (orgIntegration.syncEnabled && !orgIntegration.lastSyncedAt) {
        issues.push({
          type: 'NEVER_SYNCED',
          providerId: `org-${orgIntegration.organizationId}`,
          providerName: integrationName,
          severity: 'MEDIUM',
          details: 'Organization integration enabled but has never synced',
          lastSyncedAt: null,
        });
      }

      // Check 2: Stale sync
      if (
        orgIntegration.syncEnabled &&
        orgIntegration.backgroundSyncEnabled &&
        orgIntegration.lastSyncedAt &&
        orgIntegration.lastSyncedAt < staleThreshold
      ) {
        const minutesSinceSync = Math.floor(
          (now.getTime() - orgIntegration.lastSyncedAt.getTime()) / (1000 * 60)
        );

        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
        if (minutesSinceSync > 120) severity = 'HIGH';
        if (minutesSinceSync > 360) severity = 'CRITICAL';

        issues.push({
          type: 'STALE_SYNC',
          providerId: `org-${orgIntegration.organizationId}`,
          providerName: integrationName,
          severity,
          details: `Last synced ${minutesSinceSync} minutes ago`,
          lastSyncedAt: orgIntegration.lastSyncedAt,
          failureCount: orgIntegration.syncFailureCount,
        });
      }

      // Check 3: High failure rate
      if (orgIntegration.syncEnabled && orgIntegration.syncFailureCount >= 3) {
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (orgIntegration.syncFailureCount >= 4) severity = 'MEDIUM';
        if (orgIntegration.syncFailureCount >= 5) severity = 'HIGH';

        issues.push({
          type: 'HIGH_FAILURE_RATE',
          providerId: `org-${orgIntegration.organizationId}`,
          providerName: integrationName,
          severity,
          details: `${orgIntegration.syncFailureCount} consecutive failures (error: ${orgIntegration.lastErrorType || 'unknown'})`,
          failureCount: orgIntegration.syncFailureCount,
          lastSyncedAt: orgIntegration.lastSyncedAt,
        });
      }

      // Check 4: Recently disabled
      if (!orgIntegration.syncEnabled && orgIntegration.updatedAt > recentDisableThreshold) {
        issues.push({
          type: 'RECENTLY_DISABLED',
          providerId: `org-${orgIntegration.organizationId}`,
          providerName: integrationName,
          severity: 'MEDIUM',
          details: `Disabled ${Math.floor((now.getTime() - orgIntegration.updatedAt.getTime()) / (1000 * 60 * 60))} hours ago (${orgIntegration.syncFailureCount} failures, error: ${orgIntegration.lastErrorType || 'unknown'})`,
          failureCount: orgIntegration.syncFailureCount,
          lastSyncedAt: orgIntegration.lastSyncedAt,
        });
      }
    }

    // Calculate summary statistics (providers + organizations)
    const totalIntegrations = integrations.length + orgIntegrations.length;
    const activeIntegrations =
      integrations.filter((i) => i.syncEnabled && i.backgroundSyncEnabled).length +
      orgIntegrations.filter((i) => i.syncEnabled && i.backgroundSyncEnabled).length;
    const disabledIntegrations =
      integrations.filter((i) => !i.syncEnabled).length +
      orgIntegrations.filter((i) => !i.syncEnabled).length;

    const summary: HealthSummary = {
      totalIntegrations,
      activeIntegrations,
      disabledIntegrations,
      issues,
      healthyCount:
        activeIntegrations -
        issues.filter((i) => i.type === 'STALE_SYNC' || i.type === 'HIGH_FAILURE_RATE').length,
    };

    logger.info('Calendar sync health check completed', {
      totalIntegrations: summary.totalIntegrations,
      activeIntegrations: summary.activeIntegrations,
      disabledIntegrations: summary.disabledIntegrations,
      issuesFound: summary.issues.length,
      healthyCount: summary.healthyCount,
      duration: nowUTC().getTime() - startTime,
    });

    // Send email notification to admin if there are issues
    if (summary.issues.length > 0 && env.ADMIN_NOTIFICATION_EMAIL) {
      await sendHealthNotificationEmail(summary);
    }

    return Response.json({
      success: true,
      summary: {
        totalIntegrations: summary.totalIntegrations,
        activeIntegrations: summary.activeIntegrations,
        disabledIntegrations: summary.disabledIntegrations,
        healthyCount: summary.healthyCount,
        issuesFound: summary.issues.length,
        criticalIssues: summary.issues.filter((i) => i.severity === 'CRITICAL').length,
        highSeverityIssues: summary.issues.filter((i) => i.severity === 'HIGH').length,
        mediumSeverityIssues: summary.issues.filter((i) => i.severity === 'MEDIUM').length,
        lowSeverityIssues: summary.issues.filter((i) => i.severity === 'LOW').length,
      },
      issues: summary.issues.map((issue) => ({
        type: issue.type,
        providerId: issue.providerId,
        providerName: issue.providerName,
        severity: issue.severity,
        details: issue.details,
      })),
      duration: nowUTC().getTime() - startTime,
    });
  } catch (error) {
    logger.error('Calendar sync health monitoring failed', {
      error: error instanceof Error ? error.message : String(error),
      duration: nowUTC().getTime() - startTime,
    });

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Send health summary email to admin
 */
async function sendHealthNotificationEmail(summary: HealthSummary): Promise<void> {
  if (!env.ADMIN_NOTIFICATION_EMAIL) {
    return;
  }

  logger.info('Sending health monitoring notification to admin', {
    issuesCount: summary.issues.length,
  });

  try {
    // Group issues by severity
    const criticalIssues = summary.issues.filter((i) => i.severity === 'CRITICAL');
    const highIssues = summary.issues.filter((i) => i.severity === 'HIGH');
    const mediumIssues = summary.issues.filter((i) => i.severity === 'MEDIUM');
    const lowIssues = summary.issues.filter((i) => i.severity === 'LOW');

    // Build issue rows HTML
    const buildIssueRows = (issues: HealthIssue[], severityColor: string) => {
      return issues
        .map(
          (issue) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px;">
          <span style="display: inline-block; padding: 2px 8px; background-color: ${severityColor}; color: white; border-radius: 3px; font-size: 11px; font-weight: bold;">
            ${issue.severity}
          </span>
        </td>
        <td style="padding: 10px;">${issue.type.replace(/_/g, ' ')}</td>
        <td style="padding: 10px;">${issue.providerName}</td>
        <td style="padding: 10px; font-size: 12px; color: #666;">${issue.details}</td>
      </tr>
    `
        )
        .join('');
    };

    const allIssuesHtml = `
      ${criticalIssues.length > 0 ? buildIssueRows(criticalIssues, '#dc3545') : ''}
      ${highIssues.length > 0 ? buildIssueRows(highIssues, '#fd7e14') : ''}
      ${mediumIssues.length > 0 ? buildIssueRows(mediumIssues, '#ffc107') : ''}
      ${lowIssues.length > 0 ? buildIssueRows(lowIssues, '#6c757d') : ''}
    `;

    await sendEmail({
      to: env.ADMIN_NOTIFICATION_EMAIL,
      subject: `[MedBookings] Calendar Sync Health Report - ${summary.issues.length} Issues Found`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin-bottom: 20px; }
    .summary-box { background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 4px; padding: 15px; margin: 20px 0; }
    .stats { display: flex; justify-content: space-between; margin: 20px 0; }
    .stat { text-align: center; flex: 1; }
    .stat-value { font-size: 32px; font-weight: bold; color: #007bff; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #f5f5f5; font-weight: bold; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📊 Calendar Sync Health Report</h2>
      <p style="margin: 5px 0; color: #666;">Generated: ${nowUTC().toISOString()}</p>
    </div>

    <div class="summary-box">
      <strong>Overview:</strong><br>
      Found ${summary.issues.length} issues across ${summary.totalIntegrations} calendar integrations.
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-value" style="color: #28a745;">${summary.healthyCount}</div>
        <div class="stat-label">Healthy</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #dc3545;">${criticalIssues.length}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #fd7e14;">${highIssues.length}</div>
        <div class="stat-label">High</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #ffc107;">${mediumIssues.length}</div>
        <div class="stat-label">Medium</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #6c757d;">${lowIssues.length}</div>
        <div class="stat-label">Low</div>
      </div>
    </div>

    <h3>Issues Detected</h3>
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Type</th>
          <th>Provider</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${allIssuesHtml}
      </tbody>
    </table>

    <div class="summary-box" style="margin-top: 30px;">
      <strong>System Stats:</strong><br>
      • Total Integrations: ${summary.totalIntegrations}<br>
      • Active: ${summary.activeIntegrations}<br>
      • Disabled: ${summary.disabledIntegrations}<br>
      • Healthy: ${summary.healthyCount}
    </div>

    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      This is an automated health report. Review the issues and take appropriate action.
    </p>
  </div>
</body>
</html>
      `.trim(),
      text: `
Calendar Sync Health Report
Generated: ${nowUTC().toISOString()}

Overview:
Found ${summary.issues.length} issues across ${summary.totalIntegrations} calendar integrations.

Issue Summary:
- Critical: ${criticalIssues.length}
- High: ${highIssues.length}
- Medium: ${mediumIssues.length}
- Low: ${lowIssues.length}

Issues:
${summary.issues
  .map((issue) => `[${issue.severity}] ${issue.type} - ${issue.providerName}: ${issue.details}`)
  .join('\n')}

System Stats:
- Total Integrations: ${summary.totalIntegrations}
- Active: ${summary.activeIntegrations}
- Disabled: ${summary.disabledIntegrations}
- Healthy: ${summary.healthyCount}

This is an automated health report. Review the issues and take appropriate action.
      `.trim(),
    });

    logger.info('Health monitoring notification sent successfully');
  } catch (error) {
    logger.error('Failed to send health monitoring notification', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - email failure shouldn't prevent health check completion
  }
}
