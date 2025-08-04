import { z } from 'zod';

import {
  createAvailability,
  deleteAvailability,
  updateAvailability
} from '@/features/calendar/lib/actions';
import { generateSlotsForAvailability } from '@/features/calendar/lib/slot-generation';
import {
  availabilityCreateSchema,
  availabilitySearchParamsSchema,
  updateAvailabilityDataSchema
} from '@/features/calendar/types/schemas';
import { AvailabilityStatus, SchedulingRule } from '@/features/calendar/types/types';
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
   * Migrated from: POST /api/calendar/availability/create
   */
  create: protectedProcedure.input(availabilityCreateSchema).mutation(async ({ ctx, input }) => {
    const result = await createAvailability(input);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create availability');
    }

    return result;
  }),

  /**
   * Update availability with slot regeneration
   * Migrated from: PUT /api/calendar/availability/update
   */
  update: protectedProcedure
    .input(updateAvailabilityDataSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await updateAvailability(input);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update availability');
      }

      return result;
    }),

  /**
   * Delete availability
   * Migrated from: DELETE /api/calendar/availability/delete
   */
  delete: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        scope: z.enum(['single', 'future', 'all']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.ids.length === 1 && input.scope) {
        const result = await deleteAvailability(input.ids[0], input.scope);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete availability');
        }
        return result;
      } else {
        const results = await Promise.all(input.ids.map((id) => deleteAvailability(id)));

        const failed = results.filter((r) => !r.success);
        if (failed.length > 0) {
          throw new Error(`Failed to delete ${failed.length} availability(s)`);
        }

        return { success: true };
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
        const slotResult = await generateSlotsForAvailability({
          availabilityId: updatedAvailability.id,
          providerId: updatedAvailability.providerId,
          organizationId: updatedAvailability.organizationId || '',
          locationId: updatedAvailability.locationId || undefined,
          startTime: updatedAvailability.startTime,
          endTime: updatedAvailability.endTime,
          services: updatedAvailability.availableServices.map((as) => ({
            serviceId: as.serviceId,
            duration: as.duration,
            price: Number(as.price),
          })),
          schedulingRule: updatedAvailability.schedulingRule as SchedulingRule,
          schedulingInterval: updatedAvailability.schedulingInterval || undefined,
        });

        if (!slotResult.success) {
          console.warn(`Slot generation failed for accepted availability ${updatedAvailability.id}:`, slotResult.errors?.join(', '));
        }

        console.log(`📧 Availability accepted notification would be sent for availability ${input.id}`);

        return { 
          success: true, 
          id: input.id,
          slotsGenerated: slotResult.success ? slotResult.slotsGenerated : 0
        };
      } catch (slotGenError) {
        console.warn(`Slot generation error for accepted availability ${input.id}:`, slotGenError);
        return { 
          success: true, 
          id: input.id,
          slotsGenerated: 0
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

      console.log(`📧 Availability rejected notification would be sent for availability ${input.id}`);
      if (input.reason) {
        console.log(`📝 Rejection reason: ${input.reason}`);
      }

      return { 
        success: true, 
        id: input.id 
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

      const allSlots = availabilities.flatMap(availability => 
        availability.calculatedSlots.map(slot => ({
          ...slot,
          provider: availability.provider,
          location: availability.location,
          isOnlineAvailable: availability.isOnlineAvailable,
        }))
      );

      return allSlots;
    }),

});
