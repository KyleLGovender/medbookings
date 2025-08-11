'use server';

import { RequirementsValidationStatus } from '@prisma/client';

/**
 * Business logic for checking if all required requirements are approved for a provider
 *
 * OPTION C COMPLIANT: This function only handles business logic validation.
 * Database queries are performed by the tRPC procedure that calls this function.
 *
 * @param typeAssignments - Provider's type assignments with requirements
 * @param requirementSubmissions - Provider's requirement submissions
 * @returns Business logic validation result with minimal metadata
 */
export async function validateProviderRequirementsBusinessLogic(
  typeAssignments: Array<{
    providerType: {
      name: string;
      id: string;
      requirements: Array<{
        id: string;
        name: string;
        description: string | null;
        isRequired: boolean;
      }>;
    };
  }>,
  requirementSubmissions: Array<{
    id: string;
    requirementTypeId: string;
    status: string;
    requirementType: {
      id: string;
      name: string;
      description: string | null;
      isRequired: boolean;
    };
  }>
) {
  // Collect all required requirements from ALL assigned provider types
  const allRequiredRequirements = typeAssignments.flatMap(
    (assignment) => assignment.providerType.requirements
  );

  // Remove duplicates (same requirement may be required by multiple types)
  const uniqueRequiredRequirements = allRequiredRequirements.filter(
    (requirement, index, array) => array.findIndex((r) => r.id === requirement.id) === index
  );

  const approvedSubmissions = requirementSubmissions.filter(
    (submission) => submission.status === RequirementsValidationStatus.APPROVED
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
  const pendingByType = typeAssignments
    .map((assignment) => ({
      typeName: assignment.providerType.name,
      typeId: assignment.providerType.id,
      pendingRequirements: assignment.providerType.requirements.filter(
        (requirement) =>
          !approvedSubmissions.some((submission) => submission.requirementTypeId === requirement.id)
      ),
    }))
    .filter((typeInfo) => typeInfo.pendingRequirements.length > 0);

  // Return minimal metadata only - no database entities
  return {
    success: true,
    allRequiredApproved,
    totalRequired: uniqueRequiredRequirements.length,
    totalApproved: approvedSubmissions.length,
    assignedTypesCount: typeAssignments.length,
    pendingRequirementsCount: pendingRequirements.length,
    pendingRequirementIds: pendingRequirements.map((req) => req.id),
    pendingByType: pendingByType.map((typeInfo) => ({
      typeName: typeInfo.typeName,
      typeId: typeInfo.typeId,
      pendingCount: typeInfo.pendingRequirements.length,
      pendingRequirementIds: typeInfo.pendingRequirements.map((req) => req.id),
    })),
  };
}
