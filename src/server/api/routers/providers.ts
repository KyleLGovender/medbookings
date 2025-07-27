import { z } from 'zod';

import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from '@/server/trpc';

export const providersRouter = createTRPCRouter({
  /**
   * Get all provider types
   * Migrated from: /api/providers/provider-types
   */
  getProviderTypes: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.providerType.findMany({
      orderBy: { name: 'asc' },
    });
  }),

  /**
   * Get all requirement types
   * Migrated from: /api/providers/requirement-types
   */
  getRequirementTypes: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.requirementType.findMany({
      orderBy: { name: 'asc' },
    });
  }),

  /**
   * Get services for a provider type
   * Migrated from: /api/providers/services
   */
  getServices: publicProcedure
    .input(
      z.object({
        providerTypeId: z.string(),
        providerId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { providerTypeId, providerId } = input;

      // Fetch provider type with its services
      const providerType = await ctx.prisma.providerType.findUnique({
        where: { id: providerTypeId },
        include: {
          services: {
            select: {
              id: true,
              name: true,
              description: true,
              defaultDuration: true,
              defaultPrice: true,
              displayPriority: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              displayPriority: 'asc',
            },
          },
        },
      });

      if (!providerType) {
        throw new Error(`Provider type with ID ${providerTypeId} not found`);
      }

      // If providerId is provided, fetch the provider's service configurations
      let serviceConfigs: Array<{
        id: string;
        serviceId: string;
        duration: number;
        price: any;
        isOnlineAvailable: boolean;
        isInPerson: boolean;
        locationId: string | null;
      }> | null = null;

      if (providerId) {
        const provider = await ctx.prisma.provider.findUnique({
          where: { id: providerId },
          include: {
            availabilityConfigs: {
              select: {
                id: true,
                serviceId: true,
                duration: true,
                price: true,
                isOnlineAvailable: true,
                isInPerson: true,
                locationId: true,
              },
            },
          },
        });

        if (provider) {
          serviceConfigs = provider.availabilityConfigs;
        }
      }

      // Map services and add service config data if available
      return providerType.services.map((service) => {
        // Check if this service has been configured by the provider
        const serviceConfig = serviceConfigs?.find(
          (config) => config.serviceId === service.id
        );

        // Determine if the service is configured by the provider
        const hasCustomConfig = !!serviceConfig;
        const currentPrice = serviceConfig?.price 
          ? Number(serviceConfig.price) 
          : (service.defaultPrice ? Number(service.defaultPrice) : null);
        const currentDuration = serviceConfig?.duration || service.defaultDuration;

        return {
          id: service.id,
          name: service.name,
          description: service.description ?? undefined,
          defaultDuration: service.defaultDuration,
          defaultPrice: service.defaultPrice ? Number(service.defaultPrice) : null,
          displayPriority: service.displayPriority,
          createdAt: service.createdAt ? service.createdAt.toISOString() : undefined,
          updatedAt: service.updatedAt ? service.updatedAt.toISOString() : undefined,
          // SerializedService fields for provider services API
          isSelected: hasCustomConfig,
          currentPrice,
          currentDuration,
          hasCustomConfig,
          customConfig: serviceConfig ? {
            id: serviceConfig.id,
            duration: serviceConfig.duration,
            price: serviceConfig.price ? Number(serviceConfig.price) : null,
            isOnlineAvailable: serviceConfig.isOnlineAvailable,
            isInPerson: serviceConfig.isInPerson,
            locationId: serviceConfig.locationId,
          } : undefined,
        };
      });
    }),
});