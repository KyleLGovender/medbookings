/**
 * Calendar Sync tRPC Router
 *
 * Handles bidirectional Google Calendar integration:
 * - Import: Fetch Google Calendar events → Block MedBookings slots
 * - Export: Create Google Calendar events from MedBookings bookings
 * - Sync Operations: Track sync history and status
 *
 * CRITICAL: All operations use transactions for data consistency
 */
import { TRPCError } from '@trpc/server';
import { addDays } from 'date-fns';
import { z } from 'zod';

import {
  blockSlotsFromEvent,
  regenerateSlotsForProvider,
  unblockSlotsFromEvent,
} from '@/features/calendar/lib/slot-blocking';
import {
  createGoogleEventFromBooking,
  deleteGoogleEvent,
  fetchGoogleCalendarEvents,
  processGoogleEvent,
  revokeGoogleCalendarToken,
  revokeOrganizationCalendarToken,
  updateGoogleEvent,
} from '@/lib/google-calendar';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { nowUTC, parseUTC } from '@/lib/timezone';
import { adminProcedure, createTRPCRouter, protectedProcedure } from '@/server/trpc';

// ============================================================================
// Input Schemas
// ============================================================================

const syncGoogleCalendarSchema = z.object({
  providerId: z.string().cuid(),
  operationType: z.enum(['FULL_SYNC', 'INCREMENTAL_SYNC']),
  syncWindowDays: z.number().int().min(7).max(365).default(90),
});

const exportBookingSchema = z.object({
  bookingId: z.string().cuid(),
});

const getSyncStatusSchema = z.object({
  providerId: z.string().cuid(),
  limit: z.number().int().min(1).max(100).default(20),
});

const cancelSyncSchema = z.object({
  syncOperationId: z.string().cuid(),
});

// Organization sync schemas
const syncOrganizationCalendarSchema = z.object({
  organizationId: z.string().cuid(),
  locationId: z.string().cuid().optional(),
  operationType: z.enum(['FULL_SYNC', 'INCREMENTAL_SYNC']),
  syncWindowDays: z.number().int().min(7).max(365).default(90),
});

const getOrganizationSyncStatusSchema = z.object({
  organizationId: z.string().cuid(),
  locationId: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

const exportOrganizationBookingSchema = z.object({
  bookingId: z.string().cuid(),
});

const cancelOrganizationSyncSchema = z.object({
  syncOperationId: z.string().cuid(),
});

// Disconnect schemas
const disconnectProviderCalendarSchema = z.object({
  providerId: z.string().cuid(),
});

const disconnectOrganizationCalendarSchema = z.object({
  organizationId: z.string().cuid(),
  locationId: z.string().cuid().optional(),
});

const disconnectAllOrganizationCalendarsSchema = z.object({
  organizationId: z.string().cuid(),
});

// ============================================================================
// Router
// ============================================================================

export const calendarSyncRouter = createTRPCRouter({
  // ==========================================================================
  // Import Operations (Google → MedBookings)
  // ==========================================================================

  /**
   * Sync Google Calendar events into MedBookings
   * - FULL_SYNC: Fetch all events in time window
   * - INCREMENTAL_SYNC: Use nextSyncToken to fetch only changes
   */
  syncGoogleCalendar: protectedProcedure
    .input(syncGoogleCalendarSchema)
    .mutation(async ({ ctx, input }) => {
      const { providerId, operationType, syncWindowDays } = input;

      // Verify user owns this provider
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: providerId },
        include: { calendarIntegration: true },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      if (provider.userId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to sync this provider calendar',
        });
      }

      const integration = provider.calendarIntegration;

      if (!integration) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Google Calendar not integrated for this provider',
        });
      }

      if (!integration.syncEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Calendar sync is disabled for this provider',
        });
      }

      // Check sync direction
      if (integration.syncDirection === 'EXPORT_ONLY') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Import not enabled - sync direction is EXPORT_ONLY',
        });
      }

      logger.info('Starting Google Calendar sync', {
        providerId,
        operationType,
        syncDirection: integration.syncDirection,
        lastSyncedAt: integration.lastSyncedAt?.toISOString(),
      });

      // Create sync operation record
      const syncOp = await ctx.prisma.calendarSyncOperation.create({
        data: {
          calendarIntegrationId: integration.id,
          operationType,
          sourceSystem: 'GOOGLE_CALENDAR',
          status: 'IN_PROGRESS',
          syncWindowStart: nowUTC(),
          syncWindowEnd: addDays(nowUTC(), syncWindowDays),
          entityType: 'CALENDAR_EVENT',
        },
      });

      try {
        // Determine if we use sync token
        const useSyncToken = operationType === 'INCREMENTAL_SYNC' && integration.nextSyncToken;

        // Fetch events from Google Calendar
        const fetchResult = await fetchGoogleCalendarEvents(integration.id, {
          timeMin: nowUTC(),
          timeMax: addDays(nowUTC(), syncWindowDays),
          syncToken: useSyncToken ? integration.nextSyncToken : null,
        });

        logger.info('Fetched Google Calendar events', {
          providerId,
          eventCount: fetchResult.events.length,
          usedSyncToken: useSyncToken,
          nextSyncToken: !!fetchResult.nextSyncToken,
        });

        // Process events in transaction
        await ctx.prisma.$transaction(
          async (tx) => {
            let eventsProcessed = 0;
            let eventsSucceeded = 0;
            let eventsFailed = 0;

            for (const googleEvent of fetchResult.events) {
              eventsProcessed++;

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
                  await blockSlotsFromEvent(calendarEvent.id, providerId, tx);
                }

                eventsSucceeded++;
              } catch (error) {
                eventsFailed++;
                logger.error('Failed to process calendar event', {
                  providerId,
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
                eventsProcessed,
                eventsSucceeded,
                eventsFailed,
              },
            });

            logger.info('Google Calendar sync completed successfully', {
              providerId,
              eventsProcessed,
              eventsSucceeded,
              eventsFailed,
              syncOperationId: syncOp.id,
            });
          },
          {
            maxWait: 10000,
            timeout: 60000, // 60 seconds for sync operation
          }
        );

        // After transaction, regenerate slots to ensure blocking is applied
        await regenerateSlotsForProvider(providerId);

        return {
          success: true,
          syncOperationId: syncOp.id,
          eventsProcessed: fetchResult.events.length,
        };
      } catch (error) {
        // Mark sync operation as failed
        await ctx.prisma.calendarSyncOperation.update({
          where: { id: syncOp.id },
          data: {
            status: 'FAILED',
            completedAt: nowUTC(),
            errorMessage: error instanceof Error ? error.message : String(error),
            retryCount: { increment: 1 },
          },
        });

        // Increment integration failure count
        await ctx.prisma.calendarIntegration.update({
          where: { id: integration.id },
          data: {
            syncFailureCount: { increment: 1 },
          },
        });

        logger.error('Google Calendar sync failed', {
          providerId,
          syncOperationId: syncOp.id,
          error: error instanceof Error ? error.message : String(error),
        });

        // Check if sync token is invalid (need full sync)
        if (error instanceof Error && error.message === 'SYNC_TOKEN_INVALID') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Sync token invalid - please run FULL_SYNC',
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync Google Calendar',
          cause: error,
        });
      }
    }),

  /**
   * Get sync operation status and history
   */
  getSyncStatus: protectedProcedure.input(getSyncStatusSchema).query(async ({ ctx, input }) => {
    const { providerId, limit } = input;

    // Verify user owns this provider
    const provider = await ctx.prisma.provider.findUnique({
      where: { id: providerId },
      select: { userId: true },
    });

    if (!provider) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Provider not found',
      });
    }

    if (provider.userId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to view this provider calendar status',
      });
    }

    // Get integration
    const integration = await ctx.prisma.calendarIntegration.findUnique({
      where: { providerId },
    });

    if (!integration) {
      return {
        integration: null,
        recentOperations: [],
        stats: {
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
        },
      };
    }

    // Get recent sync operations
    const recentOperations = await ctx.prisma.calendarSyncOperation.findMany({
      where: { calendarIntegrationId: integration.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get operation stats
    const [totalOperations, successfulOperations, failedOperations] = await Promise.all([
      ctx.prisma.calendarSyncOperation.count({
        where: { calendarIntegrationId: integration.id },
      }),
      ctx.prisma.calendarSyncOperation.count({
        where: {
          calendarIntegrationId: integration.id,
          status: 'SUCCESS',
        },
      }),
      ctx.prisma.calendarSyncOperation.count({
        where: {
          calendarIntegrationId: integration.id,
          status: 'FAILED',
        },
      }),
    ]);

    return {
      integration,
      recentOperations,
      stats: {
        totalOperations,
        successfulOperations,
        failedOperations,
      },
    };
  }),

  /**
   * Cancel in-progress sync operation
   * NOTE: Limited effectiveness - can only mark as cancelled, cannot stop ongoing API calls
   */
  cancelSync: protectedProcedure.input(cancelSyncSchema).mutation(async ({ ctx, input }) => {
    const syncOp = await ctx.prisma.calendarSyncOperation.findUnique({
      where: { id: input.syncOperationId },
      include: {
        calendarIntegration: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!syncOp) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Sync operation not found',
      });
    }

    // Verify user owns this provider
    if (
      syncOp.calendarIntegration.provider.userId !== ctx.session.user.id &&
      ctx.session.user.role !== 'ADMIN'
    ) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to cancel this sync operation',
      });
    }

    if (syncOp.status !== 'IN_PROGRESS') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Sync operation is not in progress',
      });
    }

    await ctx.prisma.calendarSyncOperation.update({
      where: { id: input.syncOperationId },
      data: {
        status: 'FAILED',
        completedAt: nowUTC(),
        errorMessage: 'Cancelled by user',
      },
    });

    logger.info('Sync operation cancelled', {
      syncOperationId: input.syncOperationId,
      providerId: syncOp.calendarIntegration.providerId,
    });

    return { success: true };
  }),

  /**
   * Disconnect provider calendar integration
   * - Revokes OAuth tokens with Google
   * - Soft-deletes integration (keeps historical records)
   * - Unblocks all slots that were blocked by calendar events
   */
  disconnectProviderCalendar: protectedProcedure
    .input(disconnectProviderCalendarSchema)
    .mutation(async ({ ctx, input }) => {
      const { providerId } = input;

      // Verify user owns this provider
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: providerId },
        include: { calendarIntegration: true },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      if (provider.userId !== ctx.session.user.id && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to disconnect this provider calendar',
        });
      }

      const integration = provider.calendarIntegration;

      if (!integration) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No calendar integration found for this provider',
        });
      }

      logger.info('Disconnecting provider calendar integration', {
        providerId,
        integrationId: integration.id,
        googleEmail: integration.googleEmail,
      });

      // Revoke OAuth tokens with Google
      try {
        await revokeGoogleCalendarToken(integration.id);
      } catch (error) {
        // Log but continue - token may already be invalid
        logger.warn('Token revocation failed during disconnect', {
          providerId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Soft-delete integration and unblock slots in transaction
      const result = await ctx.prisma.$transaction(
        async (tx) => {
          // Soft-delete integration (disable sync, keep historical records)
          await tx.calendarIntegration.update({
            where: { id: integration.id },
            data: {
              syncEnabled: false,
            },
          });

          // Find all calendar events for this integration
          const calendarEvents = await tx.calendarEvent.findMany({
            where: { calendarIntegrationId: integration.id },
            select: { id: true },
            take: 10000, // Pagination: Delete calendar events helper - bounded by integration FK (typical max ~1000 events)
          });

          // Unblock all slots that were blocked by these events
          const unblockedSlots = await tx.calculatedAvailabilitySlot.updateMany({
            where: {
              blockedByEventId: { in: calendarEvents.map((e) => e.id) },
              status: 'BLOCKED',
            },
            data: {
              status: 'AVAILABLE',
              blockedByEventId: null,
            },
          });

          logger.info('Provider calendar disconnected successfully', {
            providerId,
            integrationId: integration.id,
            slotsUnblocked: unblockedSlots.count,
          });

          return {
            success: true,
            slotsUnblocked: unblockedSlots.count,
          };
        },
        {
          maxWait: 10000,
          timeout: 30000,
        }
      );

      return result;
    }),

  // ==========================================================================
  // Export Operations (MedBookings → Google)
  // ==========================================================================

  /**
   * Export MedBookings booking to Google Calendar
   * Creates Google Calendar event with Meet link if online
   */
  exportBookingToGoogle: protectedProcedure
    .input(exportBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          slot: {
            include: {
              service: true,
              availability: {
                include: {
                  provider: {
                    include: {
                      user: true,
                      calendarIntegration: true,
                    },
                  },
                },
              },
            },
          },
          client: true,
        },
      });

      if (!booking || !booking.slot) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      // Type narrowing: After null check, TypeScript knows slot is not null
      // Create properly typed variable for type safety
      const bookingWithSlot = booking as typeof booking & {
        slot: NonNullable<typeof booking.slot>;
      };

      const provider = bookingWithSlot.slot.availability.provider;
      const integration = provider.calendarIntegration;

      // Verify authorization
      const isOwner = provider.userId === ctx.session.user.id;
      const isClient = booking.client?.id === ctx.session.user.id;
      const isAdmin = ctx.session.user.role === 'ADMIN';

      if (!isOwner && !isClient && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to export this booking',
        });
      }

      if (!integration) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Google Calendar not integrated for this provider',
        });
      }

      if (integration.syncDirection === 'IMPORT_ONLY') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Export not enabled - sync direction is IMPORT_ONLY',
        });
      }

      logger.info('Exporting booking to Google Calendar', {
        bookingId: booking.id,
        providerId: provider.id,
        isOnline: booking.isOnline,
      });

      try {
        // Create Google Calendar event
        // Type-safe: bookingWithSlot has all required fields for createGoogleEventFromBooking
        // booking.slot.{startTime, endTime, service.name, availability.provider.{name, user.email}}
        // booking.client.{name, email}
        const result = await createGoogleEventFromBooking(bookingWithSlot, integration.id);

        // Store reference in CalendarEvent
        await ctx.prisma.calendarEvent.create({
          data: {
            calendarIntegrationId: integration.id,
            externalEventId: result.eventId,
            externalCalendarId: integration.calendarId!,
            title: `MedBookings: ${booking.slot.service.name}`,
            startTime: booking.slot.startTime,
            endTime: booking.slot.endTime,
            isAllDay: false,
            blocksAvailability: true,
            syncStatus: 'SYNCED',
            lastSyncedAt: nowUTC(),
          },
        });

        // Update booking with Meet link if created
        if (result.meetLink) {
          await ctx.prisma.booking.update({
            where: { id: booking.id },
            data: { meetLink: result.meetLink },
          });
        }

        logger.info('Booking exported to Google Calendar successfully', {
          bookingId: booking.id,
          eventId: result.eventId,
          meetLinkCreated: !!result.meetLink,
        });

        return {
          success: true,
          eventId: result.eventId,
          meetLink: result.meetLink,
        };
      } catch (error) {
        logger.error('Failed to export booking to Google Calendar', {
          bookingId: booking.id,
          providerId: provider.id,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export booking to Google Calendar',
          cause: error,
        });
      }
    }),

  /**
   * Update Google Calendar event when booking is modified
   */
  updateGoogleEventForBooking: protectedProcedure
    .input(exportBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          slot: {
            include: {
              service: true,
              availability: {
                include: {
                  provider: {
                    include: {
                      calendarIntegration: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!booking || !booking.slot) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      const provider = booking.slot.availability.provider;
      const integration = provider.calendarIntegration;

      if (!integration) {
        return { success: false, reason: 'No calendar integration' };
      }

      // Find corresponding CalendarEvent
      const calendarEvent = await ctx.prisma.calendarEvent.findFirst({
        where: {
          calendarIntegrationId: integration.id,
          title: { contains: `MedBookings: ${booking.slot.service.name}` },
          startTime: booking.slot.startTime,
        },
      });

      if (!calendarEvent) {
        logger.warn('No corresponding Google Calendar event found', {
          bookingId: booking.id,
        });
        return { success: false, reason: 'Event not found in Google Calendar' };
      }

      try {
        // If booking is cancelled, delete the event
        if (booking.status === 'CANCELLED') {
          await deleteGoogleEvent(integration.id, calendarEvent.externalEventId);

          await ctx.prisma.calendarEvent.delete({
            where: { id: calendarEvent.id },
          });

          logger.info('Deleted Google Calendar event for cancelled booking', {
            bookingId: booking.id,
            eventId: calendarEvent.externalEventId,
          });

          return { success: true, action: 'deleted' };
        }

        // Otherwise, update the event
        await updateGoogleEvent(integration.id, calendarEvent.externalEventId, {
          summary: `MedBookings: ${booking.slot.service.name} (${booking.status})`,
          startTime: booking.slot.startTime,
          endTime: booking.slot.endTime,
        });

        await ctx.prisma.calendarEvent.update({
          where: { id: calendarEvent.id },
          data: {
            lastSyncedAt: nowUTC(),
          },
        });

        logger.info('Updated Google Calendar event for booking', {
          bookingId: booking.id,
          eventId: calendarEvent.externalEventId,
        });

        return { success: true, action: 'updated' };
      } catch (error) {
        logger.error('Failed to update Google Calendar event', {
          bookingId: booking.id,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update Google Calendar event',
          cause: error,
        });
      }
    }),

  // ==========================================================================
  // Admin Operations
  // ==========================================================================

  /**
   * Admin: Get all sync operations across all providers
   */
  getAllSyncOperations: adminProcedure
    .input(
      z.object({
        status: z
          .enum(['PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'CONFLICT_DETECTED'])
          .optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const operations = await ctx.prisma.calendarSyncOperation.findMany({
        where: input.status ? { status: input.status } : undefined,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        include: {
          calendarIntegration: {
            include: {
              provider: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return operations;
    }),

  // ==========================================================================
  // Organization Calendar Sync Operations
  // ==========================================================================

  /**
   * Sync Organization Google Calendar events into MedBookings
   * - Similar to provider sync but with organization/location scope
   * - Requires organization ADMIN or OWNER role
   */
  syncOrganizationCalendar: protectedProcedure
    .input(syncOrganizationCalendarSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, locationId, operationType, syncWindowDays } = input;

      // Verify user is organization admin or owner
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Organization admin or owner access required',
        });
      }

      // Get organization calendar integration
      const integration = await ctx.prisma.organizationCalendarIntegration.findFirst({
        where: {
          organizationId,
          locationId: locationId || null,
        },
      });

      if (!integration) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: locationId
            ? 'Google Calendar not integrated for this location'
            : 'Google Calendar not integrated for this organization',
        });
      }

      if (!integration.syncEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Calendar sync is disabled for this integration',
        });
      }

      if (integration.syncDirection === 'EXPORT_ONLY') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Import not enabled - sync direction is EXPORT_ONLY',
        });
      }

      logger.info('Starting organization Google Calendar sync', {
        organizationId,
        locationId,
        operationType,
        lastSyncedAt: integration.lastSyncedAt?.toISOString(),
      });

      // Create sync operation record
      const syncOp = await ctx.prisma.organizationCalendarSyncOperation.create({
        data: {
          organizationCalendarIntegrationId: integration.id,
          operationType,
          sourceSystem: 'GOOGLE_CALENDAR',
          status: 'IN_PROGRESS',
          syncWindowStart: nowUTC(),
          syncWindowEnd: addDays(nowUTC(), syncWindowDays),
          entityType: 'CALENDAR_EVENT',
        },
      });

      try {
        const useSyncToken = operationType === 'INCREMENTAL_SYNC' && integration.nextSyncToken;

        const fetchResult = await fetchGoogleCalendarEvents(integration.id, {
          timeMin: nowUTC(),
          timeMax: addDays(nowUTC(), syncWindowDays),
          syncToken: useSyncToken ? integration.nextSyncToken : null,
        });

        logger.info('Fetched organization calendar events', {
          organizationId,
          locationId,
          eventCount: fetchResult.events.length,
          usedSyncToken: useSyncToken,
        });

        await ctx.prisma.$transaction(
          async (tx) => {
            let eventsProcessed = 0;
            let eventsSucceeded = 0;
            let eventsFailed = 0;

            for (const googleEvent of fetchResult.events) {
              eventsProcessed++;

              try {
                const eventData = await processGoogleEvent(googleEvent, integration.id);

                const calendarEvent = await tx.organizationCalendarEvent.upsert({
                  where: {
                    organizationCalendarIntegrationId_externalEventId: {
                      organizationCalendarIntegrationId: integration.id,
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
                    organizationCalendarIntegrationId: integration.id,
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

                // Only block slots if locationId is set (per user requirement)
                // locationId = NULL means informational only
                if (eventData.blocksAvailability && locationId) {
                  // Block slots at this specific location
                  await tx.calculatedAvailabilitySlot.updateMany({
                    where: {
                      availability: {
                        organizationId,
                        locationId,
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
                logger.error('Failed to process organization calendar event', {
                  organizationId,
                  locationId,
                  eventId: googleEvent.id,
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }

            await tx.organizationCalendarIntegration.update({
              where: { id: integration.id },
              data: {
                lastSyncedAt: nowUTC(),
                nextSyncToken: fetchResult.nextSyncToken || integration.nextSyncToken,
                syncFailureCount: 0,
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
                eventsProcessed,
                eventsSucceeded,
                eventsFailed,
              },
            });

            logger.info('Organization calendar sync completed successfully', {
              organizationId,
              locationId,
              eventsProcessed,
              eventsSucceeded,
              eventsFailed,
            });
          },
          {
            maxWait: 10000,
            timeout: 60000,
          }
        );

        return {
          success: true,
          operationId: syncOp.id,
          eventsProcessed: syncOp.eventsProcessed,
        };
      } catch (error) {
        await ctx.prisma.organizationCalendarSyncOperation.update({
          where: { id: syncOp.id },
          data: {
            status: 'FAILED',
            completedAt: nowUTC(),
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        });

        logger.error('Organization calendar sync failed', {
          organizationId,
          locationId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync organization calendar',
          cause: error,
        });
      }
    }),

  /**
   * Get organization calendar sync status
   */
  getOrganizationSyncStatus: protectedProcedure
    .input(getOrganizationSyncStatusSchema)
    .query(async ({ ctx, input }) => {
      const { organizationId, locationId, limit } = input;

      // Verify user is organization member
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId,
          userId: ctx.session.user.id,
          status: 'ACTIVE',
        },
      });

      if (!membership && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Organization membership required',
        });
      }

      const integration = await ctx.prisma.organizationCalendarIntegration.findFirst({
        where: {
          organizationId,
          locationId: locationId || null,
        },
      });

      if (!integration) {
        return {
          integrated: false,
          integration: null,
          recentOperations: [],
        };
      }

      const recentOperations = await ctx.prisma.organizationCalendarSyncOperation.findMany({
        where: {
          organizationCalendarIntegrationId: integration.id,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return {
        integrated: true,
        integration: {
          id: integration.id,
          syncEnabled: integration.syncEnabled,
          backgroundSyncEnabled: integration.backgroundSyncEnabled,
          lastSyncedAt: integration.lastSyncedAt,
          syncDirection: integration.syncDirection,
          syncFailureCount: integration.syncFailureCount,
          googleEmail: integration.googleEmail,
        },
        recentOperations: recentOperations.map((op) => ({
          id: op.id,
          operationType: op.operationType,
          status: op.status,
          startedAt: op.startedAt,
          completedAt: op.completedAt,
          eventsProcessed: op.eventsProcessed,
          eventsSucceeded: op.eventsSucceeded,
          eventsFailed: op.eventsFailed,
          errorMessage: op.errorMessage,
        })),
      };
    }),

  /**
   * Cancel organization sync operation
   */
  cancelOrganizationSync: protectedProcedure
    .input(cancelOrganizationSyncSchema)
    .mutation(async ({ ctx, input }) => {
      const syncOp = await ctx.prisma.organizationCalendarSyncOperation.findUnique({
        where: { id: input.syncOperationId },
        include: {
          organizationCalendarIntegration: true,
        },
      });

      if (!syncOp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sync operation not found',
        });
      }

      // Verify user is organization admin
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: syncOp.organizationCalendarIntegration.organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Organization admin access required',
        });
      }

      if (syncOp.status !== 'IN_PROGRESS') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only cancel in-progress sync operations',
        });
      }

      await ctx.prisma.organizationCalendarSyncOperation.update({
        where: { id: input.syncOperationId },
        data: {
          status: 'FAILED',
          completedAt: nowUTC(),
          errorMessage: 'Cancelled by user',
        },
      });

      logger.info('Organization sync operation cancelled', {
        syncOperationId: input.syncOperationId,
        userId: ctx.session.user.id,
      });

      return { success: true };
    }),

  /**
   * Admin: Get all organization sync operations
   */
  getAllOrganizationSyncOperations: adminProcedure
    .input(
      z.object({
        organizationId: z.string().cuid().optional(),
        locationId: z.string().cuid().optional(),
        status: z
          .enum(['PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'CONFLICT_DETECTED'])
          .optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const operations = await ctx.prisma.organizationCalendarSyncOperation.findMany({
        where: {
          ...(input.status && { status: input.status }),
          ...(input.organizationId && {
            organizationCalendarIntegration: {
              organizationId: input.organizationId,
              ...(input.locationId && { locationId: input.locationId }),
            },
          }),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        include: {
          organizationCalendarIntegration: {
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
          },
        },
      });

      return operations;
    }),

  /**
   * Disconnect organization calendar integration
   * - Revokes OAuth tokens with Google
   * - Soft-deletes integration (keeps historical records)
   * - Unblocks all slots that were blocked by calendar events
   */
  disconnectOrganizationCalendar: protectedProcedure
    .input(disconnectOrganizationCalendarSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, locationId } = input;

      // Verify user is organization admin or owner
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Organization admin or owner access required',
        });
      }

      // Get organization calendar integration
      const integration = await ctx.prisma.organizationCalendarIntegration.findFirst({
        where: {
          organizationId,
          locationId: locationId || null,
        },
      });

      if (!integration) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: locationId
            ? 'No calendar integration found for this location'
            : 'No calendar integration found for this organization',
        });
      }

      logger.info('Disconnecting organization calendar integration', {
        organizationId,
        locationId,
        integrationId: integration.id,
        googleEmail: integration.googleEmail,
      });

      // Revoke OAuth tokens with Google
      try {
        await revokeOrganizationCalendarToken(integration.id);
      } catch (error) {
        logger.warn('Token revocation failed during disconnect', {
          organizationId,
          locationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Soft-delete integration and unblock slots in transaction
      const result = await ctx.prisma.$transaction(
        async (tx) => {
          // Soft-delete integration (disable sync, keep historical records)
          await tx.organizationCalendarIntegration.update({
            where: { id: integration.id },
            data: {
              syncEnabled: false,
            },
          });

          // Find all calendar events for this integration
          const calendarEvents = await tx.organizationCalendarEvent.findMany({
            where: { organizationCalendarIntegrationId: integration.id },
            select: { id: true },
            take: 10000, // Pagination: Delete organization calendar events helper - bounded by integration FK (typical max ~1000 events)
          });

          // Unblock all slots that were blocked by these events
          // Only unblock if locationId is set (per user requirement - locationId=NULL is informational)
          let unblockedSlots = { count: 0 };
          if (locationId) {
            unblockedSlots = await tx.calculatedAvailabilitySlot.updateMany({
              where: {
                blockedByOrgEventId: { in: calendarEvents.map((e) => e.id) },
                status: 'BLOCKED',
                availability: {
                  locationId,
                },
              },
              data: {
                status: 'AVAILABLE',
                blockedByOrgEventId: null,
              },
            });
          }

          logger.info('Organization calendar disconnected successfully', {
            organizationId,
            locationId,
            integrationId: integration.id,
            slotsUnblocked: unblockedSlots.count,
          });

          return {
            success: true,
            slotsUnblocked: unblockedSlots.count,
          };
        },
        {
          maxWait: 10000,
          timeout: 30000,
        }
      );

      return result;
    }),

  /**
   * Disconnect ALL organization calendar integrations (bulk operation)
   * - Revokes OAuth tokens for all location integrations
   * - Soft-deletes all integrations
   * - Unblocks all affected slots
   */
  disconnectAllOrganizationCalendars: protectedProcedure
    .input(disconnectAllOrganizationCalendarsSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = input;

      // Verify user is organization admin or owner
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership && ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Organization admin or owner access required',
        });
      }

      // Get all organization calendar integrations
      const integrations = await ctx.prisma.organizationCalendarIntegration.findMany({
        where: { organizationId },
        take: 100, // Pagination: Organization calendar integrations (orgs typically have <100 locations)
      });

      if (integrations.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No calendar integrations found for this organization',
        });
      }

      logger.info('Bulk disconnecting organization calendar integrations', {
        organizationId,
        integrationCount: integrations.length,
      });

      // Revoke all OAuth tokens (in parallel for performance)
      await Promise.allSettled(
        integrations.map((integration) =>
          revokeOrganizationCalendarToken(integration.id).catch((error) => {
            logger.warn('Token revocation failed for integration', {
              integrationId: integration.id,
              error: error instanceof Error ? error.message : String(error),
            });
          })
        )
      );

      // Soft-delete all integrations and unblock slots in transaction
      const result = await ctx.prisma.$transaction(
        async (tx) => {
          let totalSlotsUnblocked = 0;

          for (const integration of integrations) {
            // Soft-delete integration
            await tx.organizationCalendarIntegration.update({
              where: { id: integration.id },
              data: {
                syncEnabled: false,
              },
            });

            // Find all calendar events for this integration
            const calendarEvents = await tx.organizationCalendarEvent.findMany({
              where: { organizationCalendarIntegrationId: integration.id },
              select: { id: true },
              take: 10000, // Pagination: Delete organization calendar events helper - bounded by integration FK (typical max ~1000 events)
            });

            // Unblock slots (only if locationId is set)
            if (integration.locationId) {
              const unblockedSlots = await tx.calculatedAvailabilitySlot.updateMany({
                where: {
                  blockedByOrgEventId: { in: calendarEvents.map((e) => e.id) },
                  status: 'BLOCKED',
                  availability: {
                    locationId: integration.locationId,
                  },
                },
                data: {
                  status: 'AVAILABLE',
                  blockedByOrgEventId: null,
                },
              });

              totalSlotsUnblocked += unblockedSlots.count;
            }
          }

          logger.info('All organization calendars disconnected successfully', {
            organizationId,
            totalDisconnected: integrations.length,
            totalSlotsUnblocked,
          });

          return {
            success: true,
            totalDisconnected: integrations.length,
            totalSlotsUnblocked,
          };
        },
        {
          maxWait: 15000,
          timeout: 60000, // Allow more time for bulk operation
        }
      );

      return result;
    }),
});
