import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import env from '@/config/env/server';
import {
  adminRouteParamsSchema,
  adminSearchParamsSchema,
  approveOrganizationRequestSchema,
  approveProviderRequestSchema,
  approveRequirementRequestSchema,
  rejectOrganizationRequestSchema,
  rejectProviderRequestSchema,
  rejectRequirementRequestSchema,
} from '@/features/admin/types/schemas';
import { validateProviderRequirementsBusinessLogic } from '@/features/providers/lib/actions';
import { createAuditLog } from '@/lib/audit';
import { logger, sanitizeEmail } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';
import { adminProcedure, createTRPCRouter } from '@/server/trpc';

export const adminRouter = createTRPCRouter({
  /*
   * ====================================
   * DASHBOARD STATISTICS - QUERIES
   * ====================================
   * Endpoints for admin dashboard data
   */

  /**
   * Get dashboard statistics (admin)
   * Provides platform-wide statistics for admin dashboard
   */
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    // Get platform statistics
    const [
      totalUsers,
      totalProviders,
      totalOrganizations,
      pendingProvidersCount,
      pendingOrganizationsCount,
      activeBookings,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.provider.count({ where: { status: 'ACTIVE' } }),
      ctx.prisma.organization.count({ where: { status: 'ACTIVE' } }),
      ctx.prisma.provider.count({ where: { status: 'PENDING_APPROVAL' } }),
      ctx.prisma.organization.count({ where: { status: 'PENDING_APPROVAL' } }),
      ctx.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    ]);

    return {
      totalUsers,
      totalProviders,
      totalOrganizations,
      pendingProviders: pendingProvidersCount,
      pendingOrganizations: pendingOrganizationsCount,
      activeBookings,
    };
  }),

  /**
   * Get pending providers for dashboard (admin)
   * Provides summary data of providers awaiting approval
   */
  getPendingProviders: adminProcedure.query(async ({ ctx }) => {
    const pendingProvidersData = await ctx.prisma.provider.findMany({
      where: { status: 'PENDING_APPROVAL' },
      take: 50, // Pagination: Admin dashboard shows first 50 pending providers
      include: {
        user: true,
        typeAssignments: {
          include: { providerType: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return pendingProvidersData.map((provider) => {
      const providerTypeName = provider.typeAssignments[0]?.providerType?.name || 'Unknown';

      return {
        id: provider.id,
        email: provider.user.email || 'No email',
        name: provider.name,
        providerType: providerTypeName,
        submittedAt: provider.createdAt,
        requirementsStatus: 'pending' as const,
        totalRequirements: 0,
        approvedRequirements: 0,
      };
    });
  }),

  /**
   * Get pending organizations for dashboard (admin)
   * Provides summary data of organizations awaiting approval
   */
  getPendingOrganizations: adminProcedure.query(async ({ ctx }) => {
    const pendingOrganizationsData = await ctx.prisma.organization.findMany({
      where: { status: 'PENDING_APPROVAL' },
      take: 50, // Pagination: Admin dashboard shows first 50 pending organizations
      include: {
        locations: true,
        memberships: {
          where: { role: 'OWNER' },
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return pendingOrganizationsData.map((org) => {
      const owner = org.memberships.find((m) => m.role === 'OWNER')?.user;

      return {
        id: org.id,
        name: org.name,
        type: 'Healthcare Facility' as const,
        ownerEmail: owner?.email || 'No email',
        submittedAt: org.createdAt,
        locationsCount: org.locations.length,
      };
    });
  }),

  /*
   * ====================================
   * PROVIDER MANAGEMENT - QUERIES
   * ====================================
   * Endpoints for retrieving provider data
   */

  /**
   * Get all providers (admin)
   * Migrated from: GET /api/admin/providers
   */
  getProviders: adminProcedure.input(adminSearchParamsSchema).query(async ({ ctx, input }) => {
    // Build where clause with optional status and search filters
    const whereClause: Prisma.ProviderWhereInput = {};

    if (input.status) {
      whereClause.status = input.status;
    }

    if (input.search) {
      whereClause.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
        { user: { name: { contains: input.search, mode: 'insensitive' } } },
        { user: { email: { contains: input.search, mode: 'insensitive' } } },
      ];
    }

    const providers = await ctx.prisma.provider.findMany({
      where: whereClause,
      take: 50, // Pagination: Admin list view shows 50 providers per page
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
   * Get provider by ID (admin) - Basic info only
   * Migrated from: GET /api/admin/providers/[id]
   */
  getProviderById: adminProcedure.input(adminRouteParamsSchema).query(async ({ ctx, input }) => {
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
        services: true,
      },
    });

    if (!provider) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Provider not found',
      });
    }

    return provider;
  }),

  /**
   * Get provider requirement submissions by provider ID (admin)
   * Focused query for requirements only - updates frequently
   */
  getProviderRequirements: adminProcedure
    .input(adminRouteParamsSchema)
    .query(async ({ ctx, input }) => {
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          requirementSubmissions: {
            include: {
              requirementType: true,
            },
            orderBy: {
              requirementType: {
                displayPriority: 'asc',
              },
            },
          },
        },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      return provider.requirementSubmissions;
    }),

  /*
   * ====================================
   * PROVIDER MANAGEMENT - MUTATIONS
   * ====================================
   * Endpoints for provider approval/rejection workflows
   */

  /**
   * Approve provider
   * Migrated from: POST /api/admin/providers/[id]/approve
   * OPTION C COMPLIANT: Uses business logic validation from server action
   */
  approveProvider: adminProcedure
    .input(adminRouteParamsSchema.merge(approveProviderRequestSchema))
    .mutation(async ({ ctx, input }) => {
      // Get provider with all requirements data for validation
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      // Use the business logic validation function (Option C compliant)
      const validationResult = await validateProviderRequirementsBusinessLogic(
        provider.typeAssignments,
        provider.requirementSubmissions
      );

      // Check if all required requirements are approved
      if (!validationResult.allRequiredApproved) {
        const pendingDetails = validationResult.pendingByType
          .map((type) => `${type.typeName}: ${type.pendingCount} pending`)
          .join(', ');

        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot approve provider: ${validationResult.pendingRequirementsCount} required requirements are not approved. ${pendingDetails}`,
        });
      }

      // Validate that DOCUMENT requirements have uploaded files
      const documentRequirements = provider.requirementSubmissions.filter(
        (sub) => sub.requirementType.validationType === 'DOCUMENT' && sub.requirementType.isRequired
      );

      const missingDocuments = documentRequirements.filter(
        (sub) =>
          !sub.documentMetadata ||
          (typeof sub.documentMetadata === 'object' &&
            sub.documentMetadata !== null &&
            !('url' in (sub.documentMetadata as Record<string, unknown>)))
      );

      if (missingDocuments.length > 0) {
        const missingNames = missingDocuments.map((sub) => sub.requirementType.name).join(', ');

        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot approve provider: ${missingDocuments.length} required documents are not uploaded. Missing: ${missingNames}`,
        });
      }

      // Validate that documents are not expired
      const expiredDocuments = documentRequirements.filter(
        (sub) => sub.expiresAt && sub.expiresAt < nowUTC()
      );

      if (expiredDocuments.length > 0) {
        const expiredNames = expiredDocuments
          .map((sub) => `${sub.requirementType.name} (expired ${sub.expiresAt!.toISOString()})`)
          .join(', ');

        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot approve provider: ${expiredDocuments.length} required documents have expired. Expired: ${expiredNames}`,
        });
      }

      // Approve the provider
      const updatedProvider = await ctx.prisma.provider.update({
        where: { id: input.id },
        data: {
          status: 'APPROVED',
          approvedById: ctx.session.user.id,
          approvedAt: nowUTC(),
          rejectedAt: null,
          rejectionReason: null,
        },
        include: {
          user: true,
        },
      });

      // Create database audit log (POPIA compliance)
      await createAuditLog({
        action: 'Provider approved',
        category: 'ADMIN_ACTION',
        userId: ctx.session.user.id,
        userEmail: sanitizeEmail(ctx.session.user.email || ''),
        resource: 'Provider',
        resourceId: updatedProvider.id,
        metadata: {
          providerName: updatedProvider.name,
          providerEmail: sanitizeEmail(updatedProvider.email || ''),
          requirementsValidation: {
            totalRequired: validationResult.totalRequired,
            totalApproved: validationResult.totalApproved,
          },
        },
      });

      // Send approval notification email
      if (updatedProvider.user?.email || updatedProvider.email) {
        try {
          const { sendEmail } = await import('@/lib/communications/email');
          const recipientEmail = updatedProvider.user?.email || updatedProvider.email || '';

          await sendEmail({
            to: recipientEmail,
            subject: 'Your MedBookings Provider Profile Has Been Approved!',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Provider Profile Approved</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">Congratulations!</h1>
                  </div>

                  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Your Provider Profile is Approved</h2>

                    <p>Dear ${updatedProvider.name},</p>

                    <p>Great news! Your provider profile on MedBookings has been reviewed and approved by our admin team.</p>

                    <p><strong>What's next?</strong></p>
                    <ul>
                      <li>Subscribe to one of our plans to activate your profile and start accepting bookings</li>
                      <li>Set up your availability calendar</li>
                      <li>Configure your services and pricing</li>
                      <li>Complete your profile with professional information</li>
                    </ul>

                    <p>Your approved profile status confirms that all your regulatory requirements have been verified. To start receiving patient bookings, you'll need to activate your profile by subscribing to one of our service plans.</p>

                    <div style="text-align: center; margin-top: 30px;">
                      <a href="${env.NEXTAUTH_URL || 'https://medbookings.co.za'}/provider-profile" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Your Provider Profile</a>
                    </div>

                    <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact our support team.</p>
                  </div>

                  <div style="margin-top: 20px; padding: 20px; text-align: center; color: #666; font-size: 14px;">
                    <p>© 2024 MedBookings. All rights reserved.</p>
                    <p>Cape Town, South Africa</p>
                  </div>
                </body>
              </html>
            `,
            text: `Congratulations! Your Provider Profile is Approved\n\nDear ${updatedProvider.name},\n\nGreat news! Your provider profile on MedBookings has been reviewed and approved by our admin team.\n\nWhat's next?\n- Subscribe to one of our plans to activate your profile\n- Set up your availability calendar\n- Configure your services and pricing\n- Complete your profile information\n\nVisit your provider profile: ${env.NEXTAUTH_URL || 'https://medbookings.co.za'}/provider-profile\n\nBest regards,\nThe MedBookings Team`,
          });

          logger.info('Provider approval email sent', {
            recipientEmail: sanitizeEmail(
              updatedProvider.user?.email || updatedProvider.email || ''
            ),
          });
        } catch (error) {
          logger.error('Failed to send provider approval email', {
            recipientEmail: sanitizeEmail(
              updatedProvider.user?.email || updatedProvider.email || ''
            ),
            error: error instanceof Error ? error.message : String(error),
          });
          // Don't fail the approval if email fails
        }
      }

      // Log admin action
      logger.audit('ADMIN_ACTION: Provider approved', {
        providerId: updatedProvider.id,
        providerName: updatedProvider.name,
        providerEmail: sanitizeEmail(updatedProvider.email || ''),
        adminId: ctx.session.user.id,
        adminEmail: sanitizeEmail(ctx.session.user.email || ''),
        timestamp: nowUTC().toISOString(),
        action: 'PROVIDER_APPROVED',
        requirementsValidation: {
          totalRequired: validationResult.totalRequired,
          totalApproved: validationResult.totalApproved,
        },
      });

      return updatedProvider;
    }),

  /**
   * Reject provider
   * Migrated from: POST /api/admin/providers/[id]/reject
   */
  rejectProvider: adminProcedure
    .input(adminRouteParamsSchema.merge(rejectProviderRequestSchema))
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      // Reject the provider
      const updatedProvider = await ctx.prisma.provider.update({
        where: { id: input.id },
        data: {
          status: 'REJECTED',
          rejectedAt: nowUTC(),
          rejectionReason: input.reason,
          approvedAt: null,
          approvedById: null,
        },
      });

      // Create database audit log (POPIA compliance)
      await createAuditLog({
        action: 'Provider rejected',
        category: 'ADMIN_ACTION',
        userId: ctx.session.user.id,
        userEmail: sanitizeEmail(ctx.session.user.email || ''),
        resource: 'Provider',
        resourceId: provider.id,
        metadata: {
          providerName: provider.name,
          providerEmail: sanitizeEmail(provider.email || ''),
          rejectionReason: input.reason,
        },
      });

      // Log admin action
      logger.audit('ADMIN_ACTION: Provider rejected', {
        providerId: provider.id,
        providerName: provider.name,
        providerEmail: sanitizeEmail(provider.email || ''),
        adminId: ctx.session.user.id,
        adminEmail: sanitizeEmail(ctx.session.user.email || ''),
        reason: input.reason,
        timestamp: nowUTC().toISOString(),
        action: 'PROVIDER_REJECTED',
      });

      return updatedProvider;
    }),

  /**
   * Reset rejected provider to pending status
   * Allows a rejected provider to be reconsidered
   */
  resetProviderStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.prisma.provider.findUnique({
        where: { id: input.id },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      if (provider.status !== 'REJECTED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Provider must be in REJECTED status to reset',
        });
      }

      // Reset the provider to pending approval
      const updatedProvider = await ctx.prisma.provider.update({
        where: { id: input.id },
        data: {
          status: 'PENDING_APPROVAL',
          rejectedAt: null,
          rejectionReason: null,
          approvedAt: null,
          approvedById: null,
        },
      });

      // Log admin action
      logger.audit('ADMIN_ACTION: Provider status reset to pending', {
        providerId: provider.id,
        providerName: provider.name,
        providerEmail: sanitizeEmail(provider.email || ''),
        previousStatus: provider.status,
        newStatus: 'PENDING_APPROVAL',
        adminId: ctx.session.user.id,
        adminEmail: sanitizeEmail(ctx.session.user.email || ''),
        timestamp: nowUTC().toISOString(),
        action: 'PROVIDER_STATUS_RESET',
      });

      return updatedProvider;
    }),

  /*
   * ====================================
   * REQUIREMENT MANAGEMENT
   * ====================================
   * Endpoints for managing provider requirement submissions
   */

  /**
   * Approve provider requirement
   * Migrated from: POST /api/admin/providers/[id]/requirements/[requirementId]/approve
   */
  approveRequirement: adminProcedure
    .input(
      z
        .object({
          providerId: z.string(),
          requirementId: z.string(),
        })
        .merge(approveRequirementRequestSchema)
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement submission not found',
        });
      }

      // Approve the requirement
      const updatedSubmission = await ctx.prisma.requirementSubmission.update({
        where: { id: input.requirementId },
        data: {
          status: 'APPROVED',
          validatedAt: nowUTC(),
          validatedById: ctx.session.user.id,
        },
      });

      // Create database audit log (POPIA compliance)
      await createAuditLog({
        action: 'Requirement approved',
        category: 'ADMIN_ACTION',
        userId: ctx.session.user.id,
        userEmail: sanitizeEmail(ctx.session.user.email || ''),
        resource: 'RequirementSubmission',
        resourceId: submission.id,
        metadata: {
          requirementName: submission.requirementType.name,
          providerId: submission.provider.id,
          providerName: submission.provider.name,
        },
      });

      // Log admin action
      logger.audit('ADMIN_ACTION: Requirement approved', {
        requirementId: submission.id,
        requirementName: submission.requirementType.name,
        providerId: submission.provider.id,
        providerName: submission.provider.name,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        timestamp: nowUTC().toISOString(),
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
      z
        .object({
          providerId: z.string(),
          requirementId: z.string(),
        })
        .merge(rejectRequirementRequestSchema)
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement submission not found',
        });
      }

      // Reject the requirement
      const updatedSubmission = await ctx.prisma.requirementSubmission.update({
        where: { id: input.requirementId },
        data: {
          status: 'REJECTED',
          notes: input.reason,
        },
      });

      // Create database audit log (POPIA compliance)
      await createAuditLog({
        action: 'Requirement rejected',
        category: 'ADMIN_ACTION',
        userId: ctx.session.user.id,
        userEmail: sanitizeEmail(ctx.session.user.email || ''),
        resource: 'RequirementSubmission',
        resourceId: submission.id,
        metadata: {
          requirementName: submission.requirementType.name,
          providerId: submission.provider.id,
          providerName: submission.provider.name,
          rejectionReason: input.reason,
        },
      });

      // Log admin action
      logger.audit('ADMIN_ACTION: Requirement rejected', {
        requirementId: submission.id,
        requirementName: submission.requirementType.name,
        providerId: submission.provider.id,
        providerName: submission.provider.name,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        reason: input.reason,
        timestamp: nowUTC().toISOString(),
        action: 'REQUIREMENT_REJECTED',
      });

      return updatedSubmission;
    }),

  /*
   * ====================================
   * ORGANIZATION MANAGEMENT - QUERIES
   * ====================================
   * Endpoints for retrieving organization data
   */

  /**
   * Get all organizations (admin)
   * Migrated from: GET /api/admin/organizations
   */
  getOrganizations: adminProcedure.input(adminSearchParamsSchema).query(async ({ ctx, input }) => {
    // Build where clause with optional status and search filters
    const whereClause: Prisma.OrganizationWhereInput = {};

    if (input.status) {
      whereClause.status = input.status;
    }

    if (input.search) {
      whereClause.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { description: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    const organizations = await ctx.prisma.organization.findMany({
      where: whereClause,
      take: 50, // Pagination: Admin list view shows 50 organizations per page
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
    .input(adminRouteParamsSchema)
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      return organization;
    }),

  /*
   * ====================================
   * ORGANIZATION MANAGEMENT - MUTATIONS
   * ====================================
   * Endpoints for organization approval/rejection workflows
   */

  /**
   * Approve organization
   * Migrated from: POST /api/admin/organizations/[id]/approve
   */
  approveOrganization: adminProcedure
    .input(adminRouteParamsSchema.merge(approveOrganizationRequestSchema))
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.id },
        include: {
          locations: true,
          memberships: {
            where: { role: 'OWNER' },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      // Validate organization has owner
      if (organization.memberships.length === 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot approve organization: No owner assigned',
        });
      }

      // Validate organization has at least one location
      if (organization.locations.length === 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot approve organization: No locations added',
        });
      }

      // Validate organization has required contact information
      if (!organization.email && !organization.phone) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot approve organization: Must have email or phone contact',
        });
      }

      // Approve the organization
      const updatedOrganization = await ctx.prisma.organization.update({
        where: { id: input.id },
        data: {
          status: 'APPROVED',
          approvedById: ctx.session.user.id,
          approvedAt: nowUTC(),
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      // Create database audit log (POPIA compliance)
      await createAuditLog({
        action: 'Organization approved',
        category: 'ADMIN_ACTION',
        userId: ctx.session.user.id,
        userEmail: sanitizeEmail(ctx.session.user.email || ''),
        resource: 'Organization',
        resourceId: organization.id,
        metadata: {
          organizationName: organization.name,
        },
      });

      // Log admin action
      logger.audit('ADMIN_ACTION: Organization approved', {
        organizationId: organization.id,
        organizationName: organization.name,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        timestamp: nowUTC().toISOString(),
        action: 'ORGANIZATION_APPROVED',
      });

      return updatedOrganization;
    }),

  /**
   * Reject organization
   * Migrated from: POST /api/admin/organizations/[id]/reject
   */
  rejectOrganization: adminProcedure
    .input(adminRouteParamsSchema.merge(rejectOrganizationRequestSchema))
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.id },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      // Reject the organization
      const updatedOrganization = await ctx.prisma.organization.update({
        where: { id: input.id },
        data: {
          status: 'REJECTED',
          rejectedAt: nowUTC(),
          rejectionReason: input.reason,
          approvedAt: null,
          approvedById: null,
        },
      });

      // Create database audit log (POPIA compliance)
      await createAuditLog({
        action: 'Organization rejected',
        category: 'ADMIN_ACTION',
        userId: ctx.session.user.id,
        userEmail: sanitizeEmail(ctx.session.user.email || ''),
        resource: 'Organization',
        resourceId: organization.id,
        metadata: {
          organizationName: organization.name,
          rejectionReason: input.reason,
        },
      });

      // Log admin action
      logger.audit('ADMIN_ACTION: Organization rejected', {
        organizationId: organization.id,
        organizationName: organization.name,
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        reason: input.reason,
        timestamp: nowUTC().toISOString(),
        action: 'ORGANIZATION_REJECTED',
      });

      return updatedOrganization;
    }),

  /**
   * Reset organization status to pending
   * Allows a rejected organization to be reconsidered
   */
  resetOrganizationStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.id },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      if (organization.status !== 'REJECTED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization must be in REJECTED status to reset',
        });
      }

      // Reset the organization to pending approval
      const updatedOrganization = await ctx.prisma.organization.update({
        where: { id: input.id },
        data: {
          status: 'PENDING_APPROVAL',
          rejectedAt: null,
          rejectionReason: null,
          approvedAt: null,
          approvedById: null,
        },
      });

      // Log admin action
      logger.audit('ADMIN_ACTION: Organization status reset to pending', {
        organizationId: organization.id,
        organizationName: organization.name,
        organizationEmail: sanitizeEmail(organization.email || ''),
        previousStatus: organization.status,
        newStatus: 'PENDING_APPROVAL',
        adminId: ctx.session.user.id,
        adminEmail: ctx.session.user.email,
        timestamp: nowUTC().toISOString(),
        action: 'ORGANIZATION_STATUS_RESET',
      });

      return updatedOrganization;
    }),

  /*
   * ====================================
   * ADMIN UTILITIES
   * ====================================
   * Special administrative functions
   */

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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target user not found',
        });
      }

      // Log admin override action
      logger.audit('ADMIN_ACTION: Admin override login', {
        adminId: ctx.session.user.id,
        adminEmail: sanitizeEmail(ctx.session.user.email || ''),
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        timestamp: nowUTC().toISOString(),
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
