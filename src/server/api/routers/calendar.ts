import { z } from 'zod';

import {
  acceptAvailability,
  cancelAvailability,
  createAvailability,
  deleteAvailability,
  getAvailabilityById,
  rejectAvailability,
  searchAvailability,
  updateAvailability,
} from '@/features/calendar/lib/actions';
import { geocodeAddress } from '@/features/calendar/lib/location-search-service';
import { getDatabasePerformanceRecommendations } from '@/features/calendar/lib/search-performance-service';
import { availabilityCreateSchema } from '@/features/calendar/types/schemas';
import { AvailabilityStatus } from '@/features/calendar/types/types';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';

export const calendarRouter = createTRPCRouter({
  /**
   * Get service types for calendar availability
   * Migrated from: /api/calendar/availability/service-types
   */
  getServiceTypes: publicProcedure.query(async ({ ctx }) => {
    // Get all services with their provider types for availability filtering
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

  /**
   * Search availability
   * Migrated from: GET /api/calendar/availability
   */
  searchAvailability: publicProcedure
    .input(
      z.object({
        providerId: z.string().optional(),
        organizationId: z.string().optional(),
        locationId: z.string().optional(),
        serviceId: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        status: z.nativeEnum(AvailabilityStatus).optional(),
        seriesId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const params = {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };

      const result = await searchAvailability(params);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch availability');
      }

      return result.data || [];
    }),

  /**
   * Get availability by ID
   * Migrated from: GET /api/calendar/availability/[id]
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const result = await getAvailabilityById(input.id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch availability');
    }

    return result.data;
  }),

  /**
   * Create availability
   * Migrated from: POST /api/calendar/availability/create
   */
  create: protectedProcedure.input(availabilityCreateSchema).mutation(async ({ ctx, input }) => {
    const result = await createAvailability(input);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create availability');
    }

    return result.data;
  }),

  /**
   * Update availability
   * Migrated from: PUT /api/calendar/availability/update
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
        serviceId: z.string().optional(),
        price: z.number().optional(),
        duration: z.number().optional(),
        isOnlineAvailable: z.boolean().optional(),
        locationId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Convert string dates to Date objects
      const updateData = {
        ...input,
        startTime: input.startTime ? new Date(input.startTime) : undefined,
        endTime: input.endTime ? new Date(input.endTime) : undefined,
      };
      
      const result = await updateAvailability(updateData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update availability');
      }

      return result.data;
    }),

  /**
   * Delete availability
   * Migrated from: DELETE /api/calendar/availability/delete
   */
  delete: protectedProcedure
    .input(z.object({ 
      ids: z.array(z.string()),
      scope: z.enum(['single', 'future', 'all']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Handle single deletion with scope or bulk deletion
      if (input.ids.length === 1 && input.scope) {
        // Single deletion with scope
        const result = await deleteAvailability(input.ids[0], input.scope);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete availability');
        }
        return result;
      } else {
        // Bulk deletion (no scope support)
        const results = await Promise.all(
          input.ids.map(id => deleteAvailability(id))
        );
        
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
          throw new Error(`Failed to delete ${failed.length} availability(s)`);
        }
        
        return { success: true };
      }
    }),

  /**
   * Cancel availability
   * Migrated from: POST /api/calendar/availability/cancel
   */
  cancel: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      // Handle multiple cancellations
      const results = await Promise.all(
        input.ids.map(id => cancelAvailability(id))
      );
      
      const hasErrors = results.some(result => !result.success);
      if (hasErrors) {
        const errorMessages = results
          .filter(result => !result.success)
          .map(result => result.error)
          .join(', ');
        throw new Error(`Failed to cancel some availability: ${errorMessages}`);
      }

      return { success: true };
    }),

  /**
   * Accept availability (for org-proposed)
   * Migrated from: POST /api/calendar/availability/accept
   */
  accept: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await acceptAvailability(input.ids);

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept availability');
      }

      return result;
    }),

  /**
   * Reject availability (for org-proposed)
   * Migrated from: POST /api/calendar/availability/reject
   */
  reject: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await rejectAvailability(input.ids);

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject availability');
      }

      return result;
    }),

  /**
   * Search available slots
   * Migrated from: POST /api/calendar/availability/search/slots
   */
  searchSlots: publicProcedure
    .input(
      z.object({
        providerId: z.string().optional(),
        serviceId: z.string().optional(),
        locationId: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        duration: z.number().optional(),
        onlineOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Find available slots based on availability
      const availabilities = await ctx.prisma.availability.findMany({
        where: {
          providerId: input.providerId,
          locationId: input.locationId,
          startTime: { gte: startDate },
          endTime: { lte: endDate },
          status: AvailabilityStatus.ACCEPTED,
          ...(input.onlineOnly && { isOnlineAvailable: true }),
        },
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              formattedAddress: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      // Generate slots from availabilities
      const slots = availabilities.flatMap((availability) => {
        const slotDuration = input.duration || 30;
        const slots = [];
        let currentTime = new Date(availability.startTime);
        const endTime = new Date(availability.endTime);

        while (currentTime < endTime) {
          const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
          if (slotEnd <= endTime) {
            slots.push({
              id: `${availability.id}-${currentTime.getTime()}`,
              availabilityId: availability.id,
              startTime: currentTime.toISOString(),
              endTime: slotEnd.toISOString(),
              provider: availability.provider,
              location: availability.location,
              isOnlineAvailable: availability.isOnlineAvailable,
            });
          }
          currentTime = slotEnd;
        }

        return slots;
      });

      return slots;
    }),

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

      // Find providers with availability in the date range
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
      const services = await ctx.prisma.service.findMany({
      });

      return services;
    }),

  /**
   * Geocode an address
   * Migrated from: GET /api/calendar/availability/geocode
   */
  geocodeAddress: publicProcedure
    .input(
      z.object({
        address: z.string().min(1, 'Address is required'),
      })
    )
    .query(async ({ input }) => {
      const result = await geocodeAddress(input.address);

      if (!result) {
        throw new Error('Could not geocode the provided address');
      }

      return result;
    }),

  /**
   * Get database performance recommendations
   * Migrated from: GET /api/calendar/availability/performance/recommendations
   */
  getPerformanceRecommendations: publicProcedure.query(async () => {
    const recommendations = await getDatabasePerformanceRecommendations();
    return recommendations;
  }),
});
