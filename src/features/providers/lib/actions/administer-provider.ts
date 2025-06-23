'use server';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function approveServiceProvider(serviceProviderId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Check if all required requirements are approved
    const requirementCheck = await checkAllRequiredRequirementsApproved(serviceProviderId);
    if (!requirementCheck.success) {
      return { success: false, error: requirementCheck.error };
    }

    if (!requirementCheck.data?.allRequiredApproved) {
      const pendingCount = requirementCheck.data?.pendingRequirements?.length ?? 0;
      return {
        success: false,
        error: `Cannot approve provider: ${pendingCount} required requirement(s) still pending approval`,
      };
    }

    // Update service provider status
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: serviceProviderId },
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
      serviceProviderId,
      serviceProviderName: updatedProvider.name,
      serviceProviderEmail: updatedProvider.user.email,
      adminId: session.user.id,
      adminEmail: session.user.email,
      adminName: session.user.name,
      approvedAt: updatedProvider.approvedAt,
      totalRequiredRequirements: requirementCheck.data?.totalRequired,
      totalApprovedRequirements: requirementCheck.data?.totalApproved,
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error approving service provider:', error);
    return { success: false, error: 'Failed to approve service provider' };
  }
}

export async function rejectServiceProvider(serviceProviderId: string, rejectionReason: string) {
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

    // Update service provider status
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: serviceProviderId },
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
      serviceProviderId,
      serviceProviderName: updatedProvider.name,
      serviceProviderEmail: updatedProvider.user.email,
      adminId: session.user.id,
      adminEmail: session.user.email,
      adminName: session.user.name,
      rejectedAt: updatedProvider.rejectedAt,
      rejectionReason,
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error rejecting service provider:', error);
    return { success: false, error: 'Failed to reject service provider' };
  }
}

export async function suspendServiceProvider(serviceProviderId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Update service provider status
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: serviceProviderId },
      data: {
        status: 'SUSPENDED',
      },
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error suspending service provider:', error);
    return { success: false, error: 'Failed to suspend service provider' };
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
        serviceProvider: {
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
      serviceProviderId: updatedSubmission.serviceProviderId,
      serviceProviderName: updatedSubmission.serviceProvider.name,
      serviceProviderEmail: updatedSubmission.serviceProvider.user.email,
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
        serviceProvider: {
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
      serviceProviderId: updatedSubmission.serviceProviderId,
      serviceProviderName: updatedSubmission.serviceProvider.name,
      serviceProviderEmail: updatedSubmission.serviceProvider.user.email,
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

export async function checkAllRequiredRequirementsApproved(serviceProviderId: string) {
  try {
    // Get the service provider with their type and requirements
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { id: serviceProviderId },
      include: {
        serviceProviderType: {
          include: {
            requirements: {
              where: { isRequired: true },
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

    if (!serviceProvider) {
      return { success: false, error: 'Service provider not found' };
    }

    const requiredRequirements = serviceProvider.serviceProviderType.requirements;
    const approvedSubmissions = serviceProvider.requirementSubmissions.filter(
      (submission) => submission.status === 'APPROVED'
    );

    // Check if all required requirements have approved submissions
    const allRequiredApproved = requiredRequirements.every((requirement) =>
      approvedSubmissions.some((submission) => submission.requirementTypeId === requirement.id)
    );

    const pendingRequirements = requiredRequirements.filter(
      (requirement) =>
        !approvedSubmissions.some((submission) => submission.requirementTypeId === requirement.id)
    );

    return {
      success: true,
      data: {
        allRequiredApproved,
        totalRequired: requiredRequirements.length,
        totalApproved: approvedSubmissions.length,
        pendingRequirements: pendingRequirements.map((req) => ({
          id: req.id,
          name: req.name,
          description: req.description,
        })),
      },
    };
  } catch (error) {
    console.error('Error checking required requirements:', error);
    return { success: false, error: 'Failed to check required requirements' };
  }
}

export async function getProviderRequirementSubmissions(serviceProviderId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const submissions = await prisma.requirementSubmission.findMany({
      where: { serviceProviderId },
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
