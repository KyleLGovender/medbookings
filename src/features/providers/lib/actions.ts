'use server';

import { prisma } from '@/lib/prisma';

/**
 * Check if all required requirements are approved for a provider
 * This is complex business logic worth extracting from tRPC procedures
 */
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
      (requirement, index, array) => array.findIndex((r) => r.id === requirement.id) === index
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
    const pendingByType = provider.typeAssignments
      .map((assignment) => ({
        typeName: assignment.providerType.name,
        typeId: assignment.providerType.id,
        pendingRequirements: assignment.providerType.requirements.filter(
          (requirement) =>
            !approvedSubmissions.some(
              (submission) => submission.requirementTypeId === requirement.id
            )
        ),
      }))
      .filter((typeInfo) => typeInfo.pendingRequirements.length > 0);

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
        pendingByType: pendingByType.map((typeInfo) => ({
          typeName: typeInfo.typeName,
          typeId: typeInfo.typeId,
          pendingCount: typeInfo.pendingRequirements.length,
          pendingRequirements: typeInfo.pendingRequirements.map((req) => ({
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