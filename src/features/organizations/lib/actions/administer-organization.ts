import { OrganizationStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Approves an organization
 * @param organizationId The ID of the organization to approve
 * @returns Success or error result
 */
export async function approveOrganization(organizationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        memberships: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }

    // Check if organization is in a state that can be approved
    if (organization.status === 'APPROVED') {
      return { success: false, error: 'Organization is already approved' };
    }

    // Approve the organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: 'APPROVED',
        approvedById: session.user.id,
        approvedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    // Console log for future email integration
    console.log('ADMIN_ACTION: Organization approved', {
      organizationId: organization.id,
      organizationName: organization.name,
      organizationEmail: organization.email,
      adminId: session.user.id,
      adminName: session.user.name,
      adminEmail: session.user.email,
      approvedAt: updatedOrganization.approvedAt,
      memberCount: organization.memberships.length,
      timestamp: new Date().toISOString(),
    });

    return { success: true, data: updatedOrganization };
  } catch (error) {
    console.error('Error approving organization:', error);
    return { success: false, error: 'Failed to approve organization' };
  }
}

/**
 * Rejects an organization with a reason
 * @param organizationId The ID of the organization to reject
 * @param rejectionReason The reason for rejection
 * @returns Success or error result
 */
export async function rejectOrganization(organizationId: string, rejectionReason: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return { success: false, error: 'Rejection reason is required' };
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        memberships: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }

    // Check if organization is in a state that can be rejected
    if (organization.status === 'REJECTED') {
      return { success: false, error: 'Organization is already rejected' };
    }

    // Reject the organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
        approvedById: null,
        approvedAt: null,
      },
    });

    // Console log for future email integration
    console.log('ADMIN_ACTION: Organization rejected', {
      organizationId: organization.id,
      organizationName: organization.name,
      organizationEmail: organization.email,
      adminId: session.user.id,
      adminName: session.user.name,
      adminEmail: session.user.email,
      rejectionReason: rejectionReason.trim(),
      rejectedAt: updatedOrganization.rejectedAt,
      memberCount: organization.memberships.length,
      timestamp: new Date().toISOString(),
    });

    return { success: true, data: updatedOrganization };
  } catch (error) {
    console.error('Error rejecting organization:', error);
    return { success: false, error: 'Failed to reject organization' };
  }
}

/**
 * Fetches all organizations for admin view
 * @param status Optional status filter
 * @returns Success or error result with organizations
 */
export async function getAdminOrganizations(status?: OrganizationStatus) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const whereClause = status ? { status } : {};

    const organizations = await prisma.organization.findMany({
      where: whereClause,
      include: {
        approvedBy: {
          select: { email: true, name: true },
        },
        memberships: {
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
        },
        locations: {
          select: { id: true, name: true, formattedAddress: true },
        },
        _count: {
          select: {
            memberships: true,
            locations: true,
            providerConnections: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: organizations };
  } catch (error) {
    console.error('Error fetching admin organizations:', error);
    return { success: false, error: 'Failed to fetch organizations' };
  }
}

/**
 * Fetches a specific organization for admin view
 * @param organizationId The ID of the organization to fetch
 * @returns Success or error result with organization details
 */
export async function getAdminOrganization(organizationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        approvedBy: {
          select: { name: true, email: true },
        },
        memberships: {
          include: {
            user: {
              select: { email: true, name: true, phone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        locations: {
          select: {
            id: true,
            name: true,
            formattedAddress: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        providerConnections: {
          include: {
            serviceProvider: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
                serviceProviderType: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }

    return { success: true, data: organization };
  } catch (error) {
    console.error('Error fetching admin organization:', error);
    return { success: false, error: 'Failed to fetch organization' };
  }
}
