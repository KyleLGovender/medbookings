import { OrganizationStatus, ProviderStatus } from '@prisma/client';
import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '@/server/trpc';

export const adminRouter = createTRPCRouter({
  /**
   * Get all providers (admin)
   * Migrated from: GET /api/admin/providers
   */
  getProviders: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(ProviderStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const providers = await ctx.prisma.provider.findMany({
        where: input.status ? { status: input.status } : {},
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          typeAssignments: {
            include: {
              providerType: {
                select: { name: true },
              },
            },
          },
          requirementSubmissions: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return providers;
    }),

  /**
   * Get provider by ID (admin)
   * Migrated from: GET /api/admin/providers/[id]
   */
  getProviderById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          typeAssignments: {
            include: {
              providerType: true,
            },
          },
          requirementSubmissions: {
            include: {
              requirementType: true,
            },
          },
          services: true,
          availabilityConfigs: {
            include: {
              service: true,
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
   * Approve provider
   * Migrated from: POST /api/admin/providers/[id]/approve
   */
  approveProvider: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if all required requirements are approved
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        include: {
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

      // Check if all required requirements are approved
      const requiredSubmissions = provider.requirementSubmissions.filter(
        (submission) => submission.requirementType.isRequired
      );

      const unapprovedRequired = requiredSubmissions.filter(
        (submission) => submission.status !== 'APPROVED'
      );

      if (unapprovedRequired.length > 0) {
        throw new Error(
          `Cannot approve provider: not all required requirements are approved. Unapproved: ${unapprovedRequired
            .map((sub) => sub.requirementType.name)
            .join(', ')}`
        );
      }

      // Approve the provider
      const updatedProvider = await ctx.prisma.provider.update({
        where: { id: input.id },
        data: {
          status: 'APPROVED',
          approvedById: ctx.session.user.id,
          approvedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      // Log admin action
      console.log('ADMIN_ACTION: Provider approved', {
        providerId: provider.id,
        providerName: provider.name,
        providerEmail: provider.email,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        timestamp: new Date().toISOString(),
        action: 'PROVIDER_APPROVED',
      });

      return updatedProvider;
    }),

  /**
   * Reject provider
   * Migrated from: POST /api/admin/providers/[id]/reject
   */
  rejectProvider: adminProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      // Reject the provider
      const updatedProvider = await ctx.prisma.provider.update({
        where: { id: input.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: input.reason,
          approvedAt: null,
          approvedById: null,
        },
      });

      // Log admin action
      console.log('ADMIN_ACTION: Provider rejected', {
        providerId: provider.id,
        providerName: provider.name,
        providerEmail: provider.email,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        reason: input.reason,
        timestamp: new Date().toISOString(),
        action: 'PROVIDER_REJECTED',
      });

      return updatedProvider;
    }),

  /**
   * Approve provider requirement
   * Migrated from: POST /api/admin/providers/[id]/requirements/[requirementId]/approve
   */
  approveRequirement: adminProcedure
    .input(
      z.object({
        providerId: z.string(),
        requirementId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.prisma.requirementSubmission.findFirst({
        where: {
          id: input.requirementId,
          providerId: input.providerId,
        },
        include: {
          requirementType: true,
          provider: true,
        },
      });

      if (!submission) {
        throw new Error('Requirement submission not found');
      }

      // Approve the requirement
      const updatedSubmission = await ctx.prisma.requirementSubmission.update({
        where: { id: input.requirementId },
        data: {
          status: 'APPROVED',
          validatedAt: new Date(),
          validatedById: ctx.session.user.id,
        },
      });

      // Log admin action
      console.log('ADMIN_ACTION: Requirement approved', {
        requirementId: submission.id,
        requirementName: submission.requirementType.name,
        providerId: submission.provider.id,
        providerName: submission.provider.name,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        timestamp: new Date().toISOString(),
        action: 'REQUIREMENT_APPROVED',
      });

      return updatedSubmission;
    }),

  /**
   * Reject provider requirement
   * Migrated from: POST /api/admin/providers/[id]/requirements/[requirementId]/reject
   */
  rejectRequirement: adminProcedure
    .input(
      z.object({
        providerId: z.string(),
        requirementId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.prisma.requirementSubmission.findFirst({
        where: {
          id: input.requirementId,
          providerId: input.providerId,
        },
        include: {
          requirementType: true,
          provider: true,
        },
      });

      if (!submission) {
        throw new Error('Requirement submission not found');
      }

      // Reject the requirement
      const updatedSubmission = await ctx.prisma.requirementSubmission.update({
        where: { id: input.requirementId },
        data: {
          status: 'REJECTED',
          notes: input.reason,
        },
      });

      // Log admin action
      console.log('ADMIN_ACTION: Requirement rejected', {
        requirementId: submission.id,
        requirementName: submission.requirementType.name,
        providerId: submission.provider.id,
        providerName: submission.provider.name,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        reason: input.reason,
        timestamp: new Date().toISOString(),
        action: 'REQUIREMENT_REJECTED',
      });

      return updatedSubmission;
    }),

  /**
   * Get all organizations (admin)
   * Migrated from: GET /api/admin/organizations
   */
  getOrganizations: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(OrganizationStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizations = await ctx.prisma.organization.findMany({
        where: input.status ? { status: input.status } : {},
        include: {
          memberships: {
            where: { role: 'OWNER' },
            include: {
              user: {
                select: { id: true, email: true, name: true },
              },
            },
          },
          locations: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return organizations;
    }),

  /**
   * Get organization by ID (admin)
   * Migrated from: GET /api/admin/organizations/[id]
   */
  getOrganizationById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.id },
        include: {
          memberships: {
            include: {
              user: {
                select: { id: true, email: true, name: true },
              },
            },
          },
          locations: true,
        },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      return organization;
    }),

  /**
   * Approve organization
   * Migrated from: POST /api/admin/organizations/[id]/approve
   */
  approveOrganization: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.id },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      // Approve the organization
      const updatedOrganization = await ctx.prisma.organization.update({
        where: { id: input.id },
        data: {
          status: 'APPROVED',
          approvedById: ctx.session.user.id,
          approvedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      // Log admin action
      console.log('ADMIN_ACTION: Organization approved', {
        organizationId: organization.id,
        organizationName: organization.name,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        timestamp: new Date().toISOString(),
        action: 'ORGANIZATION_APPROVED',
      });

      return updatedOrganization;
    }),

  /**
   * Reject organization
   * Migrated from: POST /api/admin/organizations/[id]/reject
   */
  rejectOrganization: adminProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.id },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      // Reject the organization
      const updatedOrganization = await ctx.prisma.organization.update({
        where: { id: input.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: input.reason,
          approvedAt: null,
          approvedById: null,
        },
      });

      // Log admin action
      console.log('ADMIN_ACTION: Organization rejected', {
        organizationId: organization.id,
        organizationName: organization.name,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        reason: input.reason,
        timestamp: new Date().toISOString(),
        action: 'ORGANIZATION_REJECTED',
      });

      return updatedOrganization;
    }),

  /**
   * Admin override login
   * Migrated from: POST /api/admin/override
   */
  overrideLogin: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Log admin override action
      console.log('ADMIN_ACTION: Admin override login', {
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        timestamp: new Date().toISOString(),
        action: 'ADMIN_OVERRIDE_LOGIN',
      });

      // Return session data for the target user
      return {
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role,
        },
      };
    }),
});
