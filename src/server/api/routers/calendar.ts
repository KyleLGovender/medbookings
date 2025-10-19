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
      // Verify slot exists and is available
      const slot = await ctx.prisma.calculatedAvailabilitySlot.findUnique({
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
          serviceConfig: true, // Include serviceConfig for price information
        },
      });

      if (!slot) {
        throw new Error('Slot not found');
      }

      if (slot.booking) {
        throw new Error('Slot is already booked');
      }

      if (slot.startTime <= new Date()) {
        throw new Error('Cannot book past slots');
      }

      // Create booking
      const booking = await ctx.prisma.booking.create({
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

      // TODO: Send confirmation emails to both client and provider
      // TODO: Send calendar invites if applicable
      // TODO: Trigger notification workflows

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
