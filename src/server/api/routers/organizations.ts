import { OrganizationBillingModel, OrganizationRole } from '@prisma/client';
import { z } from 'zod';

import { logEmail } from '@/features/communications/lib/helper';
import {
  generateInvitationEmail,
  generateInvitationToken,
  getInvitationExpiryDate,
} from '@/features/invitations/lib/utils';
import {
  registerOrganization,
  validateInvitationAcceptance,
  validateInvitationCancellation,
  validateInvitationRejection,
  validateMemberInvitation,
  validateMemberRemoval,
  validateMemberRoleChange,
} from '@/features/organizations/lib/actions';
import { organizationRegistrationSchema } from '@/features/organizations/types/schemas';
import { getCurrentUser } from '@/lib/auth';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';

export const organizationsRouter = createTRPCRouter({
  /*
   * ====================================
   * ORGANIZATION CRUD OPERATIONS
   * ====================================
   * Core CRUD operations for organization management
   */

  /**
   * Get organization by ID
   * Migrated from: GET /api/organizations/[id]
   */
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    // First check if the organization exists
    const organization = await ctx.prisma.organization.findUnique({
      where: { id: input.id },
      include: {
        locations: true,
        memberships: {
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
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if the current user is a member of this organization or is an admin
    const userMembership = organization.memberships.find(
      (membership) => membership.userId === ctx.session.user.id
    );

    const isSystemAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(ctx.session.user.role || '');

    if (!userMembership && !isSystemAdmin) {
      throw new Error('You do not have permission to access this organization');
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

      // Call server action for business logic and validation only
      const result = await registerOrganization(input);

      if (!result.success) {
        throw new Error(result.error || 'Failed to register organization');
      }

      // Type guard ensures we have the success case
      const { userId, validatedData } = result;

      // Single database query in tRPC procedure for automatic type inference
      const organization = await ctx.prisma.$transaction(async (tx) => {
        // Create the organization
        const org = await tx.organization.create({
          data: {
            name: validatedData.organization.name,
            description: validatedData.organization.description || '',
            email: validatedData.organization.email || '',
            phone: validatedData.organization.phone || '',
            website: validatedData.organization.website || '',
            logo: validatedData.organization.logo || '',
            billingModel: validatedData.organization.billingModel as OrganizationBillingModel,
            // Connect the current user as an admin via memberships
            memberships: {
              create: {
                userId,
                role: 'ADMIN',
                permissions: [
                  'MANAGE_PROVIDERS',
                  'MANAGE_BOOKINGS',
                  'MANAGE_LOCATIONS',
                  'MANAGE_STAFF',
                  'VIEW_ANALYTICS',
                  'MANAGE_BILLING',
                ],
                status: 'ACTIVE',
              },
            },
          },
        });

        // Create locations if provided
        if (validatedData.locations && validatedData.locations.length > 0) {
          for (const location of validatedData.locations) {
            await tx.location.create({
              data: {
                name: location.name,
                googlePlaceId: location.googlePlaceId || `temp-${Date.now()}`,
                formattedAddress: location.formattedAddress || '',
                coordinates: {
                  lat: location.coordinates.lat,
                  lng: location.coordinates.lng,
                },
                searchTerms: location.searchTerms || [],
                phone: location.phone || '',
                email: location.email || '',
                organizationId: org.id,
              },
            });
          }
        }

        return org;
      });

      // Query for complete organization with relations for type inference
      const createdOrganization = await ctx.prisma.organization.findUnique({
        where: { id: organization.id },
        include: {
          locations: true,
          memberships: {
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
        },
      });

      if (!createdOrganization) {
        throw new Error('Failed to retrieve created organization');
      }

      return createdOrganization;
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
        email: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
        phone: z.string().optional(),
        website: z.union([z.string().url('Invalid website URL'), z.literal('')]).optional(),
        billingModel: z.enum(['CONSOLIDATED', 'PER_LOCATION']).optional(),
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

  /*
   * ====================================
   * ORGANIZATION QUERY OPERATIONS
   * ====================================
   * Various ways to query and filter organization data
   */

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

  /*
   * ====================================
   * LOCATION MANAGEMENT
   * ====================================
   * Endpoints for managing organization locations
   */

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
   * Update organization locations
   * Replaces all locations for an organization
   */
  updateLocations: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        locations: z.array(
          z.object({
            id: z.string().optional(),
            organizationId: z.string(),
            name: z.string().min(1, 'Location name is required'),
            formattedAddress: z.string().min(1, 'Address is required'),
            phone: z.string().optional().or(z.literal('')),
            email: z.string().email('Invalid email format').optional().or(z.literal('')),
            googlePlaceId: z.string().optional().or(z.literal('')),
            coordinates: z.any().optional(),
            searchTerms: z.array(z.string()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, locations } = input;

      // Check if user is an admin of the organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Admin access required');
      }

      // Use transaction to update locations
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Delete existing locations
        await tx.location.deleteMany({
          where: { organizationId },
        });

        // Create new locations
        const createdLocations = await Promise.all(
          locations.map((location) =>
            tx.location.create({
              data: {
                organizationId,
                name: location.name,
                formattedAddress: location.formattedAddress,
                phone: location.phone || '',
                email: location.email || '',
                googlePlaceId: location.googlePlaceId || '',
                coordinates: location.coordinates,
                searchTerms: location.searchTerms || [],
              },
            })
          )
        );

        return createdLocations;
      });

      return { locations: result };
    }),

  /*
   * ====================================
   * PROVIDER CONNECTION MANAGEMENT
   * ====================================
   * Endpoints for managing provider-organization relationships
   */

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
            },
          },
          invitation: {
            include: {
              invitedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Transform the response to match the TypeScript interface
      return connections.map((connection) => ({
        ...connection,
        provider: {
          ...connection.provider,
          serviceProviderType: connection.provider.typeAssignments[0]?.providerType || null,
        },
      }));
    }),

  /**
   * Update provider connection
   * Migrated from: PUT /api/organizations/[id]/provider-connections/[connectionId]
   */
  updateProviderConnection: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        connectionId: z.string(),
        status: z.enum(['ACCEPTED', 'SUSPENDED']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getCurrentUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

      // Verify user has admin access to this organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: user.id,
          role: {
            in: ['OWNER', 'ADMIN'],
          },
        },
      });

      if (!membership) {
        throw new Error('Unauthorized');
      }

      // Verify connection belongs to this organization
      const existingConnection = await ctx.prisma.organizationProviderConnection.findFirst({
        where: {
          id: input.connectionId,
          organizationId: input.organizationId,
        },
      });

      if (!existingConnection) {
        throw new Error('Connection not found');
      }

      // Update the connection
      const updatedConnection = await ctx.prisma.organizationProviderConnection.update({
        where: {
          id: input.connectionId,
        },
        data: {
          status: input.status,
          ...(input.status === 'SUSPENDED' && { suspendedAt: new Date() }),
          ...(input.status === 'ACCEPTED' && { suspendedAt: null }),
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
          },
        },
      });

      return { connection: updatedConnection };
    }),

  /**
   * Delete provider connection
   * Migrated from: DELETE /api/organizations/[id]/provider-connections/[connectionId]
   */
  deleteProviderConnection: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        connectionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getCurrentUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

      // Verify user has admin access to this organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: user.id,
          role: {
            in: ['OWNER', 'ADMIN'],
          },
        },
      });

      if (!membership) {
        throw new Error('Unauthorized');
      }

      // Verify connection belongs to this organization
      const existingConnection = await ctx.prisma.organizationProviderConnection.findFirst({
        where: {
          id: input.connectionId,
          organizationId: input.organizationId,
        },
      });

      if (!existingConnection) {
        throw new Error('Connection not found');
      }

      // Check if provider has any active availability with this organization
      const activeAvailabilities = await ctx.prisma.availability.findMany({
        where: {
          providerId: existingConnection.providerId,
          organizationId: input.organizationId,
          endTime: {
            gte: new Date(),
          },
        },
      });

      if (activeAvailabilities.length > 0) {
        throw new Error(
          'Cannot delete connection with active future availability. Please delete all future availability first.'
        );
      }

      // Delete the connection
      await ctx.prisma.organizationProviderConnection.delete({
        where: {
          id: input.connectionId,
        },
      });

      return { message: 'Connection deleted successfully' };
    }),

  /*
   * ====================================
   * PROVIDER INVITATION MANAGEMENT
   * ====================================
   * Endpoints for managing provider invitations to organizations
   */

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

  /**
   * Cancel provider invitation
   * Migrated from: DELETE /api/organizations/[id]/provider-invitations/[invitationId]
   */
  cancelProviderInvitation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error('Unauthorized');
      }

      // Check if user has permission to cancel invitations
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: currentUser.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Only organization owners and admins can cancel invitations');
      }

      // Find the invitation
      const invitation = await ctx.prisma.providerInvitation.findFirst({
        where: {
          id: input.invitationId,
          organizationId: input.organizationId,
        },
        include: {
          organization: { select: { name: true } },
          invitedBy: { select: { name: true } },
        },
      });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Check if invitation can be cancelled
      if (invitation.status !== 'PENDING') {
        throw new Error('Only pending invitations can be cancelled');
      }

      // Update invitation status
      const updatedInvitation = await ctx.prisma.providerInvitation.update({
        where: { id: input.invitationId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      // Log cancellation email
      const cancelEmailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invitation Cancelled</h2>
          <p>Hi there,</p>
          <p>The invitation to join ${invitation.organization.name} on MedBookings has been cancelled.</p>
          <p>If you have any questions, please contact ${invitation.organization.name} directly.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This email was sent by MedBookings on behalf of ${invitation.organization.name}.
          </p>
        </div>
      `;

      logEmail({
        to: invitation.email,
        subject: `Invitation to ${invitation.organization.name} has been cancelled`,
        htmlContent: cancelEmailContent,
        type: 'cancellation',
      });

      return {
        message: 'Invitation cancelled successfully',
        invitation: {
          id: updatedInvitation.id,
          status: updatedInvitation.status,
          cancelledAt: updatedInvitation.cancelledAt,
        },
      };
    }),

  /**
   * Resend provider invitation
   * Migrated from: POST /api/organizations/[id]/provider-invitations/[invitationId]/resend
   */
  resendProviderInvitation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error('Unauthorized');
      }

      // Check if user has permission to resend invitations
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: currentUser.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Only organization owners and admins can resend invitations');
      }

      // Find the invitation
      const invitation = await ctx.prisma.providerInvitation.findFirst({
        where: {
          id: input.invitationId,
          organizationId: input.organizationId,
        },
        include: {
          organization: { select: { name: true } },
          invitedBy: { select: { name: true } },
        },
      });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Check if invitation can be resent
      if (invitation.status !== 'PENDING') {
        throw new Error('Only pending invitations can be resent');
      }

      // Check rate limiting (no more than 1 resend per hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (invitation.lastEmailSentAt && invitation.lastEmailSentAt > oneHourAgo) {
        throw new Error('Invitation can only be resent once per hour');
      }

      // Generate new token and extend expiry
      const newToken = generateInvitationToken();
      const newExpiresAt = getInvitationExpiryDate();

      // Check if user exists to determine email type
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: invitation.email },
        select: { id: true },
      });

      // Update invitation with new token and reset expiry
      const updatedInvitation = await ctx.prisma.providerInvitation.update({
        where: { id: input.invitationId },
        data: {
          token: newToken,
          expiresAt: newExpiresAt,
          emailAttempts: { increment: 1 },
          lastEmailSentAt: new Date(),
          emailDeliveryStatus: 'PENDING',
        },
      });

      // Generate and log email
      const emailContent = generateInvitationEmail({
        organizationName: invitation.organization.name,
        inviterName: currentUser.name || 'Someone',
        customMessage: invitation.customMessage || undefined,
        invitationToken: newToken,
        isExistingUser: !!existingUser,
      });

      logEmail({
        to: invitation.email,
        subject: `[REMINDER] ${emailContent.subject}`,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent,
        type: 'reminder',
      });

      // Update email delivery status to "DELIVERED" for console logging
      await ctx.prisma.providerInvitation.update({
        where: { id: input.invitationId },
        data: { emailDeliveryStatus: 'DELIVERED' },
      });

      return {
        message: 'Invitation resent successfully',
        invitation: {
          id: updatedInvitation.id,
          emailAttempts: updatedInvitation.emailAttempts,
          lastEmailSentAt: updatedInvitation.lastEmailSentAt,
          expiresAt: updatedInvitation.expiresAt,
        },
      };
    }),

  /*
   * ====================================
   * MEMBER MANAGEMENT
   * ====================================
   * Endpoints for managing organization memberships and invitations
   */

  /**
   * Get organization members
   */
  getMembers: protectedProcedure
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

      const members = await ctx.prisma.organizationMembership.findMany({
        where: {
          organizationId: input.organizationId,
          status: 'ACTIVE',
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return members;
    }),

  /**
   * Get organization member invitations
   */
  getMemberInvitations: protectedProcedure
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

      const invitations = await ctx.prisma.organizationInvitation.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          invitedBy: {
            select: {
              id: true,
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
   * Invite a member to join the organization
   */
  inviteMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
        role: z.nativeEnum(OrganizationRole),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is an admin of the organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Admin access required');
      }

      // Call business logic validation
      const validation = await validateMemberInvitation(input);

      if (!validation.success) {
        throw new Error(validation.message);
      }

      // Check if organization exists and user isn't already a member
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.organizationId },
        include: {
          memberships: {
            include: { user: true },
          },
        },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      // Check if user is already a member
      const existingMembership = organization.memberships.find(
        (membership) => membership.user.email?.toLowerCase() === input.email.toLowerCase()
      );

      if (existingMembership) {
        throw new Error('User is already a member of this organization');
      }

      // Check for existing pending invitation
      const existingInvitation = await ctx.prisma.organizationInvitation.findFirst({
        where: {
          organizationId: input.organizationId,
          email: input.email.toLowerCase(),
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        throw new Error('Invitation already sent to this email address');
      }

      // Create invitation using business logic data
      const invitation = await ctx.prisma.organizationInvitation.create({
        data: {
          organizationId: input.organizationId,
          email: input.email.toLowerCase(),
          role: input.role,
          token: validation.invitationToken!,
          expiresAt: validation.expiresAt!,
          invitedById: validation.data.currentUserId,
          status: 'PENDING',
        },
        include: {
          organization: true,
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return invitation;
    }),

  /**
   * Accept an organization invitation
   */
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Call business logic validation
      const validation = await validateInvitationAcceptance(input.token);

      if (!validation.success) {
        throw new Error(validation.message);
      }

      // Find invitation
      const invitation = await ctx.prisma.organizationInvitation.findUnique({
        where: { token: input.token },
        include: {
          organization: true,
          invitedBy: true,
        },
      });

      if (!invitation) {
        throw new Error('Invalid invitation token');
      }

      if (invitation.status !== 'PENDING') {
        throw new Error(`Invitation has already been ${invitation.status.toLowerCase()}`);
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      if (invitation.email.toLowerCase() !== validation.data.currentUserEmail.toLowerCase()) {
        throw new Error('This invitation is not for your email address');
      }

      // Check if user is already a member
      const existingMembership = await ctx.prisma.organizationMembership.findUnique({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: validation.data.currentUserId,
          },
        },
      });

      if (existingMembership) {
        throw new Error('You are already a member of this organization');
      }

      // Create membership and update invitation in transaction
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Create membership
        const membership = await tx.organizationMembership.create({
          data: {
            userId: validation.data.currentUserId,
            organizationId: invitation.organizationId,
            role: invitation.role,
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Update invitation status
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        });

        return membership;
      });

      return result;
    }),

  /**
   * Reject an organization invitation
   */
  rejectInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Call business logic validation
      const validation = await validateInvitationRejection(input.token);

      if (!validation.success) {
        throw new Error(validation.message);
      }

      // Find invitation
      const invitation = await ctx.prisma.organizationInvitation.findUnique({
        where: { token: input.token },
        include: { organization: true },
      });

      if (!invitation) {
        throw new Error('Invalid invitation token');
      }

      if (invitation.status !== 'PENDING') {
        throw new Error(`Invitation has already been ${invitation.status.toLowerCase()}`);
      }

      // Update invitation status
      const updatedInvitation = await ctx.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'DECLINED',
        },
      });

      return {
        message: `Invitation to ${invitation.organization.name} declined`,
        invitation: {
          id: updatedInvitation.id,
          status: updatedInvitation.status,
        },
      };
    }),

  /**
   * Change a member's role in the organization
   */
  changeMemberRole: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        memberId: z.string(),
        newRole: z.nativeEnum(OrganizationRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is an admin of the organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Admin access required');
      }

      // Call business logic validation
      const validation = await validateMemberRoleChange(
        input.organizationId,
        input.memberId,
        input.newRole
      );

      if (!validation.success) {
        throw new Error(validation.message);
      }

      // Get the membership to be modified
      const targetMembership = await ctx.prisma.organizationMembership.findUnique({
        where: { id: input.memberId },
        include: { user: true },
      });

      if (!targetMembership || targetMembership.organizationId !== input.organizationId) {
        throw new Error('Member not found');
      }

      // Cannot change own role
      if (targetMembership.userId === validation.data.currentUserId) {
        throw new Error('Cannot change your own role');
      }

      // Update role
      const updatedMembership = await ctx.prisma.organizationMembership.update({
        where: { id: input.memberId },
        data: { role: input.newRole },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedMembership;
    }),

  /**
   * Remove a member from the organization
   */
  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        memberId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is an admin of the organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Admin access required');
      }

      // Call business logic validation
      const validation = await validateMemberRemoval(input.organizationId, input.memberId);

      if (!validation.success) {
        throw new Error(validation.message);
      }

      // Get the membership to be removed
      const targetMembership = await ctx.prisma.organizationMembership.findUnique({
        where: { id: input.memberId },
        include: { user: true },
      });

      if (!targetMembership || targetMembership.organizationId !== input.organizationId) {
        throw new Error('Member not found');
      }

      // Cannot remove yourself
      if (targetMembership.userId === validation.data.currentUserId) {
        throw new Error('Cannot remove yourself from the organization');
      }

      // Cannot remove the last owner
      if (targetMembership.role === 'OWNER') {
        const ownerCount = await ctx.prisma.organizationMembership.count({
          where: {
            organizationId: input.organizationId,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        });

        if (ownerCount <= 1) {
          throw new Error('Cannot remove the last owner. Transfer ownership first.');
        }
      }

      // Remove member
      await ctx.prisma.organizationMembership.delete({
        where: { id: input.memberId },
      });

      return {
        message: `${targetMembership.user.email} removed from organization`,
        removedMember: {
          id: targetMembership.id,
          userId: targetMembership.userId,
          email: targetMembership.user.email,
        },
      };
    }),

  /**
   * Cancel a pending member invitation
   */
  cancelMemberInvitation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is an admin of the organization
      const membership = await ctx.prisma.organizationMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new Error('Forbidden: Admin access required');
      }

      // Call business logic validation
      const validation = await validateInvitationCancellation(
        input.organizationId,
        input.invitationId
      );

      if (!validation.success) {
        throw new Error(validation.message);
      }

      // Find the invitation
      const invitation = await ctx.prisma.organizationInvitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation || invitation.organizationId !== input.organizationId) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'PENDING') {
        throw new Error('Can only cancel pending invitations');
      }

      // Cancel invitation
      const updatedInvitation = await ctx.prisma.organizationInvitation.update({
        where: { id: input.invitationId },
        data: {
          status: 'CANCELLED',
        },
      });

      return {
        message: `Invitation to ${invitation.email} cancelled`,
        invitation: {
          id: updatedInvitation.id,
          status: updatedInvitation.status,
        },
      };
    }),
});
