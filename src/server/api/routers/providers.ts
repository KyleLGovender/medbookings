import { Languages } from '@prisma/client';
import { z } from 'zod';

import { sendProviderWhatsappConfirmation } from '@/features/communications/lib/server-helper';
import {
  ConnectionUpdateSchema,
  InvitationResponseSchema,
  basicInfoSchema,
  providerSearchParamsSchema,
  regulatoryRequirementsSchema,
  servicesSchema,
} from '@/features/providers/types/schemas';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';

export const providersRouter = createTRPCRouter({
  // ============================================================================
  // PROVIDER IDENTITY & BASIC QUERIES
  // ============================================================================

  /**
   * Get current user's provider ID
   * Migrated from: GET /api/service-provider/me
   */
  getCurrentProvider: protectedProcedure.query(async ({ ctx }) => {
    const provider = await ctx.prisma.provider.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    });

    if (!provider) {
      return { serviceProviderId: undefined };
    }

    return { serviceProviderId: provider.id };
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
            id: true,
            email: true,
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

    return provider;
  }),

  /**
   * Get provider by user ID
   * Migrated from: GET /api/providers/user/[userId]
   */
  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const provider = await ctx.prisma.provider.findUnique({
        where: { userId: input.userId },
        include: {
          services: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
          typeAssignments: {
            include: {
              providerType: {
                select: {
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
        return null;
      }

      return provider;
    }),

  /**
   * Get providers by type
   * Additional procedure for filtering providers by type
   */
  getByType: publicProcedure
    .input(
      z.object({
        providerTypeId: z.string(),
        status: z.enum(['APPROVED', 'PENDING_APPROVAL', 'REJECTED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const providers = await ctx.prisma.provider.findMany({
        where: {
          typeAssignments: {
            some: {
              providerTypeId: input.providerTypeId,
            },
          },
          ...(input.status && { status: input.status }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
          services: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return providers;
    }),

  /**
   * Get all approved providers
   * Migrated from: getApprovedProviders() lib function
   * Database query moved to tRPC procedure for Option C compliance
   */
  getApproved: publicProcedure.query(async ({ ctx }) => {
    const providers = await ctx.prisma.provider.findMany({
      where: {
        status: 'APPROVED', // Only fetch approved providers
      },
      include: {
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
        services: true,
        user: {
          select: {
            email: true,
          },
        },
        requirementSubmissions: {
          include: {
            requirementType: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return providers;
  }),

  // ============================================================================
  // PROVIDER SEARCH & DISCOVERY
  // ============================================================================

  /**
   * Search providers
   * Migrated from: GET /api/providers
   * Database query moved to tRPC procedure for Option C compliance
   */
  search: publicProcedure
    .input(
      providerSearchParamsSchema.extend({
        typeIds: z.array(z.string()).optional(),
        includeServices: z.boolean().default(true),
        includeRequirements: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        search,
        typeIds = [],
        status = 'APPROVED',
        page = 1,
        limit = 50,
        includeServices = true,
        includeRequirements = false,
      } = input;

      // Convert page to offset
      const offset = (page - 1) * limit;

      // Build optimized where clause
      const where: any = {
        status: status as any,
      };

      // Add search filter with optimized text search
      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            bio: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Optimized type filter using the indexed n:n relationship
      if (typeIds.length > 0) {
        where.typeAssignments = {
          some: {
            providerTypeId: {
              in: typeIds,
            },
          },
        };
      }

      // Build optimized include clause based on requirements
      const include: any = {
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
      };

      // Conditionally include services to avoid unnecessary JOINs
      if (includeServices) {
        include.services = true;
      }

      // Conditionally include requirements to avoid unnecessary JOINs
      if (includeRequirements) {
        include.requirementSubmissions = {
          include: {
            requirementType: true,
          },
        };
      }

      // Execute optimized query with pagination
      const [providers, total] = await Promise.all([
        ctx.prisma.provider.findMany({
          where,
          include,
          orderBy: {
            name: 'asc',
          },
          take: limit,
          skip: offset,
        }),
        ctx.prisma.provider.count({ where }),
      ]);

      return {
        providers: providers,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  // ============================================================================
  // PROVIDER LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Create a new provider
   * Migrated from: POST /api/providers
   */
  create: protectedProcedure
    .input(
      z.object({
        basicInfo: basicInfoSchema.pick({
          name: true,
          bio: true,
          email: true,
          whatsapp: true,
          website: true,
          image: true,
          languages: true,
        }),
        providerTypeIds: z.array(z.string()).min(1),
        services: servicesSchema.optional(),
        regulatoryRequirements: regulatoryRequirementsSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new Error('Unauthorized');
      }

      const userId = ctx.session.user.id;
      const services = input.services?.availableServices || [];
      const serviceConfigs = input.services?.serviceConfigs || {};
      const requirements = input.regulatoryRequirements?.requirements || [];

      // Basic validation
      if (input.providerTypeIds.length === 0) {
        throw new Error('At least one provider type must be selected');
      }

      // Validate that all provider types exist
      const existingProviderTypes = await ctx.prisma.providerType.findMany({
        where: { id: { in: input.providerTypeIds } },
        select: { id: true },
      });

      if (existingProviderTypes.length !== input.providerTypeIds.length) {
        const foundTypeIds = existingProviderTypes.map((t) => t.id);
        const missingTypes = input.providerTypeIds.filter((id) => !foundTypeIds.includes(id));
        throw new Error(`Provider types not found: ${missingTypes.join(', ')}`);
      }

      // Validate that all services exist
      if (services.length > 0) {
        const existingServices = await ctx.prisma.service.findMany({
          where: { id: { in: services } },
          select: { id: true },
        });

        if (existingServices.length !== services.length) {
          const foundServiceIds = existingServices.map((s) => s.id);
          const missingServices = services.filter((id) => !foundServiceIds.includes(id));
          throw new Error(`Services not found: ${missingServices.join(', ')}`);
        }
      }

      // Process requirements
      const requirementSubmissions: Array<{
        requirementTypeId: string;
        documentMetadata: Record<string, any>;
        status: 'PENDING';
      }> = [];

      for (const req of requirements) {
        if (req.requirementTypeId) {
          let documentMetadata: Record<string, any> = {};

          if (req.documentMetadata) {
            documentMetadata = req.documentMetadata;
          } else if (req.value !== undefined) {
            documentMetadata = { value: req.value };
          }

          if (Object.keys(documentMetadata).length > 0) {
            requirementSubmissions.push({
              requirementTypeId: req.requirementTypeId,
              documentMetadata,
              status: 'PENDING',
            });
          }
        }
      }

      // Send WhatsApp confirmation
      try {
        await sendProviderWhatsappConfirmation(
          input.basicInfo.name,
          input.basicInfo.whatsapp || ''
        );
      } catch (error) {
        console.error('Failed to send WhatsApp confirmation:', error);
        // Don't fail registration if WhatsApp fails
      }

      // Create provider with all relations in a single transaction
      const provider = await ctx.prisma.$transaction(async (tx) => {
        // Create the provider
        const newProvider = await tx.provider.create({
          data: {
            userId,
            image: input.basicInfo.image || '',
            name: input.basicInfo.name,
            bio: input.basicInfo.bio || '',
            email: input.basicInfo.email,
            whatsapp: input.basicInfo.whatsapp || '',
            website: input.basicInfo.website || null,
            languages: (input.basicInfo.languages || []) as Languages[],
            services: {
              connect: services.map((id) => ({ id })),
            },
            typeAssignments: {
              create: input.providerTypeIds.map((typeId) => ({
                providerTypeId: typeId,
              })),
            },
            requirementSubmissions: {
              create: requirementSubmissions,
            },
          },
          include: {
            services: true,
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

        // Create ServiceAvailabilityConfig records for services with custom configurations
        if (Object.keys(serviceConfigs).length > 0) {
          try {
            const serviceAvailabilityConfigs = Object.entries(serviceConfigs).map(
              ([serviceId, config]) => ({
                serviceId,
                providerId: newProvider.id,
                duration: config.duration || 30, // Default to 30 minutes
                price: config.price || 0, // Default to 0
                isOnlineAvailable: config.isOnlineAvailable ?? true, // Default to online available
                isInPerson: config.isInPerson ?? false, // Default to not in-person
              })
            );

            await tx.serviceAvailabilityConfig.createMany({
              data: serviceAvailabilityConfigs,
            });
          } catch (configError) {
            console.error('Failed to create ServiceAvailabilityConfig records:', configError);
            // Don't fail the entire registration if ServiceAvailabilityConfig creation fails
          }
        }

        return newProvider;
      });

      return { success: true, data: provider, redirect: '/profile' };
    }),

  /**
   * Update provider basic info
   * Migrated from: PUT /api/providers/[id]
   */
  update: protectedProcedure
    .input(
      basicInfoSchema.partial().extend({
        id: z.string(),
        providerTypeIds: z.array(z.string()).optional(),
        providerTypeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current provider data to compare changes
      const currentProvider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: {
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
        },
      });

      if (!currentProvider) {
        throw new Error('Provider not found');
      }

      // Build update data object only with changed fields
      const updateData: any = {};

      // Only include fields that were actually changed and provided
      if (input.name && input.name !== currentProvider.name) updateData.name = input.name;
      if (input.image && input.image !== currentProvider.image) updateData.image = input.image;
      if (input.bio !== undefined && input.bio !== currentProvider.bio) updateData.bio = input.bio;
      if (input.email && input.email !== currentProvider.email) updateData.email = input.email;
      if (input.whatsapp !== undefined && input.whatsapp !== currentProvider.whatsapp)
        updateData.whatsapp = input.whatsapp;
      if (input.website !== currentProvider.website) updateData.website = input.website;
      if (
        input.languages &&
        JSON.stringify(input.languages) !== JSON.stringify(currentProvider.languages)
      ) {
        updateData.languages = input.languages as Languages[];
      }
      if (input.showPrice !== undefined && input.showPrice !== currentProvider.showPrice) {
        updateData.showPrice = input.showPrice;
      }

      // Handle provider type assignments
      const currentTypeIds = currentProvider.typeAssignments.map(
        (assignment) => assignment.providerTypeId
      );
      const newTypeIds =
        input.providerTypeIds || (input.providerTypeId ? [input.providerTypeId] : []);

      // Check if type assignments changed
      const typeAssignmentsChanged =
        newTypeIds.length > 0 &&
        JSON.stringify(currentTypeIds.sort()) !== JSON.stringify(newTypeIds.sort());

      if (typeAssignmentsChanged) {
        updateData.typeAssignments = {
          deleteMany: {}, // Remove all existing assignments
          create: newTypeIds.map((typeId) => ({
            providerTypeId: typeId,
          })),
        };
      }

      // Send WhatsApp confirmation if WhatsApp changed
      if (input.whatsapp && input.whatsapp !== currentProvider.whatsapp) {
        try {
          await sendProviderWhatsappConfirmation(
            input.name || currentProvider.name,
            input.whatsapp
          );
        } catch (error) {
          console.error('Failed to send WhatsApp confirmation:', error);
          // Don't fail update if WhatsApp fails
        }
      }

      // Update provider with automatic type inference
      const updatedProvider = await ctx.prisma.provider.update({
        where: { id: input.id },
        data: updateData,
        include: {
          services: true,
          user: {
            select: {
              id: true,
              email: true,
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
          requirementSubmissions: {
            include: {
              requirementType: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedProvider,
        redirect: `/providers/${input.id}`,
      };
    }),

  /**
   * Delete a provider
   * Migrated from: DELETE /api/providers/[id]
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new Error('You must be logged in to delete a provider');
      }

      // Get the provider to check ownership and relations
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          requirementSubmissions: true,
          availabilityConfigs: true,
          services: true,
        },
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      // Check if user is authorized (either the owner or an admin)
      const isAuthorized =
        provider.userId === userId ||
        ctx.session.user.role === 'ADMIN' ||
        ctx.session.user.role === 'SUPER_ADMIN';

      if (!isAuthorized) {
        throw new Error('You are not authorized to delete this provider');
      }

      // Delete all related records in the correct order using transaction
      await ctx.prisma.$transaction(async (tx) => {
        // 1. Delete requirement submissions
        if (provider.requirementSubmissions.length > 0) {
          await tx.requirementSubmission.deleteMany({
            where: { providerId: input.id },
          });
        }

        // 2. Delete calculated availability slots for each config
        for (const config of provider.availabilityConfigs) {
          await tx.calculatedAvailabilitySlot.deleteMany({
            where: { serviceConfigId: config.id },
          });
        }

        // 3. Delete availability configs
        if (provider.availabilityConfigs.length > 0) {
          await tx.serviceAvailabilityConfig.deleteMany({
            where: { providerId: input.id },
          });
        }

        // 4. Delete availability records
        await tx.availability.deleteMany({
          where: { providerId: input.id },
        });

        // 5. Find all slots associated with this provider's availability configs
        const slotIds: string[] = [];
        for (const config of provider.availabilityConfigs) {
          const slots = await tx.calculatedAvailabilitySlot.findMany({
            where: { serviceConfigId: config.id },
            select: { id: true },
          });
          slotIds.push(...slots.map((slot) => slot.id));
        }

        // 6. Delete bookings associated with those slots
        if (slotIds.length > 0) {
          await tx.booking.deleteMany({
            where: {
              slotId: { in: slotIds },
            },
          });
        }

        // 7. Disconnect services
        if (provider.services.length > 0) {
          await tx.provider.update({
            where: { id: input.id },
            data: {
              services: {
                set: [],
              },
            },
          });
        }

        // 8. Finally delete the provider
        await tx.provider.delete({
          where: { id: input.id },
        });
      });

      return { success: true };
    }),

  // ============================================================================
  // PROVIDER TYPES & SERVICES MANAGEMENT
  // ============================================================================

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
   * Get services for multiple provider types
   * Used when a provider has multiple specialties
   */
  getServicesForMultipleTypes: publicProcedure
    .input(
      z.object({
        providerTypeIds: z.array(z.string()),
        providerId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { providerTypeIds, providerId } = input;

      if (!providerTypeIds.length) {
        return [];
      }

      // Fetch all services for the given provider types
      const services = await ctx.prisma.service.findMany({
        where: {
          providerTypeId: {
            in: providerTypeIds,
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          defaultDuration: true,
          defaultPrice: true,
          displayPriority: true,
          providerTypeId: true,
          providerType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ displayPriority: 'asc' }, { name: 'asc' }],
      });

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
      return services.map((service) => {
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
          providerTypeId: service.providerTypeId,
          providerTypeName: service.providerType.name,
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

  /**
   * Update provider services
   * Migrated from: PUT /api/providers/[id]/services
   */
  updateServices: protectedProcedure
    .input(
      z
        .object({
          id: z.string(),
        })
        .merge(servicesSchema.omit({ loadedServices: true }).partial())
    )
    .mutation(async ({ ctx, input }) => {
      // Safety check: only proceed if availableServices is provided and not empty
      if (!input.availableServices || input.availableServices.length === 0) {
        throw new Error('No services provided. At least one service must be selected.');
      }

      const serviceIds = input.availableServices;
      const serviceConfigs = input.serviceConfigs || {};

      // Get current provider data
      const currentProvider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: {
          services: true,
        },
      });

      if (!currentProvider) {
        throw new Error('Provider not found');
      }

      // Update the provider's services and configs in a transaction
      await ctx.prisma.$transaction(async (tx) => {
        // First, disconnect all existing services
        await tx.provider.update({
          where: { id: input.id },
          data: {
            services: {
              set: [], // Remove all existing connections
            },
          },
        });

        // Then connect the new services
        await tx.provider.update({
          where: { id: input.id },
          data: {
            services: {
              connect: serviceIds.map((serviceId) => ({ id: serviceId })),
            },
          },
        });

        // Delete existing ServiceAvailabilityConfig records for services no longer selected
        await tx.serviceAvailabilityConfig.deleteMany({
          where: {
            providerId: input.id,
            serviceId: {
              notIn: serviceIds,
            },
          },
        });

        // Update or create ServiceAvailabilityConfig records for selected services
        for (const serviceId of serviceIds) {
          const config = serviceConfigs[serviceId];

          if (config) {
            // Try to update existing config first
            const existingConfig = await tx.serviceAvailabilityConfig.findFirst({
              where: {
                providerId: input.id,
                serviceId: serviceId,
              },
            });

            if (existingConfig) {
              // Update existing config
              await tx.serviceAvailabilityConfig.update({
                where: { id: existingConfig.id },
                data: {
                  duration: config.duration,
                  price: config.price,
                },
              });
            } else {
              // Create new config
              await tx.serviceAvailabilityConfig.create({
                data: {
                  providerId: input.id,
                  serviceId: serviceId,
                  duration: config.duration,
                  price: config.price,
                  isOnlineAvailable: true, // Default to online available
                  isInPerson: false, // Default to not in-person
                },
              });
            }
          } else {
            // No config provided, but service is selected - ensure we have a config with defaults
            const existingConfig = await tx.serviceAvailabilityConfig.findFirst({
              where: {
                providerId: input.id,
                serviceId: serviceId,
              },
            });

            if (!existingConfig) {
              // Get service defaults
              const service = await tx.service.findUnique({
                where: { id: serviceId },
                select: { defaultPrice: true, defaultDuration: true },
              });

              // Create config with service defaults
              await tx.serviceAvailabilityConfig.create({
                data: {
                  providerId: input.id,
                  serviceId: serviceId,
                  duration: service?.defaultDuration || 30,
                  price: service?.defaultPrice || 0,
                  isOnlineAvailable: true,
                  isInPerson: false,
                },
              });
            }
          }
        }
      });

      return {
        success: true,
        message: 'Services updated successfully',
        redirect: `/providers/${input.id}`,
      };
    }),

  // ============================================================================
  // REQUIREMENTS & REGULATORY COMPLIANCE
  // ============================================================================

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
   * Get requirements for multiple provider types
   * Used when a provider has multiple specialties
   */
  getRequirementsForMultipleTypes: publicProcedure
    .input(
      z.object({
        providerTypeIds: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const { providerTypeIds } = input;

      if (!providerTypeIds.length) {
        return [];
      }

      // Fetch all requirements for the given provider types
      const providerTypesWithRequirements = await ctx.prisma.providerType.findMany({
        where: {
          id: {
            in: providerTypeIds,
          },
        },
        select: {
          id: true,
          name: true,
          requirements: {
            select: {
              id: true,
              name: true,
              description: true,
              validationType: true,
              isRequired: true,
              validationConfig: true,
              displayPriority: true,
            },
            orderBy: [{ displayPriority: 'asc' }, { name: 'asc' }],
          },
        },
      });

      // Flatten requirements and add provider type info
      const allRequirements: any[] = [];
      const seenRequirementIds = new Set<string>();

      providerTypesWithRequirements.forEach((providerType) => {
        providerType.requirements.forEach((requirement) => {
          // Avoid duplicates if the same requirement is used by multiple provider types
          if (!seenRequirementIds.has(requirement.id)) {
            seenRequirementIds.add(requirement.id);
            allRequirements.push({
              ...requirement,
              providerTypeId: providerType.id,
              providerTypeName: providerType.name,
            });
          }
        });
      });

      return allRequirements;
    }),

  /**
   * Update provider requirements
   * Migrated from: PUT /api/providers/[id]/requirements
   */
  updateRequirements: protectedProcedure
    .input(
      z
        .object({
          id: z.string(),
        })
        .merge(regulatoryRequirementsSchema)
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new Error('Unauthorized');
      }

      const userId = ctx.session.user.id;

      // Get current provider data
      const currentProvider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: {
          requirementSubmissions: true,
        },
      });

      if (!currentProvider) {
        throw new Error('Provider not found');
      }

      // Check authorization
      if (currentProvider.userId !== userId) {
        throw new Error('Unauthorized to update this provider');
      }

      // Process requirements data
      const validRequirements = input.requirements.filter(
        (req) => req && req.requirementTypeId && (req.value !== undefined || req.documentMetadata)
      );

      // Track if any requirements were changed
      let requirementsChanged = false;

      // Process each requirement submission
      for (const req of validRequirements) {
        // Check if a submission already exists for this requirement type
        const existingSubmission = currentProvider.requirementSubmissions.find(
          (sub) => sub.requirementTypeId === req.requirementTypeId
        );

        // Prepare the document metadata
        let documentMetadata = req.documentMetadata || {};
        if (req.value !== undefined && !documentMetadata.value) {
          documentMetadata.value = req.value;
        }

        if (existingSubmission) {
          // Check if the document has changed
          const hasChanged =
            JSON.stringify(documentMetadata) !==
            JSON.stringify(existingSubmission.documentMetadata);

          if (hasChanged) {
            requirementsChanged = true;
            // Update existing submission - only update status if content changed
            await ctx.prisma.requirementSubmission.update({
              where: { id: existingSubmission.id },
              data: {
                documentMetadata,
                // Only reset to pending if the document was actually updated
                status: 'PENDING',
                notes: null,
              },
            });
          }
          // If not changed, we don't update anything - status remains as is
        } else {
          // Create new submission
          requirementsChanged = true;
          await ctx.prisma.requirementSubmission.create({
            data: {
              requirementTypeId: req.requirementTypeId,
              providerId: input.id,
              documentMetadata,
              status: 'PENDING',
            },
          });
        }
      }

      // If any requirements were changed, reset the provider status to PENDING_APPROVAL
      if (requirementsChanged) {
        await ctx.prisma.provider.update({
          where: { id: input.id },
          data: {
            status: 'PENDING_APPROVAL',
            // Clear any previous approval/rejection data
            approvedAt: null,
            approvedById: null,
            rejectedAt: null,
            rejectionReason: null,
          },
        });
      }

      // Get updated provider data with automatic type inference
      const updatedProvider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: {
          services: true,
          user: {
            select: {
              id: true,
              email: true,
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
          requirementSubmissions: {
            include: {
              requirementType: true,
            },
          },
        },
      });

      if (!updatedProvider) {
        throw new Error('Failed to retrieve updated provider data');
      }

      return {
        success: true,
        data: updatedProvider,
        redirect: `/providers/${input.id}`,
      };
    }),

  // ============================================================================
  // ORGANIZATION CONNECTIONS & INVITATIONS
  // ============================================================================

  /**
   * Get provider connections
   * Migrated from: GET /api/providers/connections
   */
  getConnections: protectedProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'SUSPENDED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Find the service provider for the current user
      const provider = await ctx.prisma.provider.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!provider) {
        throw new Error('Service provider profile not found');
      }

      // Build where clause
      const whereClause: any = {
        providerId: provider.id,
      };

      if (input.status) {
        whereClause.status = input.status;
      }

      // Fetch connections
      const connections = await ctx.prisma.organizationProviderConnection.findMany({
        where: whereClause,
        include: {
          organization: true,
          invitation: {
            select: {
              id: true,
              customMessage: true,
              createdAt: true,
              invitedBy: {
                select: { name: true, email: true },
              },
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      return { connections };
    }),

  /**
   * Update provider connection
   * Migrated from: PUT /api/providers/connections/[connectionId]
   */
  updateConnection: protectedProcedure
    .input(
      z
        .object({
          connectionId: z.string(),
        })
        .merge(ConnectionUpdateSchema)
    )
    .mutation(async ({ ctx, input }) => {
      // Find the service provider for the current user
      const provider = await ctx.prisma.provider.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!provider) {
        throw new Error('Service provider profile not found');
      }

      // Find the connection
      const connection = await ctx.prisma.organizationProviderConnection.findFirst({
        where: {
          id: input.connectionId,
          providerId: provider.id,
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
      });

      if (!connection) {
        throw new Error('Connection not found');
      }

      // Validate status transition
      if (connection.status === 'REJECTED') {
        throw new Error('Cannot modify a rejected connection');
      }

      if (input.status === 'SUSPENDED' && connection.status !== 'ACCEPTED') {
        throw new Error('Only active connections can be suspended');
      }

      if (input.status === 'ACCEPTED' && connection.status !== 'SUSPENDED') {
        throw new Error('Only suspended connections can be reactivated');
      }

      // Update connection status
      const updatedConnection = await ctx.prisma.organizationProviderConnection.update({
        where: { id: input.connectionId },
        data: {
          status: input.status,
          ...(input.status === 'ACCEPTED' && { acceptedAt: new Date() }),
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              logo: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      const actionMessage =
        input.status === 'SUSPENDED'
          ? 'Connection suspended successfully'
          : 'Connection reactivated successfully';

      return {
        message: actionMessage,
        connection: {
          id: updatedConnection.id,
          status: updatedConnection.status,
          organizationName: updatedConnection.organization.name,
          acceptedAt: updatedConnection.acceptedAt,
        },
      };
    }),

  /**
   * Delete provider connection
   * Migrated from: DELETE /api/providers/connections/[connectionId]
   */
  deleteConnection: protectedProcedure
    .input(z.object({ connectionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find the service provider for the current user
      const provider = await ctx.prisma.provider.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!provider) {
        throw new Error('Service provider profile not found');
      }

      // Find the connection
      const connection = await ctx.prisma.organizationProviderConnection.findFirst({
        where: {
          id: input.connectionId,
          providerId: provider.id,
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
      });

      if (!connection) {
        throw new Error('Connection not found');
      }

      // Check if there are any active availabilities or bookings
      const activeAvailabilities = await ctx.prisma.availability.count({
        where: {
          connectionId: input.connectionId,
          endTime: { gte: new Date() }, // Future availabilities
        },
      });

      if (activeAvailabilities > 0) {
        throw new Error(
          'Cannot delete connection with active future availabilities. Please remove or transfer them first.'
        );
      }

      // Delete the connection
      await ctx.prisma.organizationProviderConnection.delete({
        where: { id: input.connectionId },
      });

      return {
        message: 'Connection deleted successfully',
        deletedConnection: {
          id: input.connectionId,
          organizationName: connection.organization.name,
        },
      };
    }),

  /**
   * Get provider invitations
   * Migrated from: GET /api/providers/invitations
   */
  getInvitations: protectedProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.email) {
        throw new Error('User email is required to check for invitations');
      }

      // Build where clause
      const whereClause: any = {
        email: ctx.session.user.email,
      };

      if (input.status) {
        whereClause.status = input.status;
      }

      // Fetch invitations for the current user's email
      const invitations = await ctx.prisma.providerInvitation.findMany({
        where: whereClause,
        include: {
          organization: true,
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          connection: {
            select: {
              id: true,
              status: true,
              acceptedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Check for expired invitations and update them
      const expiredInvitations = invitations.filter(
        (invitation) => invitation.status === 'PENDING' && new Date() > invitation.expiresAt
      );

      if (expiredInvitations.length > 0) {
        await ctx.prisma.providerInvitation.updateMany({
          where: {
            id: { in: expiredInvitations.map((inv) => inv.id) },
            status: 'PENDING',
          },
          data: { status: 'EXPIRED' },
        });

        // Update the status in our response
        expiredInvitations.forEach((inv) => {
          inv.status = 'EXPIRED';
        });
      }

      return { invitations };
    }),

  /**
   * Validate invitation token
   * Migrated from: /api/invitations/[token]/validate
   */
  validateInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const { token } = input;

      // Find the invitation by token
      const invitation = await ctx.prisma.providerInvitation.findUnique({
        where: { token },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              logo: true,
              email: true,
              phone: true,
              website: true,
            },
          },
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          connection: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new Error('Invalid invitation token');
      }

      return { invitation };
    }),

  /**
   * Respond to provider invitation
   * Migrated from: POST /api/providers/invitations/[token]/respond
   */
  respondToInvitation: protectedProcedure
    .input(
      z
        .object({
          token: z.string(),
        })
        .merge(InvitationResponseSchema)
    )
    .mutation(async ({ ctx, input }) => {
      // Find the invitation
      const invitation = await ctx.prisma.providerInvitation.findUnique({
        where: { token: input.token },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new Error('Invalid or expired invitation token');
      }

      // Check if invitation has expired
      if (new Date() > invitation.expiresAt) {
        await ctx.prisma.providerInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });

        throw new Error('This invitation has expired');
      }

      // Check if invitation is still pending
      if (invitation.status !== 'PENDING') {
        throw new Error('This invitation has already been responded to');
      }

      // Verify the invitation is for the current user's email
      if (invitation.email !== ctx.session.user.email) {
        throw new Error('This invitation is not for your email address');
      }

      // Find service provider for the current user
      const provider = await ctx.prisma.provider.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!provider) {
        throw new Error(
          'You must complete your service provider registration before accepting invitations'
        );
      }

      if (input.action === 'reject') {
        // Update invitation status to rejected
        const updatedInvitation = await ctx.prisma.providerInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectionReason: input.rejectionReason || null,
          },
        });

        return {
          message: 'Invitation rejected',
          invitation: {
            id: updatedInvitation.id,
            status: updatedInvitation.status,
            rejectedAt: updatedInvitation.rejectedAt,
          },
        };
      }

      if (input.action === 'accept') {
        // Check if connection already exists
        const existingConnection = await ctx.prisma.organizationProviderConnection.findUnique({
          where: {
            organizationId_providerId: {
              organizationId: invitation.organizationId,
              providerId: provider.id,
            },
          },
        });

        if (existingConnection) {
          throw new Error('You are already connected to this organization');
        }

        // Start transaction to create connection and update invitation
        const result = await ctx.prisma.$transaction(async (tx) => {
          // Create the organization-provider connection
          const connection = await tx.organizationProviderConnection.create({
            data: {
              organizationId: invitation.organizationId,
              providerId: provider.id,
              status: 'ACCEPTED',
              acceptedAt: new Date(),
            },
            include: {
              organization: {
                select: { name: true },
              },
            },
          });

          // Update invitation status and link to connection
          const updatedInvitation = await tx.providerInvitation.update({
            where: { id: invitation.id },
            data: {
              status: 'ACCEPTED',
              acceptedAt: new Date(),
              connectionId: connection.id,
            },
          });

          return { connection, invitation: updatedInvitation };
        });

        return {
          message: 'Invitation accepted successfully',
          connection: {
            id: result.connection.id,
            organizationName: result.connection.organization.name,
            status: result.connection.status,
            acceptedAt: result.connection.acceptedAt,
          },
          invitation: {
            id: result.invitation.id,
            status: result.invitation.status,
            acceptedAt: result.invitation.acceptedAt,
          },
        };
      }

      throw new Error('Invalid action');
    }),

  // ============================================================================
  // REQUIREMENTS VALIDATION & CHECKING
  // ============================================================================

  /**
   * Get provider requirements approval status
   * Moved from server action to tRPC procedure for Option C compliance
   * This performs the database query that was previously in the server action
   */
  getProviderRequirementsStatus: publicProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get the provider with all their assigned types and requirements
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.providerId },
        include: {
          typeAssignments: {
            include: {
              providerType: {
                include: {
                  requirements: {
                    where: { isRequired: true },
                  },
                },
              },
            },
          },
          requirementSubmissions: {
            where: {
              requirementType: {
                isRequired: true,
              },
            },
            include: {
              requirementType: true,
            },
          },
        },
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      // Return the raw data - business logic will be handled by the server action
      return {
        typeAssignments: provider.typeAssignments,
        requirementSubmissions: provider.requirementSubmissions,
      };
    }),

  // ============================================================================
  // ONBOARDING & SETUP
  // ============================================================================

  /**
   * Get consolidated onboarding data
   * Migrated from: GET /api/providers/onboarding
   */
  getOnboardingData: publicProcedure.query(async ({ ctx }) => {
    // Fetch all provider types
    const providerTypes = await ctx.prisma.providerType.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Fetch all requirements grouped by provider type
    const requirementsData = await ctx.prisma.providerType.findMany({
      select: {
        id: true,
        requirements: {
          select: {
            id: true,
            name: true,
            description: true,
            validationType: true,
            isRequired: true,
            validationConfig: true,
            displayPriority: true,
          },
          orderBy: [{ displayPriority: 'asc' }, { name: 'asc' }],
        },
      },
    });

    // Fetch all services grouped by provider type
    const servicesData = await ctx.prisma.service.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        defaultDuration: true,
        defaultPrice: true,
        displayPriority: true,
        providerTypeId: true,
      },
      orderBy: [{ displayPriority: 'asc' }, { name: 'asc' }],
    });

    // Organize requirements by provider type ID
    const requirementsByProviderType: Record<string, any[]> = {};
    requirementsData.forEach((providerType) => {
      requirementsByProviderType[providerType.id] = providerType.requirements;
    });

    // Organize services by provider type ID
    const servicesByProviderType: Record<string, any[]> = {};
    servicesData.forEach((service) => {
      if (!servicesByProviderType[service.providerTypeId]) {
        servicesByProviderType[service.providerTypeId] = [];
      }
      servicesByProviderType[service.providerTypeId].push({
        id: service.id,
        name: service.name,
        description: service.description,
        defaultDuration: service.defaultDuration,
        defaultPrice: service.defaultPrice.toString(), // Convert Decimal to string
        displayPriority: service.displayPriority,
      });
    });

    return {
      providerTypes,
      requirements: requirementsByProviderType,
      services: servicesByProviderType,
    };
  }),
});
