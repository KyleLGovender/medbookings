/**
 * Background Calendar Sync Cron Job
 *
 * Automatically syncs Google Calendar for all active integrations
 * - Runs every 15 minutes (configured in vercel.json)
 * - Processes 50 integrations per run
 * - Uses INCREMENTAL_SYNC for efficiency
 * - Falls back to FULL_SYNC if sync token invalid
 * - Implements exponential backoff for failed syncs
 * - Auto-disables after MAX_SYNC_RETRIES consecutive failures
 *
 * Security: Requires CRON_SECRET environment variable
 */
import { type NextRequest } from 'next/server';

import { addMinutes } from 'date-fns';

import env from '@/config/env/server';
import {
  blockSlotsFromEvent,
  regenerateSlotsForProvider,
} from '@/features/calendar/lib/slot-blocking';
import {
  MAX_SYNC_RETRIES,
  calculateNextRetryAt,
  categorizeError,
  isRetryableError,
  notifyIntegrationDisabled,
} from '@/lib/calendar-sync-retry';
import { fetchGoogleCalendarEvents, processGoogleEvent } from '@/lib/google-calendar';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { nowUTC } from '@/lib/timezone';

// Maximum integrations to process per cron run
const BATCH_SIZE = 50;

// Sync interval in minutes
const SYNC_INTERVAL_MINUTES = parseInt(process.env.SYNC_INTERVAL_MINUTES || '15', 10);

interface SyncResult {
  providerId: string;
  status: 'success' | 'failed' | 'skipped';
  eventsProcessed?: number;
  error?: string;
  duration?: number;
}

/**
 * Background sync cron job handler
 * GET /api/cron/sync-calendars
 */
export async function GET(req: NextRequest) {
  const startTime = nowUTC().getTime();

  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  const expectedAuth = `Bearer ${env.CRON_SECRET || process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    logger.warn('Unauthorized cron job access attempt', {
      authHeader: authHeader ? 'present' : 'missing',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    });

    return new Response('Unauthorized', { status: 401 });
  }

  logger.info('Starting background calendar sync cron job', {
    batchSize: BATCH_SIZE,
    syncIntervalMinutes: SYNC_INTERVAL_MINUTES,
  });

  try {
    // Find integrations that are due for sync
    const dueForSyncTime = addMinutes(nowUTC(), -SYNC_INTERVAL_MINUTES);
    const now = nowUTC();

    const integrations = await prisma.calendarIntegration.findMany({
      where: {
        syncEnabled: true,
        backgroundSyncEnabled: true,
        // Only process if nextRetryAt is null or in the past
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lt: now } }],
        AND: [
          {
            OR: [
              { lastSyncedAt: null }, // Never synced
              { lastSyncedAt: { lt: dueForSyncTime } }, // Due for sync
            ],
          },
        ],
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            userId: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastSyncedAt: 'asc', // Prioritize least recently synced
      },
      take: BATCH_SIZE,
    });

    if (integrations.length === 0) {
      logger.info('No integrations due for sync', {
        duration: nowUTC().getTime() - startTime,
      });

      return Response.json({
        success: true,
        message: 'No integrations due for sync',
        processed: 0,
      });
    }

    logger.info('Found integrations to sync', {
      count: integrations.length,
      providers: integrations.map((i) => i.provider.id),
    });

    // Process each integration
    const results: SyncResult[] = [];

    for (const integration of integrations) {
      const syncStart = nowUTC().getTime();

      try {
        logger.info('Processing calendar sync', {
          providerId: integration.providerId,
          providerName: integration.provider.name,
          lastSyncedAt: integration.lastSyncedAt?.toISOString(),
        });

        // Determine sync type based on sync token availability
        const useSyncToken = !!integration.nextSyncToken;
        const operationType = useSyncToken ? 'INCREMENTAL_SYNC' : 'FULL_SYNC';

        // Create sync operation record
        const syncOp = await prisma.calendarSyncOperation.create({
          data: {
            calendarIntegrationId: integration.id,
            operationType,
            sourceSystem: 'SYSTEM', // Automated sync
            status: 'IN_PROGRESS',
            syncWindowStart: nowUTC(),
            syncWindowEnd: addMinutes(nowUTC(), 90), // 90-day window
            entityType: 'CALENDAR_EVENT',
          },
        });

        try {
          // Fetch events from Google Calendar
          const fetchResult = await fetchGoogleCalendarEvents(integration.id, {
            timeMin: nowUTC(),
            timeMax: addMinutes(nowUTC(), 90 * 24 * 60), // 90 days
            syncToken: useSyncToken ? integration.nextSyncToken : null,
          });

          logger.info('Fetched events from Google Calendar', {
            providerId: integration.providerId,
            eventCount: fetchResult.events.length,
            usedSyncToken: useSyncToken,
          });

          // Process events in transaction
          await prisma.$transaction(
            async (tx) => {
              let eventsSucceeded = 0;
              let eventsFailed = 0;

              for (const googleEvent of fetchResult.events) {
                try {
                  // Process event into CalendarEvent record
                  const eventData = await processGoogleEvent(googleEvent, integration.id);

                  // Upsert CalendarEvent
                  const calendarEvent = await tx.calendarEvent.upsert({
                    where: {
                      calendarIntegrationId_externalEventId: {
                        calendarIntegrationId: integration.id,
                        externalEventId: googleEvent.id,
                      },
                    },
                    update: {
                      title: eventData.title,
                      startTime: eventData.startTime,
                      endTime: eventData.endTime,
                      isAllDay: eventData.isAllDay,
                      etag: eventData.etag,
                      lastSyncedAt: eventData.lastSyncedAt,
                      syncStatus: eventData.syncStatus,
                    },
                    create: eventData,
                  });

                  // Block overlapping slots if this event blocks availability
                  if (eventData.blocksAvailability) {
                    await blockSlotsFromEvent(calendarEvent.id, integration.providerId, tx);
                  }

                  eventsSucceeded++;
                } catch (error) {
                  eventsFailed++;
                  logger.error('Failed to process calendar event in cron', {
                    providerId: integration.providerId,
                    eventId: googleEvent.id,
                    error: error instanceof Error ? error.message : String(error),
                  });
                }
              }

              // Update integration sync metadata
              await tx.calendarIntegration.update({
                where: { id: integration.id },
                data: {
                  lastSyncedAt: nowUTC(),
                  nextSyncToken: fetchResult.nextSyncToken || integration.nextSyncToken,
                  syncFailureCount: 0, // Reset on successful sync
                  nextRetryAt: null, // Clear retry timestamp
                  lastErrorType: null, // Clear error type
                  ...(operationType === 'FULL_SYNC' && {
                    lastFullSyncAt: nowUTC(),
                  }),
                },
              });

              // Update sync operation
              await tx.calendarSyncOperation.update({
                where: { id: syncOp.id },
                data: {
                  status: 'SUCCESS',
                  completedAt: nowUTC(),
                  eventsProcessed: fetchResult.events.length,
                  eventsSucceeded,
                  eventsFailed,
                },
              });
            },
            {
              maxWait: 10000,
              timeout: 60000,
            }
          );

          // Regenerate slots after sync
          await regenerateSlotsForProvider(integration.providerId);

          const syncDuration = nowUTC().getTime() - syncStart;

          results.push({
            providerId: integration.providerId,
            status: 'success',
            eventsProcessed: fetchResult.events.length,
            duration: syncDuration,
          });

          logger.info('Calendar sync completed successfully', {
            providerId: integration.providerId,
            eventsProcessed: fetchResult.events.length,
            duration: syncDuration,
          });
        } catch (syncError) {
          // Mark sync operation as failed
          await prisma.calendarSyncOperation.update({
            where: { id: syncOp.id },
            data: {
              status: 'FAILED',
              completedAt: nowUTC(),
              errorMessage: syncError instanceof Error ? syncError.message : String(syncError),
              retryCount: { increment: 1 },
            },
          });

          // Increment integration failure count
          await prisma.calendarIntegration.update({
            where: { id: integration.id },
            data: {
              syncFailureCount: { increment: 1 },
            },
          });

          throw syncError; // Re-throw to be caught by outer catch
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorType = categorizeError(error instanceof Error ? error : String(error));
        const shouldRetry = isRetryableError(errorType);

        results.push({
          providerId: integration.providerId,
          status: 'failed',
          error: errorMessage,
          duration: nowUTC().getTime() - syncStart,
        });

        logger.error('Calendar sync failed in cron job', {
          providerId: integration.providerId,
          providerName: integration.provider.name,
          error: errorMessage,
          errorType,
          shouldRetry,
        });

        // Fetch updated integration to get current failure count
        const updatedIntegration = await prisma.calendarIntegration.findUnique({
          where: { id: integration.id },
          select: { syncFailureCount: true },
        });

        if (!updatedIntegration) {
          logger.error('Integration not found after failure', {
            integrationId: integration.id,
          });
          continue;
        }

        const newFailureCount = updatedIntegration.syncFailureCount;

        // Check if we should disable sync after repeated failures
        if (newFailureCount >= MAX_SYNC_RETRIES) {
          await prisma.calendarIntegration.update({
            where: { id: integration.id },
            data: {
              syncEnabled: false,
              backgroundSyncEnabled: false,
              nextRetryAt: null,
              lastErrorType: errorType,
            },
          });

          logger.warn('Calendar sync disabled after repeated failures', {
            providerId: integration.providerId,
            failureCount: newFailureCount,
            errorType,
          });

          // Send email notification to provider
          const providerEmail = integration.provider.user?.email;
          if (providerEmail) {
            await notifyIntegrationDisabled({
              providerId: integration.providerId,
              providerName: integration.provider.name,
              providerEmail,
              failureCount: newFailureCount,
              lastError: errorMessage,
            });
          } else {
            // phi-safe: logging providerId only, not actual email
            logger.warn('Cannot send disabled notification - provider email not found', {
              providerId: integration.providerId,
            });
          }
        } else if (shouldRetry) {
          // Calculate next retry time with exponential backoff
          const nextRetryAt = calculateNextRetryAt(newFailureCount);

          await prisma.calendarIntegration.update({
            where: { id: integration.id },
            data: {
              nextRetryAt,
              lastErrorType: errorType,
            },
          });

          logger.info('Scheduled retry with exponential backoff', {
            providerId: integration.providerId,
            failureCount: newFailureCount,
            nextRetryAt: nextRetryAt.toISOString(),
            errorType,
          });
        } else {
          // Non-retryable error - disable immediately
          await prisma.calendarIntegration.update({
            where: { id: integration.id },
            data: {
              syncEnabled: false,
              backgroundSyncEnabled: false,
              nextRetryAt: null,
              lastErrorType: errorType,
            },
          });

          logger.warn('Calendar sync disabled due to non-retryable error', {
            providerId: integration.providerId,
            errorType,
            error: errorMessage,
          });

          // Send email notification
          const providerEmail = integration.provider.user?.email;
          if (providerEmail) {
            await notifyIntegrationDisabled({
              providerId: integration.providerId,
              providerName: integration.provider.name,
              providerEmail,
              failureCount: newFailureCount,
              lastError: errorMessage,
            });
          }
        }

        // Continue processing other integrations (don't let one failure stop the job)
        continue;
      }
    }

    // ========================================================================
    // ORGANIZATION CALENDAR SYNC (separate batch - 50 items)
    // ========================================================================

    logger.info('Starting organization calendar sync batch');

    const orgIntegrations = await prisma.organizationCalendarIntegration.findMany({
      where: {
        syncEnabled: true,
        backgroundSyncEnabled: true,
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lt: now } }],
        AND: [
          {
            OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: dueForSyncTime } }],
          },
        ],
      },
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
      orderBy: {
        lastSyncedAt: 'asc',
      },
      take: BATCH_SIZE, // Separate batch: 50 organizations
    });

    const orgResults: SyncResult[] = [];

    for (const orgIntegration of orgIntegrations) {
      const syncStart = nowUTC().getTime();

      try {
        logger.info('Processing organization calendar sync', {
          organizationId: orgIntegration.organizationId,
          locationId: orgIntegration.locationId,
          organizationName: orgIntegration.organization.name,
        });

        const useSyncToken = !!orgIntegration.nextSyncToken;
        const operationType = useSyncToken ? 'INCREMENTAL_SYNC' : 'FULL_SYNC';

        const syncOp = await prisma.organizationCalendarSyncOperation.create({
          data: {
            organizationCalendarIntegrationId: orgIntegration.id,
            operationType,
            sourceSystem: 'SYSTEM',
            status: 'IN_PROGRESS',
            syncWindowStart: nowUTC(),
            syncWindowEnd: addMinutes(nowUTC(), 90),
            entityType: 'CALENDAR_EVENT',
          },
        });

        try {
          const fetchResult = await fetchGoogleCalendarEvents(orgIntegration.id, {
            timeMin: nowUTC(),
            timeMax: addMinutes(nowUTC(), 90 * 24 * 60),
            syncToken: useSyncToken ? orgIntegration.nextSyncToken : null,
          });

          await prisma.$transaction(
            async (tx) => {
              let eventsSucceeded = 0;
              let eventsFailed = 0;

              for (const googleEvent of fetchResult.events) {
                try {
                  const eventData = await processGoogleEvent(googleEvent, orgIntegration.id);

                  const calendarEvent = await tx.organizationCalendarEvent.upsert({
                    where: {
                      organizationCalendarIntegrationId_externalEventId: {
                        organizationCalendarIntegrationId: orgIntegration.id,
                        externalEventId: googleEvent.id,
                      },
                    },
                    update: {
                      title: eventData.title,
                      startTime: eventData.startTime,
                      endTime: eventData.endTime,
                      isAllDay: eventData.isAllDay,
                      etag: eventData.etag,
                      lastSyncedAt: eventData.lastSyncedAt,
                      syncStatus: eventData.syncStatus,
                    },
                    create: {
                      organizationCalendarIntegrationId: orgIntegration.id,
                      externalEventId: eventData.externalEventId,
                      externalCalendarId: eventData.externalCalendarId,
                      etag: eventData.etag,
                      title: eventData.title,
                      startTime: eventData.startTime,
                      endTime: eventData.endTime,
                      isAllDay: eventData.isAllDay,
                      lastSyncedAt: eventData.lastSyncedAt,
                      eventType: eventData.eventType,
                      blocksAvailability: eventData.blocksAvailability,
                      syncStatus: eventData.syncStatus,
                      lastModifiedInExternal: eventData.lastModifiedInExternal,
                      version: eventData.version,
                    },
                  });

                  // Only block if locationId is set
                  if (eventData.blocksAvailability && orgIntegration.locationId) {
                    await tx.calculatedAvailabilitySlot.updateMany({
                      where: {
                        availability: {
                          organizationId: orgIntegration.organizationId,
                          locationId: orgIntegration.locationId,
                        },
                        startTime: { lt: eventData.endTime },
                        endTime: { gt: eventData.startTime },
                        status: 'AVAILABLE',
                      },
                      data: {
                        status: 'BLOCKED',
                        blockedByOrgEventId: calendarEvent.id,
                      },
                    });
                  }

                  eventsSucceeded++;
                } catch (error) {
                  eventsFailed++;
                  logger.error('Failed to process org calendar event in cron', {
                    organizationId: orgIntegration.organizationId,
                    eventId: googleEvent.id,
                    error: error instanceof Error ? error.message : String(error),
                  });
                }
              }

              await tx.organizationCalendarIntegration.update({
                where: { id: orgIntegration.id },
                data: {
                  lastSyncedAt: nowUTC(),
                  nextSyncToken: fetchResult.nextSyncToken || orgIntegration.nextSyncToken,
                  syncFailureCount: 0,
                  nextRetryAt: null,
                  lastErrorType: null,
                  ...(operationType === 'FULL_SYNC' && {
                    lastFullSyncAt: nowUTC(),
                  }),
                },
              });

              await tx.organizationCalendarSyncOperation.update({
                where: { id: syncOp.id },
                data: {
                  status: 'SUCCESS',
                  completedAt: nowUTC(),
                  eventsProcessed: fetchResult.events.length,
                  eventsSucceeded,
                  eventsFailed,
                },
              });
            },
            {
              maxWait: 10000,
              timeout: 60000,
            }
          );

          const syncDuration = nowUTC().getTime() - syncStart;

          orgResults.push({
            providerId: `org-${orgIntegration.organizationId}`,
            status: 'success',
            eventsProcessed: fetchResult.events.length,
            duration: syncDuration,
          });

          logger.info('Organization calendar sync completed', {
            organizationId: orgIntegration.organizationId,
            eventsProcessed: fetchResult.events.length,
          });
        } catch (syncError) {
          await prisma.organizationCalendarSyncOperation.update({
            where: { id: syncOp.id },
            data: {
              status: 'FAILED',
              completedAt: nowUTC(),
              errorMessage: syncError instanceof Error ? syncError.message : String(syncError),
              retryCount: { increment: 1 },
            },
          });

          await prisma.organizationCalendarIntegration.update({
            where: { id: orgIntegration.id },
            data: {
              syncFailureCount: { increment: 1 },
            },
          });

          throw syncError;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorType = categorizeError(error instanceof Error ? error : String(error));
        const shouldRetry = isRetryableError(errorType);

        orgResults.push({
          providerId: `org-${orgIntegration.organizationId}`,
          status: 'failed',
          error: errorMessage,
          duration: nowUTC().getTime() - syncStart,
        });

        logger.error('Organization calendar sync failed in cron', {
          organizationId: orgIntegration.organizationId,
          error: errorMessage,
          errorType,
        });

        const updatedIntegration = await prisma.organizationCalendarIntegration.findUnique({
          where: { id: orgIntegration.id },
          select: { syncFailureCount: true },
        });

        if (updatedIntegration && updatedIntegration.syncFailureCount >= MAX_SYNC_RETRIES) {
          await prisma.organizationCalendarIntegration.update({
            where: { id: orgIntegration.id },
            data: {
              syncEnabled: false,
              backgroundSyncEnabled: false,
              nextRetryAt: null,
              lastErrorType: errorType,
            },
          });

          logger.warn('Organization calendar sync disabled after failures', {
            organizationId: orgIntegration.organizationId,
            failureCount: updatedIntegration.syncFailureCount,
          });
        } else if (shouldRetry) {
          const nextRetryAt = calculateNextRetryAt(updatedIntegration?.syncFailureCount || 0);

          await prisma.organizationCalendarIntegration.update({
            where: { id: orgIntegration.id },
            data: {
              nextRetryAt,
              lastErrorType: errorType,
            },
          });
        } else {
          await prisma.organizationCalendarIntegration.update({
            where: { id: orgIntegration.id },
            data: {
              syncEnabled: false,
              backgroundSyncEnabled: false,
              nextRetryAt: null,
              lastErrorType: errorType,
            },
          });
        }

        continue;
      }
    }

    // Calculate summary statistics (provider + organization)
    const providerSuccess = results.filter((r) => r.status === 'success').length;
    const providerFailed = results.filter((r) => r.status === 'failed').length;
    const providerEvents = results
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + (r.eventsProcessed || 0), 0);

    const orgSuccess = orgResults.filter((r) => r.status === 'success').length;
    const orgFailed = orgResults.filter((r) => r.status === 'failed').length;
    const orgEvents = orgResults
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + (r.eventsProcessed || 0), 0);

    const totalDuration = nowUTC().getTime() - startTime;

    logger.info('Background calendar sync cron job completed', {
      providerIntegrations: integrations.length,
      providerSuccess,
      providerFailed,
      organizationIntegrations: orgIntegrations.length,
      orgSuccess,
      orgFailed,
      totalEventsProcessed: providerEvents + orgEvents,
      duration: totalDuration,
    });

    return Response.json({
      success: true,
      summary: {
        providers: {
          processed: integrations.length,
          succeeded: providerSuccess,
          failed: providerFailed,
          eventsProcessed: providerEvents,
        },
        organizations: {
          processed: orgIntegrations.length,
          succeeded: orgSuccess,
          failed: orgFailed,
          eventsProcessed: orgEvents,
        },
        totalEventsProcessed: providerEvents + orgEvents,
        duration: totalDuration,
      },
      providerResults: results.map((r) => ({
        providerId: r.providerId,
        status: r.status,
        eventsProcessed: r.eventsProcessed,
        error: r.error,
      })),
      organizationResults: orgResults.map((r) => ({
        organizationId: r.providerId,
        status: r.status,
        eventsProcessed: r.eventsProcessed,
        error: r.error,
      })),
    });
  } catch (error) {
    logger.error('Background calendar sync cron job failed', {
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
