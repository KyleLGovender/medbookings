'use server';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function approveProvider(providerId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Check if all required requirements are approved
    const requirementCheck = await checkAllRequiredRequirementsApproved(providerId);
    if (!requirementCheck.success) {
      return { success: false, error: requirementCheck.error };
    }

    if (!requirementCheck.data?.allRequiredApproved) {
      const pendingCount = requirementCheck.data?.pendingRequirements?.length ?? 0;
      const assignedTypes = requirementCheck.data?.assignedTypes ?? 0;
      const pendingByType = requirementCheck.data?.pendingByType ?? [];
      
      let errorMessage = `Cannot approve provider: ${pendingCount} required requirement(s) still pending approval across ${assignedTypes} provider type(s).`;
      
      if (pendingByType.length > 0) {
        errorMessage += '\n\nPending by type:\n';
        pendingByType.forEach((typeInfo: any) => {
          errorMessage += `• ${typeInfo.typeName}: ${typeInfo.pendingCount} requirement(s)\n`;
        });
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Update provider status
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: session.user.id,
        rejectedAt: null,
        rejectionReason: null,
      },
      include: {
        user: true,
      },
    });

    // Console log for future email integration
    console.log('PROVIDER_APPROVED:', {
      providerId,
      providerName: updatedProvider.name,
      providerEmail: updatedProvider.user.email,
      adminId: session.user.id,
      adminEmail: session.user.email,
      adminName: session.user.name,
      approvedAt: updatedProvider.approvedAt,
      totalRequiredRequirements: requirementCheck.data?.totalRequired,
      totalApprovedRequirements: requirementCheck.data?.totalApproved,
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error approving provider:', error);
    return { success: false, error: 'Failed to approve provider' };
  }
}

export async function rejectProvider(providerId: string, rejectionReason: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    if (!rejectionReason?.trim()) {
      return { success: false, error: 'Rejection reason is required' };
    }

    // Update provider status
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
        approvedAt: null,
        approvedById: null,
      },
      include: {
        user: true,
      },
    });

    // Console log for future email integration
    console.log('PROVIDER_REJECTED:', {
      providerId,
      providerName: updatedProvider.name,
      providerEmail: updatedProvider.user.email,
      adminId: session.user.id,
      adminEmail: session.user.email,
      adminName: session.user.name,
      rejectedAt: updatedProvider.rejectedAt,
      rejectionReason,
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error rejecting provider:', error);
    return { success: false, error: 'Failed to reject provider' };
  }
}

export async function suspendProvider(providerId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Update provider status
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        status: 'SUSPENDED',
      },
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error suspending provider:', error);
    return { success: false, error: 'Failed to suspend provider' };
  }
}

// NEW REQUIREMENT-SPECIFIC APPROVAL FUNCTIONS

export async function approveRequirement(requirementSubmissionId: string, adminNotes?: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Update requirement submission status
    const updatedSubmission = await prisma.requirementSubmission.update({
      where: { id: requirementSubmissionId },
      data: {
        status: 'APPROVED',
        validatedAt: new Date(),
        validatedById: session.user.id,
        notes: adminNotes || null,
      },
      include: {
        requirementType: true,
        provider: {
          include: {
            user: true,
          },
        },
      },
    });

    // Console log for future email integration
    console.log('REQUIREMENT_APPROVED:', {
      requirementSubmissionId,
      requirementTypeId: updatedSubmission.requirementTypeId,
      requirementTypeName: updatedSubmission.requirementType.name,
      providerId: updatedSubmission.providerId,
      providerName: updatedSubmission.provider.name,
      providerEmail: updatedSubmission.provider.user.email,
      adminId: session.user.id,
      adminEmail: session.user.email,
      adminName: session.user.name,
      approvedAt: updatedSubmission.validatedAt,
      adminNotes,
    });

    return { success: true, data: updatedSubmission };
  } catch (error) {
    console.error('Error approving requirement:', error);
    return { success: false, error: 'Failed to approve requirement' };
  }
}

export async function rejectRequirement(requirementSubmissionId: string, rejectionReason: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    if (!rejectionReason?.trim()) {
      return { success: false, error: 'Rejection reason is required' };
    }

    // Update requirement submission status
    const updatedSubmission = await prisma.requirementSubmission.update({
      where: { id: requirementSubmissionId },
      data: {
        status: 'REJECTED',
        validatedAt: new Date(),
        validatedById: session.user.id,
        notes: rejectionReason.trim(),
      },
      include: {
        requirementType: true,
        provider: {
          include: {
            user: true,
          },
        },
      },
    });

    // Console log for future email integration
    console.log('REQUIREMENT_REJECTED:', {
      requirementSubmissionId,
      requirementTypeId: updatedSubmission.requirementTypeId,
      requirementTypeName: updatedSubmission.requirementType.name,
      providerId: updatedSubmission.providerId,
      providerName: updatedSubmission.provider.name,
      providerEmail: updatedSubmission.provider.user.email,
      adminId: session.user.id,
      adminEmail: session.user.email,
      adminName: session.user.name,
      rejectedAt: updatedSubmission.validatedAt,
      rejectionReason,
    });

    return { success: true, data: updatedSubmission };
  } catch (error) {
    console.error('Error rejecting requirement:', error);
    return { success: false, error: 'Failed to reject requirement' };
  }
}

export async function checkAllRequiredRequirementsApproved(providerId: string) {
  try {
    // Get the provider with all their assigned types and requirements
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
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
      return { success: false, error: 'Provider not found' };
    }

    // Collect all required requirements from ALL assigned provider types
    const allRequiredRequirements = provider.typeAssignments.flatMap(
      (assignment) => assignment.providerType.requirements
    );

    // Remove duplicates (same requirement may be required by multiple types)
    const uniqueRequiredRequirements = allRequiredRequirements.filter(
      (requirement, index, array) => 
        array.findIndex(r => r.id === requirement.id) === index
    );

    const approvedSubmissions = provider.requirementSubmissions.filter(
      (submission) => submission.status === 'APPROVED'
    );

    // Check if all required requirements from ALL types have approved submissions
    const allRequiredApproved = uniqueRequiredRequirements.every((requirement) =>
      approvedSubmissions.some((submission) => submission.requirementTypeId === requirement.id)
    );

    const pendingRequirements = uniqueRequiredRequirements.filter(
      (requirement) =>
        !approvedSubmissions.some((submission) => submission.requirementTypeId === requirement.id)
    );

    // Group pending requirements by provider type for better error messaging
    const pendingByType = provider.typeAssignments.map(assignment => ({
      typeName: assignment.providerType.name,
      typeId: assignment.providerType.id,
      pendingRequirements: assignment.providerType.requirements.filter(
        requirement => !approvedSubmissions.some(submission => submission.requirementTypeId === requirement.id)
      ),
    })).filter(typeInfo => typeInfo.pendingRequirements.length > 0);

    return {
      success: true,
      data: {
        allRequiredApproved,
        totalRequired: uniqueRequiredRequirements.length,
        totalApproved: approvedSubmissions.length,
        assignedTypes: provider.typeAssignments.length,
        pendingRequirements: pendingRequirements.map((req) => ({
          id: req.id,
          name: req.name,
          description: req.description,
        })),
        pendingByType: pendingByType.map(typeInfo => ({
          typeName: typeInfo.typeName,
          typeId: typeInfo.typeId,
          pendingCount: typeInfo.pendingRequirements.length,
          pendingRequirements: typeInfo.pendingRequirements.map(req => ({
            id: req.id,
            name: req.name,
            description: req.description,
          })),
        })),
      },
    };
  } catch (error) {
    console.error('Error checking required requirements:', error);
    return { success: false, error: 'Failed to check required requirements' };
  }
}

export async function getProviderRequirementSubmissions(providerId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const submissions = await prisma.requirementSubmission.findMany({
      where: { providerId },
      include: {
        requirementType: true,
        validatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { requirementType: { displayPriority: 'asc' } },
        { requirementType: { name: 'asc' } },
      ],
    });

    return { success: true, data: submissions };
  } catch (error) {
    console.error('Error fetching provider requirement submissions:', error);
    return { success: false, error: 'Failed to fetch requirement submissions' };
  }
}

// Backward compatibility exports
export const approveServiceProvider = approveProvider;
export const rejectServiceProvider = rejectProvider;
export const suspendServiceProvider = suspendProvider;
export const deleteServiceProvider = deleteProvider;
