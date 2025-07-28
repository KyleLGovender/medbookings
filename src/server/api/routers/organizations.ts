import { z } from 'zod';

import { registerOrganization } from '@/features/organizations/lib/actions';
import { organizationRegistrationSchema } from '@/features/organizations/types/schemas';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';

export const organizationsRouter = createTRPCRouter({
  /**
   * Get organization by ID
   * Migrated from: GET /api/organizations/[id]
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const organization = await ctx.prisma.organization.findUnique({
      where: { id: input.id },
      include: {
        locations: true,
        memberships: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return organization;
  }),

  /**
   * Create a new organization
   * Migrated from: POST /api/organizations
   */
  create: protectedProcedure
    .input(organizationRegistrationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error('User not authenticated');
      }

      const organization = await registerOrganization(input);
      return organization;
    }),

  /**
   * Update organization
   * Migrated from: PATCH /api/organizations/[id]
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().url().optional(),
        billingModel: z.enum(['SLOT_BASED', 'PROVIDER_BASED']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check if user is an admin of the organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: id,
          userId: ctx.session.user.id,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Admin access required');
      }

      const updatedOrganization = await ctx.prisma.organization.update({
        where: { id },
        data: data as any,
        include: {
          locations: true,
          memberships: true,
        },
      });

      return updatedOrganization;
    }),

  /**
   * Delete organization
   * Migrated from: DELETE /api/organizations/[id]
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is an admin of the organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.id,
          userId: ctx.session.user.id,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Admin access required');
      }

      await ctx.prisma.organization.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get user's organizations
   * Migrated from: GET /api/organizations/user/[userId]
   */
  getByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify the requesting user is either the target user or an admin
      if (ctx.session.user.id !== input.userId && ctx.session.user.role !== 'ADMIN') {
        throw new Error('Forbidden');
      }

      const organizations = await ctx.prisma.organization.findMany({
        where: {
          memberships: {
            some: {
              userId: input.userId,
              status: 'ACTIVE',
            },
          },
        },
        include: {
          locations: true,
          memberships: {
            where: {
              userId: input.userId,
            },
          },
        },
      });

      return organizations;
    }),

  /**
   * Get organization locations
   * Migrated from: GET /api/organizations/[id]/locations
   */
  getLocations: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const locations = await ctx.prisma.location.findMany({
        where: {
          organizationId: input.organizationId,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return locations;
    }),

  /**
   * Create organization location
   * Migrated from: POST /api/organizations/[id]/locations
   */
  createLocation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        country: z.string(),
        postalCode: z.string(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        placeId: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, ...locationData } = input;

      // Check if user is an admin of the organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId,
          userId: ctx.session.user.id,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Admin access required');
      }

      const location = await ctx.prisma.location.create({
        data: {
          ...locationData,
          organizationId,
        } as any,
      });

      return location;
    }),

  /**
   * Get organization provider connections
   * Migrated from: GET /api/organizations/[id]/provider-connections
   */
  getProviderConnections: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden');
      }

      const connections = await ctx.prisma.organizationProviderConnection.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          provider: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return connections;
    }),

  /**
   * Get organization provider invitations
   * Migrated from: GET /api/organizations/[id]/provider-invitations
   */
  getProviderInvitations: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden');
      }

      const invitations = await ctx.prisma.providerInvitation.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return invitations;
    }),

  /**
   * Create provider invitation
   * Migrated from: POST /api/organizations/[id]/provider-invitations
   */
  createProviderInvitation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
        customMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, email, customMessage } = input;

      // Check if user is an admin of the organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId,
          userId: ctx.session.user.id,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Admin access required');
      }

      // Check if invitation already exists
      const existingInvitation = await ctx.prisma.providerInvitation.findFirst({
        where: {
          organizationId,
          email,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        throw new Error('An invitation for this email already exists');
      }

      // Create invitation
      const invitation = await ctx.prisma.providerInvitation.create({
        data: {
          organizationId,
          email,
          customMessage,
          invitedById: ctx.session.user.id,
          token: crypto.randomUUID(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        include: {
          organization: true,
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // TODO: Send invitation email

      return invitation;
    }),
});
