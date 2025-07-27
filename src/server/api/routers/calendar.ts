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
import { availabilityCreateSchema } from '@/features/calendar/types/schemas';
import { AvailabilityStatus } from '@/features/calendar/types/types';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/trpc';

export const calendarRouter = createTRPCRouter({
  /**
   * Get service types for calendar availability
   * Migrated from: /api/calendar/availability/service-types
   */
  getServiceTypes: publicProcedure.query(async ({ ctx }) => {
    // Get all services with their provider types for availability filtering
    return ctx.prisma.service.findMany({
      include: {
        providerTypes: {
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
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
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
  create: protectedProcedure
    .input(availabilityCreateSchema)
    .mutation(async ({ ctx, input }) => {
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
      const result = await updateAvailability(input);

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
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteAvailability(input.ids);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete availability');
      }

      return result;
    }),

  /**
   * Cancel availability
   * Migrated from: POST /api/calendar/availability/cancel
   */
  cancel: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await cancelAvailability(input.ids);

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel availability');
      }

      return result;
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
          serviceId: input.serviceId,
          locationId: input.locationId,
          startTime: { gte: startDate },
          endTime: { lte: endDate },
          status: 'AVAILABLE',
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
          service: {
            select: {
              id: true,
              name: true,
              defaultDuration: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      // Generate slots from availabilities
      const slots = availabilities.flatMap((availability) => {
        const slotDuration = input.duration || availability.duration || 30;
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
              service: availability.service,
              location: availability.location,
              price: availability.price,
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
              serviceId: input.serviceId,
              locationId: input.locationId,
              startTime: { gte: startDate },
              endTime: { lte: endDate },
              status: 'AVAILABLE',
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
              serviceId: input.serviceId,
              locationId: input.locationId,
              startTime: { gte: startDate },
              endTime: { lte: endDate },
              status: 'AVAILABLE',
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

      // Find services with availability in the date range
      const services = await ctx.prisma.service.findMany({
        where: {
          availabilities: {
            some: {
              providerId: input.providerId,
              locationId: input.locationId,
              startTime: { gte: startDate },
              endTime: { lte: endDate },
              status: 'AVAILABLE',
              ...(input.onlineOnly && { isOnlineAvailable: true }),
            },
          },
        },
        include: {
          availabilities: {
            where: {
              providerId: input.providerId,
              locationId: input.locationId,
              startTime: { gte: startDate },
              endTime: { lte: endDate },
              status: 'AVAILABLE',
              ...(input.onlineOnly && { isOnlineAvailable: true }),
            },
            select: {
              id: true,
            },
          },
        },
      });

      return services.map((service) => ({
        ...service,
        availabilityCount: service.availabilities.length,
      }));
    }),
});