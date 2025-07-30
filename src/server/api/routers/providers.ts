import { z } from 'zod';

import { deleteProvider } from '@/features/providers/lib/actions/delete-provider';
import { registerProvider } from '@/features/providers/lib/actions/register-provider';
import {
  updateProviderBasicInfo,
  updateProviderRequirements,
  updateProviderServices,
} from '@/features/providers/lib/actions/update-provider';
import { serializeProvider, serializeServiceProvider } from '@/features/providers/lib/helper';
import { searchProviders } from '@/features/providers/lib/search';
import {
  ConnectionUpdateSchema,
  InvitationResponseSchema,
  basicInfoSchema,
  providerSearchParamsSchema,
  regulatoryRequirementsSchema,
  servicesSchema,
} from '@/features/providers/types/schemas';
import { getCurrentUser } from '@/lib/auth';
import { isInvitationExpired } from '@/lib/invitation-utils';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';

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
      providerSearchParamsSchema.extend({
        typeIds: z.array(z.string()).optional(),
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

      // Create a proper object structure that matches what registerProvider expects
      const providerData = {
        userId: ctx.session.user.id,
        name: input.basicInfo.name,
        bio: input.basicInfo.bio || '',
        email: input.basicInfo.email,
        whatsapp: input.basicInfo.whatsapp || '',
        website: input.basicInfo.website,
        imageUrl: input.basicInfo.image,
        languages: input.basicInfo.languages || [],
        providerTypeIds: input.providerTypeIds,
        services: input.services?.availableServices || [],
        serviceConfigs: input.services?.serviceConfigs || {},
        requirements: input.regulatoryRequirements?.requirements || [],
      };

      // Convert to FormData as the server action expects it
      const formData = new FormData();

      // Add basic fields
      formData.append('userId', providerData.userId);
      formData.append('name', providerData.name);
      formData.append('bio', providerData.bio);
      formData.append('email', providerData.email);
      formData.append('whatsapp', providerData.whatsapp);

      if (providerData.website) {
        formData.append('website', providerData.website);
      }
      if (providerData.imageUrl) {
        formData.append('imageUrl', providerData.imageUrl);
      }

      // Add arrays
      providerData.providerTypeIds.forEach((typeId) => {
        formData.append('providerTypeIds', typeId);
      });

      providerData.languages.forEach((lang) => {
        formData.append('languages', lang);
      });

      providerData.services.forEach((serviceId) => {
        formData.append('services', serviceId);

        const config = providerData.serviceConfigs[serviceId];
        if (config?.duration) {
          formData.append(`serviceConfigs[${serviceId}][duration]`, config.duration.toString());
        }
        if (config?.price) {
          formData.append(`serviceConfigs[${serviceId}][price]`, config.price.toString());
        }
      });

      providerData.requirements.forEach((req, index) => {
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
      basicInfoSchema.partial().extend({
        id: z.string(),
        providerTypeIds: z.array(z.string()).optional(),
        providerTypeId: z.string().optional(),
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
      if (input.image) formData.append('image', input.image);
      if (input.showPrice !== undefined) formData.append('showPrice', input.showPrice.toString());
      input.languages?.forEach((lang) => formData.append('languages', lang));
      input.providerTypeIds?.forEach((typeId) => formData.append('providerTypeIds', typeId));
      if (input.providerTypeId) formData.append('providerTypeId', input.providerTypeId);

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
      z
        .object({
          id: z.string(),
        })
        .merge(servicesSchema.omit({ loadedServices: true }).partial())
    )
    .mutation(async ({ ctx, input }) => {
      const formData = new FormData();
      formData.append('id', input.id);

      // Safety check: only proceed if availableServices is provided and not empty
      if (!input.availableServices || input.availableServices.length === 0) {
        throw new Error('No services provided. At least one service must be selected.');
      }

      input.availableServices.forEach((serviceId) => {
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

      const formData = new FormData();
      formData.append('id', input.id);
      formData.append('userId', ctx.session.user.id);

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
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
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
              email: true,
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

      // Serialize the provider data to handle Decimal values and dates
      return serializeServiceProvider(provider);
    }),

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
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error('Unauthorized');
      }

      // Find the service provider for the current user
      const provider = await ctx.prisma.provider.findUnique({
        where: { userId: currentUser.id },
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
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error('Unauthorized');
      }

      // Find the service provider for the current user
      const provider = await ctx.prisma.provider.findUnique({
        where: { userId: currentUser.id },
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
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error('Unauthorized');
      }

      // Find the service provider for the current user
      const provider = await ctx.prisma.provider.findUnique({
        where: { userId: currentUser.id },
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
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error('Unauthorized');
      }

      if (!currentUser.email) {
        throw new Error('User email is required to check for invitations');
      }

      // Build where clause
      const whereClause: any = {
        email: currentUser.email,
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
        (invitation) => invitation.status === 'PENDING' && isInvitationExpired(invitation.expiresAt)
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
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error('Unauthorized');
      }

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
      if (isInvitationExpired(invitation.expiresAt)) {
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
      if (invitation.email !== currentUser.email) {
        throw new Error('This invitation is not for your email address');
      }

      // Find service provider for the current user
      const provider = await ctx.prisma.provider.findUnique({
        where: { userId: currentUser.id },
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
});
