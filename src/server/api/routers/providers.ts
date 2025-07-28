import { z } from 'zod';

import { deleteProvider } from '@/features/providers/lib/actions/delete-provider';
import { registerProvider } from '@/features/providers/lib/actions/register-provider';
import {
  updateProviderBasicInfo,
  updateProviderRequirements,
  updateProviderServices,
} from '@/features/providers/lib/actions/update-provider';
import { serializeProvider } from '@/features/providers/lib/helper';
import { searchProviders } from '@/features/providers/lib/search';
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/trpc';

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
        const serviceConfig = serviceConfigs?.find((config) => config.serviceId === service.id);

        // Determine if the service is configured by the provider
        const hasCustomConfig = !!serviceConfig;
        const currentPrice = serviceConfig?.price
          ? Number(serviceConfig.price)
          : service.defaultPrice
            ? Number(service.defaultPrice)
            : null;
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
          customConfig: serviceConfig
            ? {
                id: serviceConfig.id,
                duration: serviceConfig.duration,
                price: serviceConfig.price ? Number(serviceConfig.price) : null,
                isOnlineAvailable: serviceConfig.isOnlineAvailable,
                isInPerson: serviceConfig.isInPerson,
                locationId: serviceConfig.locationId,
              }
            : undefined,
        };
      });
    }),

  /**
   * Search providers
   * Migrated from: GET /api/providers
   */
  search: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        typeIds: z.array(z.string()).optional(),
        status: z.string().default('APPROVED'),
        limit: z.number().default(50),
        offset: z.number().default(0),
        includeServices: z.boolean().default(true),
        includeRequirements: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      return searchProviders(input);
    }),

  /**
   * Get a single provider by ID
   * Migrated from: GET /api/providers/[id]
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const provider = await ctx.prisma.provider.findUnique({
      where: { id: input.id },
      include: {
        services: true,
        availabilityConfigs: {
          include: {
            service: true,
          },
        },
        user: {
          select: {
            email: true,
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
        requirementSubmissions: {
          include: {
            requirementType: true,
          },
        },
      },
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    return serializeProvider(provider);
  }),

  /**
   * Create a new provider
   * Migrated from: POST /api/providers
   */
  create: protectedProcedure
    .input(
      z.object({
        basicInfo: z.object({
          name: z.string(),
          bio: z.string().optional(),
          email: z.string().email(),
          whatsapp: z.string().optional(),
          website: z.string().optional(),
          image: z.string().optional(),
          languages: z.array(z.string()).optional(),
        }),
        providerTypeIds: z.array(z.string()).min(1),
        services: z
          .object({
            availableServices: z.array(z.string()).optional(),
            serviceConfigs: z
              .record(
                z.string(),
                z.object({
                  duration: z.number().optional(),
                  price: z.number().optional(),
                })
              )
              .optional(),
          })
          .optional(),
        regulatoryRequirements: z
          .object({
            requirements: z
              .array(
                z.object({
                  requirementTypeId: z.string(),
                  value: z.string().optional(),
                  documentMetadata: z.any().optional(),
                })
              )
              .optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new Error('Unauthorized');
      }

      // Convert input to FormData for the server action
      const formData = new FormData();
      formData.append('userId', ctx.session.user.id);

      // Add basic info
      formData.append('name', input.basicInfo.name);
      formData.append('bio', input.basicInfo.bio || '');
      formData.append('email', input.basicInfo.email);
      formData.append('whatsapp', input.basicInfo.whatsapp || '');
      if (input.basicInfo.website) {
        formData.append('website', input.basicInfo.website);
      }
      if (input.basicInfo.image) {
        formData.append('imageUrl', input.basicInfo.image);
      }

      // Add provider types
      input.providerTypeIds.forEach((typeId) => {
        formData.append('providerTypeIds', typeId);
      });

      // Add languages
      input.basicInfo.languages?.forEach((lang) => {
        formData.append('languages', lang);
      });

      // Add services
      input.services?.availableServices?.forEach((serviceId) => {
        formData.append('services', serviceId);

        const config = input.services?.serviceConfigs?.[serviceId];
        if (config?.duration) {
          formData.append(`serviceConfigs[${serviceId}][duration]`, config.duration.toString());
        }
        if (config?.price) {
          formData.append(`serviceConfigs[${serviceId}][price]`, config.price.toString());
        }
      });

      // Add requirements
      input.regulatoryRequirements?.requirements?.forEach((req, index) => {
        formData.append(`requirements[${index}][requirementTypeId]`, req.requirementTypeId);
        if (req.value) {
          formData.append(`requirements[${index}][value]`, req.value);
        }
        if (req.documentMetadata) {
          formData.append(
            `requirements[${index}][documentMetadata]`,
            JSON.stringify(req.documentMetadata)
          );
        }
      });

      const result = await registerProvider({}, formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to register provider');
      }

      return result;
    }),

  /**
   * Update provider basic info
   * Migrated from: PUT /api/providers/[id]
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        bio: z.string().optional(),
        email: z.string().email().optional(),
        whatsapp: z.string().optional(),
        website: z.string().optional(),
        image: z.string().optional(),
        languages: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const formData = new FormData();
      formData.append('id', input.id);

      if (input.name) formData.append('name', input.name);
      if (input.bio) formData.append('bio', input.bio);
      if (input.email) formData.append('email', input.email);
      if (input.whatsapp) formData.append('whatsapp', input.whatsapp);
      if (input.website) formData.append('website', input.website);
      if (input.image) formData.append('imageUrl', input.image);
      input.languages?.forEach((lang) => formData.append('languages', lang));

      const result = await updateProviderBasicInfo({}, formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update provider');
      }

      return result;
    }),

  /**
   * Update provider services
   * Migrated from: PUT /api/providers/[id]/services
   */
  updateServices: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        services: z.array(z.string()).optional(),
        serviceConfigs: z
          .record(
            z.string(),
            z.object({
              duration: z.number().optional(),
              price: z.number().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const formData = new FormData();
      formData.append('id', input.id);

      input.services?.forEach((serviceId) => {
        formData.append('services', serviceId);

        const config = input.serviceConfigs?.[serviceId];
        if (config?.duration) {
          formData.append(`serviceConfigs[${serviceId}][duration]`, config.duration.toString());
        }
        if (config?.price) {
          formData.append(`serviceConfigs[${serviceId}][price]`, config.price.toString());
        }
      });

      const result = await updateProviderServices({}, formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update services');
      }

      return result;
    }),

  /**
   * Update provider requirements
   * Migrated from: PUT /api/providers/[id]/requirements
   */
  updateRequirements: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        requirements: z.array(
          z.object({
            requirementTypeId: z.string(),
            value: z.string().optional(),
            documentMetadata: z.any().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const formData = new FormData();
      formData.append('id', input.id);

      input.requirements.forEach((req, index) => {
        formData.append(`requirements[${index}][requirementTypeId]`, req.requirementTypeId);
        if (req.value) {
          formData.append(`requirements[${index}][value]`, req.value);
        }
        if (req.documentMetadata) {
          formData.append(
            `requirements[${index}][documentMetadata]`,
            JSON.stringify(req.documentMetadata)
          );
        }
      });

      const result = await updateProviderRequirements({}, formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update requirements');
      }

      return result;
    }),

  /**
   * Delete a provider
   * Migrated from: DELETE /api/providers/[id]
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteProvider(input.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete provider');
      }

      return result;
    }),

  /**
   * Get provider's associated services
   * Migrated from: GET /api/providers/[id]/services
   */
  getProviderServices: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: { services: true },
      });

      if (!provider) {
        return [];
      }

      return provider.services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description ?? undefined,
        price: Number(service.defaultPrice),
        duration: service.defaultDuration,
      }));
    }),
});
