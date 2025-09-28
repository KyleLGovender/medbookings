import { revalidatePath } from 'next/cache';

import {
  Availability,
  AvailabilityStatus,
  Booking,
  CalculatedAvailabilitySlot,
  Prisma,
  SchedulingRule,
  ServiceAvailabilityConfig,
} from '@prisma/client';
import { z } from 'zod';

import {
  validateAvailabilityCreation,
  validateAvailabilityDeletion,
  validateAvailabilityUpdate,
} from '@/features/calendar/lib/actions';
import { generateRecurringInstances } from '@/features/calendar/lib/recurrence-utils';
import { generateSlotDataForAvailability } from '@/features/calendar/lib/slot-generation';
import {
  availabilityCreateSchema,
  availabilitySearchParamsSchema,
  updateAvailabilityDataSchema,
} from '@/features/calendar/types/schemas';
import {
  getGuestBookingConfirmationTemplate,
  getProviderBookingNotificationTemplate,
} from '@/features/communications/lib/email-templates';
import {
  sendGuestBookingWhatsApp,
  sendProviderBookingWhatsApp,
} from '@/features/communications/lib/whatsapp-templates';
import {
  sendBookingConfirmationEmail,
  sendProviderNotificationEmail,
} from '@/lib/communications/email';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';

export const calendarRouter = createTRPCRouter({
  /*
   * ====================================
   * REFERENCE DATA QUERIES
   * ====================================
   * Endpoints for fetching reference data like service types
   */

  /**
   * Get service types for calendar availability
   * Migrated from: /api/calendar/availability/service-types
   */
  getServiceTypes: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.service.findMany({
      include: {
        providerType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }),

  /*
   * ====================================
   * AVAILABILITY CRUD OPERATIONS
   * ====================================
   * Core CRUD operations for availability management
   */

  /**
   * Get availability by ID
   * Migrated from: GET /api/calendar/availability/[id]
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const availability = await ctx.prisma.availability.findUnique({
      where: { id: input.id },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        organization: true,
        location: true,
        availableServices: true,
        createdBy: true,
        calculatedSlots: {
          include: {
            booking: true,
            blockedByCalendarEvent: true,
          },
        },
      },
    });

    if (!availability) {
      throw new Error('Availability not found');
    }

    return availability;
  }),

  /**
   * Create availability with slot generation
   * OPTION C: Complete database operations in tRPC procedure for automatic type inference
   */
  create: protectedProcedure.input(availabilityCreateSchema).mutation(async ({ ctx, input }) => {
    // Check if user's email is verified
    if (!ctx.session.user.emailVerified) {
      throw new Error(
        'Email verification required. Please verify your email address before managing calendar availability.'
      );
    }

    // 1. Call business logic validation
    const validation = await validateAvailabilityCreation(input);

    if (!validation.success) {
      throw new Error(validation.error || 'Failed to validate availability creation');
    }

    const { validatedData } = validation;
    if (!validatedData) {
      throw new Error('Validation data is missing');
    }

    // 2. Perform all database operations in single transaction
    // Extended timeout for complex availability creation with slot generation
    const result = await ctx.prisma.$transaction(
      async (tx) => {
        // Create all availability instances
        const availabilities = await Promise.all(
          validatedData.instances.map(async (instance) => {
            return tx.availability.create({
              data: {
                providerId: validatedData.providerId,
                organizationId: validatedData.organizationId,
                locationId: validatedData.locationId,
                connectionId: validatedData.connectionId,
                startTime: instance.startTime,
                endTime: instance.endTime,
                isRecurring: validatedData.isRecurring,
                recurrencePattern: validatedData.recurrencePattern
                  ? (validatedData.recurrencePattern as any)
                  : Prisma.JsonNull,
                seriesId: validatedData.seriesId || null,
                schedulingRule: validatedData.schedulingRule,
                schedulingInterval: validatedData.schedulingInterval,
                isOnlineAvailable: validatedData.isOnlineAvailable,
                requiresConfirmation: validatedData.requiresConfirmation,
                billingEntity: validatedData.billingEntity,
                status: validatedData.initialStatus,
                createdById: ctx.session.user.id,
                createdByMembershipId: validatedData.createdByMembershipId,
                isProviderCreated: validatedData.isProviderCreated,
                defaultSubscriptionId: validatedData.defaultSubscriptionId,
                availableServices: {
                  create: validatedData.services.map((service) => ({
                    service: { connect: { id: service.serviceId } },
                    provider: { connect: { id: validatedData.providerId } },
                    duration: service.duration,
                    price: service.price,
                    isOnlineAvailable: validatedData.isOnlineAvailable,
                    isInPerson: !validatedData.isOnlineAvailable || !!validatedData.locationId,
                    locationId: validatedData.locationId,
                  })),
                },
              },
              include: {
                provider: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                      },
                    },
                  },
                },
                organization: true,
                location: true,
                availableServices: {
                  include: {
                    service: true,
                  },
                },
              },
            });
          })
        );

        // Generate slots for accepted availability (provider-created is auto-accepted)
        let totalSlotsGenerated = 0;
        if (validatedData.initialStatus === AvailabilityStatus.ACCEPTED) {
          for (const availability of availabilities) {
            try {
              const slotData = generateSlotDataForAvailability({
                availabilityId: availability.id,
                startTime: availability.startTime,
                endTime: availability.endTime,
                schedulingRule: availability.schedulingRule as SchedulingRule,
                schedulingInterval: availability.schedulingInterval || undefined,
                services: availability.availableServices.map((as) => ({
                  serviceId: as.serviceId,
                  serviceConfigId: as.id, // Use the ServiceAvailabilityConfig ID
                  duration: as.duration,
                  price: Number(as.price),
                })),
              });

              if (slotData.errors.length > 0) {
                console.warn(
                  `Slot generation failed for availability ${availability.id}:`,
                  slotData.errors.join(', ')
                );
              } else if (slotData.slotRecords.length > 0) {
                // Create slots in database (Option C: database operations in tRPC)
                await tx.calculatedAvailabilitySlot.createMany({
                  data: slotData.slotRecords,
                });
                totalSlotsGenerated += slotData.totalSlots;
              }
            } catch (slotError) {
              console.error('Slot generation error during availability creation:', slotError);
            }
          }
        }

        return { availabilities, totalSlotsGenerated };
      },
      {
        maxWait: 10000, // Wait up to 10 seconds for a transaction slot
        timeout: 30000, // Allow up to 30 seconds for complex operations with slot generation
      }
    );

    // 3. Handle notifications and cache revalidation
    if (validation.notificationNeeded) {
      console.log(
        `📧 Availability proposal notification would be sent for availability ${result.availabilities[0]?.id}`
      );
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/availability');
    revalidatePath('/dashboard/calendar');
    if (validatedData.organizationId) {
      revalidatePath(`/dashboard/organizations/${validatedData.organizationId}/availability`);
    }

    // 4. Return full typed data (automatic inference from Prisma includes)
    return {
      availability: result.availabilities[0], // Full availability object with relations
      allAvailabilities: result.availabilities,
      allAvailabilityIds: result.availabilities.map((a) => a.id),
      seriesId: validatedData.seriesId,
      slotsGenerated: result.totalSlotsGenerated,
      requiresApproval: validation.requiresApproval || false,
      notificationSent: validation.notificationNeeded || false,
    };
  }),

  /**
   * Update availability with slot regeneration
   * OPTION C: Complete database operations in tRPC procedure for automatic type inference
   */
  update: protectedProcedure
    .input(updateAvailabilityDataSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user's email is verified
      if (!ctx.session.user.emailVerified) {
        throw new Error(
          'Email verification required. Please verify your email address before managing calendar availability.'
        );
      }

      // 1. Call business logic validation
      const validation = await validateAvailabilityUpdate(input);

      if (!validation.success) {
        throw new Error(validation.error || 'Failed to validate availability update');
      }

      const { validatedData } = validation;
      if (!validatedData) {
        throw new Error('Validation data is missing');
      }

      // 2. Perform all database operations in single transaction with timeout
      let result;
      try {
        result = await ctx.prisma.$transaction(
          async (tx) => {
            // Prepare update data
            const updateData: any = {};
            if (validatedData.startTime !== undefined)
              updateData.startTime = validatedData.startTime;
            if (validatedData.endTime !== undefined) updateData.endTime = validatedData.endTime;
            if (validatedData.isRecurring !== undefined)
              updateData.isRecurring = validatedData.isRecurring;
            if (validatedData.recurrencePattern !== undefined) {
              updateData.recurrencePattern = validatedData.recurrencePattern
                ? (validatedData.recurrencePattern as any)
                : Prisma.JsonNull;
            }
            if (validatedData.schedulingRule !== undefined)
              updateData.schedulingRule = validatedData.schedulingRule;
            if (validatedData.schedulingInterval !== undefined)
              updateData.schedulingInterval = validatedData.schedulingInterval;
            if (validatedData.isOnlineAvailable !== undefined)
              updateData.isOnlineAvailable = validatedData.isOnlineAvailable;
            if (validatedData.requiresConfirmation !== undefined)
              updateData.requiresConfirmation = validatedData.requiresConfirmation;
            if (validatedData.billingEntity !== undefined)
              updateData.billingEntity = validatedData.billingEntity;

            // Handle different update strategies with guard clauses
            let updatedAvailabilities;

            // Single availability update - simple case
            if (validatedData.updateStrategy === 'single') {
              const updated = await tx.availability.update({
                where: { id: validatedData.id },
                data: updateData,
                include: {
                  provider: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          image: true,
                        },
                      },
                    },
                  },
                  organization: true,
                  location: true,
                  availableServices: {
                    include: {
                      service: true,
                    },
                  },
                  calculatedSlots: {
                    include: {
                      booking: true,
                    },
                  },
                },
              });
              updatedAvailabilities = [updated];

              // Handle services for single update
              if (validatedData.services) {
                await tx.calculatedAvailabilitySlot.deleteMany({
                  where: { availabilityId: validatedData.id },
                });

                await tx.serviceAvailabilityConfig.deleteMany({
                  where: {
                    availabilities: { some: { id: validatedData.id } },
                  },
                });

                await createServiceConfigsForAvailabilities(
                  tx,
                  updatedAvailabilities,
                  validatedData.services,
                  validatedData.existingAvailability.providerId,
                  validatedData.isOnlineAvailable,
                  validatedData.locationId
                );

                updatedAvailabilities = await fetchAvailabilitiesWithRelations(tx, [
                  validatedData.id,
                ]);
              }
            }

            // Series updates (future/all) - delete and recreate approach
            if (validatedData.updateStrategy !== 'single') {
              const { existingAvailability } = validatedData;

              // Step 1: Clean up existing data
              await tx.calculatedAvailabilitySlot.deleteMany({
                where: {
                  availabilityId: { in: validatedData.affectedAvailabilityIds || [] },
                },
              });

              await tx.serviceAvailabilityConfig.deleteMany({
                where: {
                  availabilities: {
                    some: {
                      id: { in: validatedData.affectedAvailabilityIds || [] },
                    },
                  },
                },
              });

              await tx.availability.deleteMany({
                where: { id: { in: validatedData.affectedAvailabilityIds || [] } },
              });

              // Step 2: Prepare new values
              const newStartTime = validatedData.startTime || existingAvailability.startTime;
              const newEndTime = validatedData.endTime || existingAvailability.endTime;
              const newRecurrencePattern =
                validatedData.recurrencePattern !== undefined
                  ? validatedData.recurrencePattern
                  : existingAvailability.recurrencePattern;

              // Step 3: Generate instances based on strategy
              const instances = generateInstancesForStrategy(
                validatedData.updateStrategy,
                existingAvailability,
                newStartTime,
                newEndTime,
                newRecurrencePattern
              );

              // Step 4: Create new availabilities
              const newAvailabilities = await Promise.all(
                instances.map(async (instance) => {
                  return tx.availability.create({
                    data: {
                      providerId: existingAvailability.providerId,
                      organizationId: existingAvailability.organizationId,
                      locationId: existingAvailability.locationId,
                      connectionId: existingAvailability.connectionId,
                      startTime: instance.startTime,
                      endTime: instance.endTime,
                      isRecurring:
                        validatedData.isRecurring !== undefined
                          ? validatedData.isRecurring
                          : existingAvailability.isRecurring,
                      recurrencePattern: newRecurrencePattern
                        ? (newRecurrencePattern as any)
                        : Prisma.JsonNull,
                      seriesId: existingAvailability.seriesId,
                      schedulingRule:
                        validatedData.schedulingRule || existingAvailability.schedulingRule,
                      schedulingInterval:
                        validatedData.schedulingInterval !== undefined
                          ? validatedData.schedulingInterval
                          : existingAvailability.schedulingInterval,
                      isOnlineAvailable:
                        validatedData.isOnlineAvailable !== undefined
                          ? validatedData.isOnlineAvailable
                          : existingAvailability.isOnlineAvailable,
                      requiresConfirmation:
                        validatedData.requiresConfirmation !== undefined
                          ? validatedData.requiresConfirmation
                          : existingAvailability.requiresConfirmation,
                      billingEntity:
                        validatedData.billingEntity || existingAvailability.billingEntity,
                      status: existingAvailability.status,
                      createdById: existingAvailability.createdById,
                      createdByMembershipId: existingAvailability.createdByMembershipId,
                      isProviderCreated: existingAvailability.isProviderCreated,
                      defaultSubscriptionId: existingAvailability.defaultSubscriptionId,
                    },
                    include: {
                      provider: {
                        include: {
                          user: {
                            select: {
                              id: true,
                              name: true,
                              email: true,
                              image: true,
                            },
                          },
                        },
                      },
                      organization: true,
                      location: true,
                      availableServices: {
                        include: {
                          service: true,
                        },
                      },
                      calculatedSlots: {
                        include: {
                          booking: true,
                        },
                      },
                    },
                  });
                })
              );

              updatedAvailabilities = newAvailabilities;

              // Handle services for series updates
              if (validatedData.services) {
                await createServiceConfigsForAvailabilities(
                  tx,
                  updatedAvailabilities,
                  validatedData.services,
                  validatedData.existingAvailability.providerId,
                  validatedData.isOnlineAvailable,
                  validatedData.locationId
                );

                // Re-fetch with service configs
                updatedAvailabilities = await fetchAvailabilitiesWithRelations(
                  tx,
                  updatedAvailabilities.map((a) => a.id)
                );
              }
            } // End of series update block

            // Handle slot regeneration if needed
            let totalSlotsRegenerated = 0;
            if (validatedData.needsSlotRegeneration) {
              for (const availability of updatedAvailabilities) {
                if (availability.status === AvailabilityStatus.ACCEPTED) {
                  try {
                    // If services were updated, slots were already deleted above
                    // Otherwise, we need to delete slots for this specific availability
                    if (!validatedData.services) {
                      // Check for existing bookings before modifying slots
                      const bookedSlots = availability.calculatedSlots.filter(
                        (slot: CalculatedAvailabilitySlot & { booking: Booking | null }) =>
                          slot.booking
                      );

                      if (bookedSlots.length > 0) {
                        // Delete only unbooked slots
                        const unbookedSlotIds = availability.calculatedSlots
                          .filter(
                            (slot: CalculatedAvailabilitySlot & { booking: Booking | null }) =>
                              !slot.booking
                          )
                          .map((slot: CalculatedAvailabilitySlot) => slot.id);

                        if (unbookedSlotIds.length > 0) {
                          await tx.calculatedAvailabilitySlot.deleteMany({
                            where: { id: { in: unbookedSlotIds } },
                          });
                        }
                      } else {
                        // No bookings, safe to regenerate all slots
                        await tx.calculatedAvailabilitySlot.deleteMany({
                          where: { availabilityId: availability.id },
                        });
                      }
                    }
                    // Note: If services were updated, slots were already deleted above

                    // Generate new slots with updated parameters
                    const slotData = generateSlotDataForAvailability({
                      availabilityId: availability.id,
                      startTime: availability.startTime,
                      endTime: availability.endTime,
                      schedulingRule: availability.schedulingRule as SchedulingRule,
                      schedulingInterval: availability.schedulingInterval || undefined,
                      services: availability.availableServices.map(
                        (as: ServiceAvailabilityConfig) => ({
                          serviceId: as.serviceId,
                          serviceConfigId: as.id, // Use the ServiceAvailabilityConfig ID
                          duration: as.duration,
                          price: Number(as.price),
                        })
                      ),
                    });

                    if (slotData.errors.length > 0) {
                      console.warn(
                        `Slot regeneration failed for availability ${availability.id}:`,
                        slotData.errors.join(', ')
                      );
                    } else if (slotData.slotRecords.length > 0) {
                      // Create new slots in database with chunking to prevent timeout
                      const CHUNK_SIZE = 100; // Process slots in chunks of 100
                      console.log(
                        `Creating ${slotData.slotRecords.length} slots for availability ${availability.id}`
                      );

                      for (let i = 0; i < slotData.slotRecords.length; i += CHUNK_SIZE) {
                        const chunk = slotData.slotRecords.slice(i, i + CHUNK_SIZE);
                        await tx.calculatedAvailabilitySlot.createMany({
                          data: chunk,
                        });
                      }
                      totalSlotsRegenerated += slotData.totalSlots;
                    }
                  } catch (slotGenError) {
                    console.error(
                      'Slot regeneration error during availability update:',
                      slotGenError
                    );
                  }
                }
              }
            }

            return { updatedAvailabilities, totalSlotsRegenerated };
          },
          {
            maxWait: 20000, // 20 seconds max wait time
            timeout: 30000, // 30 seconds timeout
          }
        );
      } catch (transactionError: any) {
        console.error('Transaction failed during availability update:', transactionError);

        // Provide specific error messages for different transaction failures
        if (transactionError.code === 'P2028') {
          throw new Error(
            'Database transaction timed out. This may be due to high server load. Please try again in a moment.'
          );
        } else if (transactionError.code === 'P2034') {
          throw new Error(
            'Database transaction failed due to a conflict. Please refresh and try again.'
          );
        } else if (transactionError.message?.includes('timeout')) {
          throw new Error(
            'Operation timed out. Please try updating with fewer changes or try again later.'
          );
        } else {
          throw new Error(
            `Failed to update availability: ${transactionError.message || 'Unknown database error'}`
          );
        }
      }

      // 3. Handle cache revalidation
      const { existingAvailability } = validatedData;

      revalidatePath('/dashboard/availability');
      revalidatePath('/dashboard/calendar');
      if (existingAvailability.organizationId) {
        revalidatePath(
          `/dashboard/organizations/${existingAvailability.organizationId}/availability`
        );
      }

      // 4. Return full typed data (automatic inference from Prisma includes)
      const primaryAvailability = result.updatedAvailabilities[0];
      const allUpdatedIds = result.updatedAvailabilities.map((a: Availability) => a.id);

      return {
        availability: primaryAvailability, // Primary updated availability with relations
        allUpdatedAvailabilities: result.updatedAvailabilities,
        affectedAvailabilityIds: allUpdatedIds,
        updateScope: validatedData.updateStrategy,
        slotsRegenerated: result.totalSlotsRegenerated,
        // Additional info for series updates
        ...(validatedData.updateStrategy !== 'single' && {
          seriesRecreated: true,
          totalAvailabilitiesCreated: result.updatedAvailabilities.length,
        }),
      };
    }),

  /**
   * Delete availability
   * OPTION C: Complete database operations in tRPC procedure for automatic type inference
   */
  delete: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        scope: z.enum(['single', 'future', 'all']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user's email is verified
      if (!ctx.session.user.emailVerified) {
        throw new Error(
          'Email verification required. Please verify your email address before managing calendar availability.'
        );
      }

      // Handle single availability deletion with scope
      if (input.ids.length === 1 && input.scope) {
        return deleteSingleAvailability(ctx, input.ids[0], input.scope);
      }
      // Handle batch deletion (no scope support for batch)
      else {
        return deleteBatchAvailabilities(ctx, input.ids);
      }
    }),

  /*
   * ====================================
   * AVAILABILITY QUERY OPERATIONS
   * ====================================
   * Various ways to query and filter availability data
   */

  /**
   * Search availability with comprehensive authorization
   * Migrated from: GET /api/calendar/availability
   */
  searchAvailability: publicProcedure
    .input(availabilitySearchParamsSchema)
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.session?.user;
      if (!currentUser) {
        throw new Error('Authentication required');
      }

      const where: any = {};

      if (input.providerId) {
        where.providerId = input.providerId;
      }
      if (input.organizationId) {
        where.organizationId = input.organizationId;
      }
      if (input.locationId) {
        where.locationId = input.locationId;
      }
      if (input.seriesId) {
        where.seriesId = input.seriesId;
      }
      if (input.serviceId) {
        where.availableServices = {
          some: {
            serviceId: input.serviceId,
          },
        };
      }
      if (input.startDate || input.endDate) {
        where.AND = [];

        if (input.startDate) {
          where.AND.push({
            endTime: { gte: new Date(input.startDate) },
          });
        }

        if (input.endDate) {
          where.AND.push({
            startTime: { lte: new Date(input.endDate) },
          });
        }
      }
      if (input.isOnlineAvailable !== undefined) {
        where.isOnlineAvailable = input.isOnlineAvailable;
      }
      if (input.status) {
        where.status = input.status;
      }
      if (input.schedulingRule) {
        where.schedulingRule = input.schedulingRule;
      }

      // Add permission filters for non-admin users
      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
        const currentUserProvider = await ctx.prisma.provider.findUnique({
          where: { userId: currentUser.id },
        });

        const userOrganizations = await ctx.prisma.organizationMembership.findMany({
          where: { userId: currentUser.id },
          select: { organizationId: true },
        });

        const organizationIds = userOrganizations.map((m) => m.organizationId);

        where.OR = [
          ...(currentUserProvider ? [{ providerId: currentUserProvider.id }] : []),
          { createdById: currentUser.id },
          ...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
        ];
      }

      const availabilities = await ctx.prisma.availability.findMany({
        where,
        include: {
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          organization: true,
          location: true,
          availableServices: {
            include: {
              service: true,
            },
          },
          calculatedSlots: {
            include: {
              booking: true,
              blockedByCalendarEvent: true,
            },
          },
        },
        orderBy: [{ startTime: 'asc' }, { createdAt: 'desc' }],
        take: input.limit || 1000,
      });

      return availabilities;
    }),

  /**
   * Get availability by provider ID
   * New endpoint for useProviderAvailability hook
   */
  getByProviderId: publicProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.session?.user;
      if (!currentUser) {
        throw new Error('Authentication required');
      }

      const where: any = { providerId: input.providerId };

      // Add permission filters for non-admin users
      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
        const currentUserProvider = await ctx.prisma.provider.findUnique({
          where: { userId: currentUser.id },
        });

        const userOrganizations = await ctx.prisma.organizationMembership.findMany({
          where: { userId: currentUser.id },
          select: { organizationId: true },
        });

        const organizationIds = userOrganizations.map((m) => m.organizationId);

        where.OR = [
          ...(currentUserProvider ? [{ providerId: currentUserProvider.id }] : []),
          { createdById: currentUser.id },
          ...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
        ];
      }

      const availabilities = await ctx.prisma.availability.findMany({
        where,
        include: {
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          organization: true,
          location: true,
          availableServices: {
            include: {
              service: true,
            },
          },
          calculatedSlots: {
            include: {
              booking: true,
              blockedByCalendarEvent: true,
            },
          },
        },
        orderBy: [{ startTime: 'asc' }, { createdAt: 'desc' }],
        take: 1000,
      });

      return availabilities;
    }),

  /**
   * Get availability by organization ID
   * New endpoint for useOrganizationAvailability hook
   */
  getByOrganizationId: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.session?.user;
      if (!currentUser) {
        throw new Error('Authentication required');
      }

      const where: any = { organizationId: input.organizationId };

      // Add permission filters for non-admin users
      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
        const currentUserProvider = await ctx.prisma.provider.findUnique({
          where: { userId: currentUser.id },
        });

        const userOrganizations = await ctx.prisma.organizationMembership.findMany({
          where: { userId: currentUser.id },
          select: { organizationId: true },
        });

        const organizationIds = userOrganizations.map((m) => m.organizationId);

        where.OR = [
          ...(currentUserProvider ? [{ providerId: currentUserProvider.id }] : []),
          { createdById: currentUser.id },
          ...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
        ];
      }

      const availabilities = await ctx.prisma.availability.findMany({
        where,
        include: {
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          organization: true,
          location: true,
          availableServices: {
            include: {
              service: true,
            },
          },
          calculatedSlots: {
            include: {
              booking: true,
              blockedByCalendarEvent: true,
            },
          },
        },
        orderBy: [{ startTime: 'asc' }, { createdAt: 'desc' }],
        take: 1000,
      });

      return availabilities;
    }),

  /**
   * Get availability by series ID
   * New endpoint for useAvailabilitySeries hook
   */
  getBySeriesId: publicProcedure
    .input(z.object({ seriesId: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.session?.user;
      if (!currentUser) {
        throw new Error('Authentication required');
      }

      const where: any = { seriesId: input.seriesId };

      // Add permission filters for non-admin users
      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
        const currentUserProvider = await ctx.prisma.provider.findUnique({
          where: { userId: currentUser.id },
        });

        const userOrganizations = await ctx.prisma.organizationMembership.findMany({
          where: { userId: currentUser.id },
          select: { organizationId: true },
        });

        const organizationIds = userOrganizations.map((m) => m.organizationId);

        where.OR = [
          ...(currentUserProvider ? [{ providerId: currentUserProvider.id }] : []),
          { createdById: currentUser.id },
          ...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
        ];
      }

      const availabilities = await ctx.prisma.availability.findMany({
        where,
        include: {
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          organization: true,
          location: true,
          availableServices: {
            include: {
              service: true,
            },
          },
          calculatedSlots: {
            include: {
              booking: true,
              blockedByCalendarEvent: true,
            },
          },
        },
        orderBy: [{ startTime: 'asc' }, { createdAt: 'desc' }],
        take: 1000,
      });

      return availabilities;
    }),

  /*
   * ====================================
   * WORKFLOW OPERATIONS
   * ====================================
   * Operations for availability proposal workflows (accept/reject)
   */

  /**
   * Accept availability with slot generation (for org-proposed)
   * Migrated from: POST /api/calendar/availability/accept
   */
  accept: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserProvider = await ctx.prisma.provider.findUnique({
        where: { userId: ctx.session.user.id },
      });

      const availability = await ctx.prisma.availability.findUnique({
        where: { id: input.id },
        include: {
          availableServices: true,
        },
      });

      if (!availability) {
        throw new Error('Availability not found');
      }

      if (currentUserProvider?.id !== availability.providerId) {
        throw new Error('Only the assigned provider can accept this proposal');
      }

      if (availability.status !== AvailabilityStatus.PENDING) {
        throw new Error('Availability is not pending acceptance');
      }

      const updatedAvailability = await ctx.prisma.availability.update({
        where: { id: input.id },
        data: {
          status: AvailabilityStatus.ACCEPTED,
          acceptedById: ctx.session.user.id,
          acceptedAt: new Date(),
        },
        include: {
          availableServices: true,
        },
      });

      // Generate slots for the accepted availability
      try {
        const slotData = generateSlotDataForAvailability({
          availabilityId: updatedAvailability.id,
          startTime: updatedAvailability.startTime,
          endTime: updatedAvailability.endTime,
          schedulingRule: updatedAvailability.schedulingRule as SchedulingRule,
          schedulingInterval: updatedAvailability.schedulingInterval || undefined,
          services: updatedAvailability.availableServices.map((as) => ({
            serviceId: as.serviceId,
            serviceConfigId: as.id, // Use the ServiceAvailabilityConfig ID
            duration: as.duration,
            price: Number(as.price),
          })),
        });

        let slotsGenerated = 0;
        if (slotData.errors.length > 0) {
          console.warn(
            `Slot generation failed for accepted availability ${updatedAvailability.id}:`,
            slotData.errors.join(', ')
          );
        } else if (slotData.slotRecords.length > 0) {
          // Create slots in database (Option C: database operations in tRPC)
          await ctx.prisma.calculatedAvailabilitySlot.createMany({
            data: slotData.slotRecords,
          });
          slotsGenerated = slotData.totalSlots;
        }

        console.log(
          `📧 Availability accepted notification would be sent for availability ${input.id}`
        );

        return {
          success: true,
          id: input.id,
          slotsGenerated,
        };
      } catch (slotGenError) {
        console.warn(`Slot generation error for accepted availability ${input.id}:`, slotGenError);
        return {
          success: true,
          id: input.id,
          slotsGenerated: 0,
        };
      }
    }),

  /**
   * Reject availability (for org-proposed)
   * Migrated from: POST /api/calendar/availability/reject
   */
  reject: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserProvider = await ctx.prisma.provider.findUnique({
        where: { userId: ctx.session.user.id },
      });

      const availability = await ctx.prisma.availability.findUnique({
        where: { id: input.id },
      });

      if (!availability) {
        throw new Error('Availability not found');
      }

      if (currentUserProvider?.id !== availability.providerId) {
        throw new Error('Only the assigned provider can reject this proposal');
      }

      if (availability.status !== AvailabilityStatus.PENDING) {
        throw new Error('Availability is not pending response');
      }

      await ctx.prisma.availability.update({
        where: { id: input.id },
        data: {
          status: AvailabilityStatus.REJECTED,
        },
      });

      console.log(
        `📧 Availability rejected notification would be sent for availability ${input.id}`
      );
      if (input.reason) {
        console.log(`📝 Rejection reason: ${input.reason}`);
      }

      return {
        success: true,
        id: input.id,
      };
    }),

  /*
   * ====================================
   * SEARCH OPERATIONS
   * ====================================
   * Advanced search functionality for slots, providers, and services
   */

  /**
   * Search providers with availability
   * Migrated from: POST /api/calendar/availability/search/providers
   */
  searchProviders: publicProcedure
    .input(
      z.object({
        serviceId: z.string().optional(),
        locationId: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        onlineOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const providers = await ctx.prisma.provider.findMany({
        where: {
          availabilities: {
            some: {
              locationId: input.locationId,
              startTime: { gte: startDate },
              endTime: { lte: endDate },
              status: AvailabilityStatus.ACCEPTED,
              ...(input.onlineOnly && { isOnlineAvailable: true }),
            },
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          services: {
            where: input.serviceId ? { id: input.serviceId } : undefined,
          },
          availabilities: {
            where: {
              locationId: input.locationId,
              startTime: { gte: startDate },
              endTime: { lte: endDate },
              status: AvailabilityStatus.ACCEPTED,
              ...(input.onlineOnly && { isOnlineAvailable: true }),
            },
            select: {
              id: true,
            },
          },
        },
      });

      return providers.map((provider) => ({
        ...provider,
        availabilityCount: provider.availabilities.length,
      }));
    }),

  /**
   * Search services with availability
   * Migrated from: POST /api/calendar/availability/search/services
   */
  searchServices: publicProcedure
    .input(
      z.object({
        providerId: z.string().optional(),
        locationId: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        onlineOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Find all services
      const services = await ctx.prisma.service.findMany({});

      return services;
    }),

  /**
   * Search providers by location and service type for landing page
   * Optimized for guest booking flow with available slots count
   */
  searchProvidersByLocation: publicProcedure
    .input(
      z.object({
        serviceType: z.string().optional(), // Provider type name (e.g., "Dentist", "General Practitioner")
        location: z.string().optional(), // Search term for location matching
        consultationType: z.enum(['online', 'in-person', 'both']).default('both'),
        startDate: z.string().optional(), // ISO date string for availability check
        endDate: z.string().optional(), // ISO date string for availability check
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { serviceType, location, consultationType, startDate, endDate, limit } = input;

      // Parse dates if provided
      const dateStart = startDate ? new Date(startDate) : new Date();
      const dateEnd = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

      // Build where clause for provider search
      const whereClause: any = {
        status: 'APPROVED', // Only show approved providers
        availabilities: {
          some: {
            status: AvailabilityStatus.ACCEPTED,
            startTime: { gte: dateStart },
            endTime: { lte: dateEnd },
            ...(consultationType === 'online' && { isOnlineAvailable: true }),
            ...(consultationType === 'in-person' && { isOnlineAvailable: false }),
          },
        },
      };

      // Add service type filtering if specified
      if (serviceType) {
        whereClause.typeAssignments = {
          some: {
            providerType: {
              name: {
                contains: serviceType,
                mode: 'insensitive',
              },
            },
          },
        };
      }

      // Add location filtering if specified
      if (location) {
        whereClause.OR = [
          // Search in organization locations
          {
            organizationConnections: {
              some: {
                organization: {
                  locations: {
                    some: {
                      OR: [
                        { name: { contains: location, mode: 'insensitive' } },
                        { formattedAddress: { contains: location, mode: 'insensitive' } },
                        { searchTerms: { has: location.toLowerCase() } },
                      ],
                    },
                  },
                },
              },
            },
          },
          // Search in availability locations
          {
            availabilities: {
              some: {
                location: {
                  OR: [
                    { name: { contains: location, mode: 'insensitive' } },
                    { formattedAddress: { contains: location, mode: 'insensitive' } },
                    { searchTerms: { has: location.toLowerCase() } },
                  ],
                },
              },
            },
          },
        ];
      }

      const providers = await ctx.prisma.provider.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          typeAssignments: {
            include: {
              providerType: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          availabilities: {
            where: {
              status: AvailabilityStatus.ACCEPTED,
              startTime: { gte: dateStart },
              endTime: { lte: dateEnd },
              ...(consultationType === 'online' && { isOnlineAvailable: true }),
              ...(consultationType === 'in-person' && { isOnlineAvailable: false }),
            },
            include: {
              location: {
                select: {
                  id: true,
                  name: true,
                  formattedAddress: true,
                },
              },
              calculatedSlots: {
                where: {
                  status: 'AVAILABLE',
                  startTime: { gte: dateStart },
                  endTime: { lte: dateEnd },
                },
                select: {
                  id: true,
                  startTime: true,
                  endTime: true,
                },
                take: 5, // Limit slots for performance
              },
            },
            take: 3, // Limit availabilities for performance
          },
        },
        take: limit,
        orderBy: [
          { status: 'asc' }, // Approved first
          { createdAt: 'desc' }, // Newer providers first
        ],
      });

      // Transform results for frontend consumption
      return providers.map((provider) => ({
        id: provider.id,
        name: provider.user?.name || provider.name,
        image: provider.user?.image || provider.image,
        bio: provider.bio,
        specialties: provider.typeAssignments.map((ta) => ta.providerType.name),
        languages: provider.languages,
        averageRating: provider.averageRating,
        totalReviews: provider.totalReviews,
        showPrice: provider.showPrice,
        availableSlots: provider.availabilities.reduce(
          (total, availability) => total + availability.calculatedSlots.length,
          0
        ),
        locations: provider.availabilities
          .map((a) => a.location)
          .filter((location) => location !== null)
          .reduce((unique: any[], location) => {
            if (location && !unique.find((l) => l.id === location.id)) {
              unique.push(location);
            }
            return unique;
          }, []),
        supportsOnline: provider.availabilities.some((a) => a.isOnlineAvailable),
        supportsInPerson: provider.availabilities.some((a) => !a.isOnlineAvailable),
        nextAvailableSlot:
          provider.availabilities
            .flatMap((a) => a.calculatedSlots)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] || null,
      }));
    }),

  /**
   * Find available slots with filters
   * Migrated from: findAvailableSlots() lib function
   */
  findAvailableSlots: publicProcedure
    .input(
      z.object({
        providerId: z.string().optional(),
        organizationId: z.string().optional(),
        locationId: z.string().optional(),
        serviceId: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        minDuration: z.number().optional(),
        maxResults: z.number().optional().default(100),
        onlineOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, maxResults, ...filters } = input;

      const availabilities = await ctx.prisma.availability.findMany({
        where: {
          ...filters,
          startTime: { gte: startDate },
          endTime: { lte: endDate },
          status: AvailabilityStatus.ACCEPTED,
          ...(input.onlineOnly && { isOnlineAvailable: true }),
        },
        include: {
          provider: { select: { id: true, name: true, image: true } },
          location: { select: { id: true, name: true, formattedAddress: true } },
          calculatedSlots: {
            where: { status: 'AVAILABLE' },
            take: maxResults,
            orderBy: { startTime: 'asc' },
          },
        },
        take: maxResults,
        orderBy: { startTime: 'asc' },
      });

      const allSlots = availabilities.flatMap((availability) =>
        availability.calculatedSlots.map((slot) => ({
          ...slot,
          provider: availability.provider,
          location: availability.location,
          isOnlineAvailable: availability.isOnlineAvailable,
        }))
      );

      return allSlots;
    }),

  /**
   * Get all provider slots with status information
   * Returns slots of all statuses (AVAILABLE, BOOKED, BLOCKED, INVALID) for calendar views
   * Service filtering is handled client-side for better performance
   */
  getProviderSlots: publicProcedure
    .input(
      z.object({
        providerId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Simple query: get ALL slots for this provider in date range
      const where = {
        availability: {
          providerId: input.providerId,
          status: AvailabilityStatus.ACCEPTED, // Only from accepted availability
        },
        startTime: { gte: input.startDate }, // Slot starts within range
        endTime: { lte: input.endDate }, // Slot ends within range
      };

      const slots = await ctx.prisma.calculatedAvailabilitySlot.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              defaultPrice: true,
            },
          },
          serviceConfig: {
            select: {
              price: true,
              duration: true,
            },
          },
          availability: {
            include: {
              provider: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
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
          booking: {
            select: {
              id: true,
              status: true,
              clientId: true,
              guestName: true,
              guestEmail: true,
            },
          },
        },
        orderBy: [{ startTime: 'asc' }, { service: { name: 'asc' } }],
      });

      return slots;
    }),

  /**
   * Create a new booking from public booking page
   * Public procedure for customer booking
   */
  createPublicBooking: publicProcedure
    .input(
      z.object({
        slotId: z.string(),
        clientName: z.string().min(1, 'Name is required'),
        clientEmail: z.string().email('Valid email is required'),
        clientPhone: z.string().min(1, 'Phone number is required'),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use a transaction to ensure atomic booking creation and prevent concurrent bookings
      const booking = await ctx.prisma.$transaction(async (tx) => {
        // First, verify slot exists and lock it for update to prevent concurrent access
        const slot = await tx.calculatedAvailabilitySlot.findUnique({
          where: { id: input.slotId },
          include: {
            booking: true,
            availability: {
              include: {
                provider: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
                organization: true,
                location: true,
              },
            },
            service: true,
            serviceConfig: true,
          },
        });

        if (!slot) {
          throw new Error('Slot not found');
        }

        // Check if slot is already booked (double-check within transaction)
        if (slot.booking) {
          throw new Error('Slot is already booked');
        }

        if (slot.startTime <= new Date()) {
          throw new Error('Cannot book past slots');
        }

        // Verify slot status is still available
        if (slot.status !== 'AVAILABLE') {
          throw new Error('Slot is no longer available');
        }

        // Create booking atomically
        const newBooking = await tx.booking.create({
          data: {
            slotId: input.slotId,
            guestName: input.clientName,
            guestEmail: input.clientEmail,
            guestPhone: input.clientPhone,
            isGuestBooking: true,
            isGuestSelfBooking: true,
            notes: input.notes || '',
            status: 'PENDING', // Default status, may require provider confirmation
            price: slot.serviceConfig?.price || slot.service?.defaultPrice || 0,
            isOnline: slot.availability?.isOnlineAvailable || false,
            isInPerson: !slot.availability?.isOnlineAvailable || false,
          },
          include: {
            slot: {
              include: {
                service: true,
                serviceConfig: true,
                availability: {
                  include: {
                    provider: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                          },
                        },
                      },
                    },
                    location: true,
                  },
                },
              },
            },
          },
        });

        // Update slot status to BOOKED atomically
        await tx.calculatedAvailabilitySlot.update({
          where: { id: input.slotId },
          data: { status: 'BOOKED' },
        });

        return newBooking;
      });

      // Send notifications (email and WhatsApp)
      try {
        const bookingDetails = {
          bookingId: booking.id,
          providerName: booking.slot?.availability?.provider?.user?.name || 'Healthcare Provider',
          startTime: booking.slot?.startTime?.toISOString() || new Date().toISOString(),
          endTime: booking.slot?.endTime?.toISOString() || new Date().toISOString(),
          serviceType: booking.slot?.service?.name || 'Healthcare Service',
          location: booking.slot?.availability?.location?.name || undefined,
          guestName: booking.guestName || '',
          guestEmail: booking.guestEmail || '',
          guestPhone: booking.guestPhone || undefined,
          notes: booking.notes || undefined,
          duration: booking.slot?.serviceConfig?.duration || 30,
          price: booking.price ? `R${booking.price}` : undefined,
        };

        // Send email notifications
        const guestEmailTemplate = getGuestBookingConfirmationTemplate(bookingDetails);
        const providerEmailTemplate = getProviderBookingNotificationTemplate(bookingDetails);

        const emailPromises = [];

        if (booking.guestEmail) {
          emailPromises.push(sendBookingConfirmationEmail(booking.guestEmail, guestEmailTemplate));
        }

        if (booking.slot?.availability?.provider?.user?.email) {
          emailPromises.push(
            sendProviderNotificationEmail(
              booking.slot.availability.provider.user.email,
              providerEmailTemplate
            )
          );
        }

        // Send WhatsApp notifications
        const whatsappPromises = [];

        if (booking.guestPhone) {
          whatsappPromises.push(sendGuestBookingWhatsApp(booking.guestPhone, bookingDetails));
        }

        if (booking.slot?.availability?.provider?.whatsapp) {
          whatsappPromises.push(
            sendProviderBookingWhatsApp(booking.slot.availability.provider.whatsapp, bookingDetails)
          );
        }

        // Send all notifications in parallel
        await Promise.allSettled([...emailPromises, ...whatsappPromises]);

        console.log('Booking notifications sent successfully for booking:', booking.id);
      } catch (error) {
        console.error('Error sending booking notifications:', error);
        // Don't fail the booking if notifications fail
      }

      return {
        success: true,
        booking,
        message: 'Booking created successfully',
      };
    }),

  /**
   * Get booking with all relations needed for communications
   * OPTION C: Direct database query in tRPC for automatic type inference
   */
  getBookingWithDetails: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          slot: {
            include: {
              service: true,
              serviceConfig: true,
              availability: {
                include: {
                  provider: true,
                },
              },
            },
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check authorization
      if (booking.slot?.availability?.provider?.userId !== ctx.session.user.id) {
        throw new Error('Unauthorized access to booking');
      }

      return booking;
    }),

  /*
   * ====================================
   * USER BOOKING MANAGEMENT
   * ====================================
   * Endpoints for users to manage their own bookings
   */

  getUserBookings: protectedProcedure
    .input(
      z.object({
        status: z.enum(['upcoming', 'past', 'cancelled', 'all']).default('all'),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, limit, offset } = input;
      const userId = ctx.session.user.id;

      // Build status filter
      let statusFilter: any = {};
      const now = new Date();

      if (status === 'upcoming') {
        statusFilter = {
          slot: {
            startTime: { gte: now },
          },
          status: { notIn: ['CANCELLED'] },
        };
      } else if (status === 'past') {
        statusFilter = {
          slot: {
            startTime: { lt: now },
          },
          status: { notIn: ['CANCELLED'] },
        };
      } else if (status === 'cancelled') {
        statusFilter = {
          status: 'CANCELLED',
        };
      }

      const bookings = await ctx.prisma.booking.findMany({
        where: {
          createdById: userId,
          ...statusFilter,
        },
        include: {
          slot: {
            include: {
              service: true,
              serviceConfig: true,
              availability: {
                include: {
                  provider: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          slot: {
            startTime: 'desc',
          },
        },
        take: limit,
        skip: offset,
      });

      return bookings;
    }),

  updateUserBooking: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        guestName: z.string().optional(),
        guestEmail: z.string().email().optional(),
        guestPhone: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const userId = ctx.session.user.id;

      // Verify the booking belongs to the current user
      const existingBooking = await ctx.prisma.booking.findFirst({
        where: {
          id,
          createdById: userId,
        },
      });

      if (!existingBooking) {
        throw new Error('Booking not found or you do not have permission to update it');
      }

      const updatedBooking = await ctx.prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          slot: {
            include: {
              service: true,
              serviceConfig: true,
              availability: {
                include: {
                  provider: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return updatedBooking;
    }),

  cancelUserBooking: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify the booking belongs to the current user
      const existingBooking = await ctx.prisma.booking.findFirst({
        where: {
          id: input.id,
          createdById: userId,
        },
      });

      if (!existingBooking) {
        throw new Error('Booking not found or you do not have permission to cancel it');
      }

      // Cancel the booking
      const cancelledBooking = await ctx.prisma.booking.update({
        where: { id: input.id },
        data: { status: 'CANCELLED' },
        include: {
          slot: {
            include: {
              service: true,
              serviceConfig: true,
              availability: {
                include: {
                  provider: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return cancelledBooking;
    }),

  rescheduleUserBooking: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        newSlotId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify the booking belongs to the current user
      const existingBooking = await ctx.prisma.booking.findFirst({
        where: {
          id: input.id,
          createdById: userId,
        },
      });

      if (!existingBooking) {
        throw new Error('Booking not found or you do not have permission to reschedule it');
      }

      // Verify the new slot exists and is available
      const newSlot = await ctx.prisma.calculatedAvailabilitySlot.findUnique({
        where: { id: input.newSlotId },
      });

      if (!newSlot || newSlot.status !== 'AVAILABLE') {
        throw new Error('Selected slot is not available');
      }

      // Update the booking with the new slot
      const rescheduledBooking = await ctx.prisma.booking.update({
        where: { id: input.id },
        data: { slotId: input.newSlotId },
        include: {
          slot: {
            include: {
              service: true,
              serviceConfig: true,
              availability: {
                include: {
                  provider: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return rescheduledBooking;
    }),

  /**
   * Get provider's availabilities for the provider profile page
   * Shows upcoming availability slots for a specific provider
   */
  getProviderAvailabilities: publicProcedure
    .input(
      z.object({
        providerId: z.string(),
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const availabilities = await ctx.prisma.availability.findMany({
        where: {
          providerId: input.providerId,
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          startTime: 'asc',
        },
        take: input.limit,
        include: {
          availableServices: {
            include: {
              service: true,
            },
          },
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      return availabilities;
    }),
});

/**
 * Generate instances based on update strategy
 */
function generateInstancesForStrategy(
  strategy: 'future' | 'all',
  existingAvailability: any,
  newStartTime: Date,
  newEndTime: Date,
  newRecurrencePattern: any
): Array<{ startTime: Date; endTime: Date }> {
  if (strategy === 'future') {
    const currentDate = new Date(existingAvailability.startTime);

    if (newRecurrencePattern && existingAvailability.isRecurring) {
      return generateRecurringInstances(newRecurrencePattern, newStartTime, newEndTime, 365).filter(
        (instance) => instance.startTime >= currentDate
      );
    }

    return [{ startTime: newStartTime, endTime: newEndTime }];
  }

  // 'all' strategy
  if (newRecurrencePattern && existingAvailability.isRecurring) {
    return generateRecurringInstances(newRecurrencePattern, newStartTime, newEndTime, 365);
  }

  return [{ startTime: newStartTime, endTime: newEndTime }];
}

/**
 * Create service configurations for availabilities
 */
async function createServiceConfigsForAvailabilities(
  tx: any,
  availabilities: any[],
  services: any[],
  providerId: string,
  isOnlineAvailable?: boolean,
  locationId?: string
) {
  for (const availability of availabilities) {
    for (const service of services) {
      await tx.serviceAvailabilityConfig.create({
        data: {
          serviceId: service.serviceId,
          providerId: providerId,
          duration: service.duration,
          price: service.price,
          isOnlineAvailable: isOnlineAvailable || false,
          isInPerson: !isOnlineAvailable || !!locationId,
          locationId: locationId,
          availabilities: {
            connect: { id: availability.id },
          },
        },
      });
    }
  }
}

/**
 * Fetch availabilities with all relations
 */
async function fetchAvailabilitiesWithRelations(tx: any, availabilityIds: string[]) {
  return tx.availability.findMany({
    where: { id: { in: availabilityIds } },
    include: {
      provider: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      organization: true,
      location: true,
      availableServices: {
        include: {
          service: true,
        },
      },
      calculatedSlots: {
        include: {
          booking: true,
        },
      },
    },
  });
}

/**
 * Handle single availability deletion with scope support
 */
async function deleteSingleAvailability(
  ctx: { prisma: typeof import('@/lib/prisma').prisma; session: { user: { id: string } } },
  id: string,
  scope?: 'single' | 'future' | 'all'
) {
  // 1. Call business logic validation
  const validation = await validateAvailabilityDeletion(id, scope);

  if (!validation.success) {
    throw new Error(validation.error || 'Failed to validate availability deletion');
  }

  const { validatedData } = validation;
  if (!validatedData) {
    throw new Error('Validation data is missing');
  }

  // 2. Perform all database operations in single transaction
  const result = await ctx.prisma.$transaction(async (tx) => {
    // Get affected availabilities with full relations before deletion
    const affectedAvailabilities = await tx.availability.findMany({
      where: { id: { in: validatedData.affectedAvailabilityIds } },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        organization: true,
        location: true,
        calculatedSlots: {
          include: {
            booking: true,
          },
        },
      },
    });

    // Count slots to be deleted
    const slotsToDelete = affectedAvailabilities.reduce(
      (total: number, availability) => total + availability.calculatedSlots.length,
      0
    );

    // Delete calculated slots first (referential integrity)
    await tx.calculatedAvailabilitySlot.deleteMany({
      where: { availabilityId: { in: validatedData.affectedAvailabilityIds } },
    });

    // Delete availability records
    await tx.availability.deleteMany({
      where: { id: { in: validatedData.affectedAvailabilityIds } },
    });

    return { affectedAvailabilities, slotsDeleted: slotsToDelete };
  });

  // 3. Handle cache revalidation
  const { existingAvailability } = validatedData;

  revalidatePath('/dashboard/availability');
  revalidatePath('/dashboard/calendar');
  if (existingAvailability.organizationId) {
    revalidatePath(`/dashboard/organizations/${existingAvailability.organizationId}/availability`);
  }

  // 4. Return full typed data (automatic inference from Prisma includes)
  return {
    deletedAvailabilities: result.affectedAvailabilities, // Full objects before deletion
    deletedCount: result.affectedAvailabilities.length,
    slotsDeleted: result.slotsDeleted,
    deleteScope: validatedData.deleteStrategy,
    affectedSeriesId: existingAvailability.seriesId,
    organizationId: existingAvailability.organizationId,
  };
}

/**
 * Handle batch availability deletion (no scope support)
 */
async function deleteBatchAvailabilities(
  ctx: { prisma: typeof import('@/lib/prisma').prisma; session: { user: { id: string } } },
  ids: string[]
) {
  const results = [];
  const errors = [];

  // Process each deletion individually for better error handling
  for (const id of ids) {
    try {
      const result = await deleteSingleAvailability(ctx, id, 'single');
      results.push(result);
    } catch (error) {
      errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Failed to delete ${errors.length} availability(s): ${errors.map((e) => `${e.id}: ${e.error}`).join(', ')}`
    );
  }

  // Combine results
  const allDeletedAvailabilities = results.flatMap((r) => r.deletedAvailabilities);
  const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
  const totalSlotsDeleted = results.reduce((sum, r) => sum + r.slotsDeleted, 0);

  return {
    deletedAvailabilities: allDeletedAvailabilities,
    deletedCount: totalDeleted,
    slotsDeleted: totalSlotsDeleted,
    deleteScope: 'batch' as const,
    batchResults: results,
  };
}
