/**
 * Helper functions for service providers
 */
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Serializes a service provider object to ensure it's safe for JSON responses
 * Handles Decimal values and other non-serializable types
 */
export function serializeServiceProvider(provider: any): any {
  if (!provider) return null;

  return {
    ...provider,
    // Convert any Decimal values to numbers
    ...(provider.services && {
      services: provider.services.map((service: any) => ({
        ...service,
        defaultPrice:
          service.defaultPrice instanceof Decimal
            ? Number(service.defaultPrice)
            : service.defaultPrice,
      })),
    }),
    // Make sure requirementSubmissions is serializable
    ...(provider.requirementSubmissions && {
      requirementSubmissions: provider.requirementSubmissions.map((submission: any) => ({
        ...submission,
        createdAt: submission.createdAt?.toISOString(),
        updatedAt: submission.updatedAt?.toISOString(),
      })),
    }),
    // Handle typeAssignments for n:n relationship
    ...(provider.typeAssignments && {
      typeAssignments: provider.typeAssignments.map((assignment: any) => ({
        ...assignment,
        createdAt: assignment.createdAt?.toISOString(),
        updatedAt: assignment.updatedAt?.toISOString(),
      })),
      // Also provide a legacy serviceProviderType for backward compatibility
      serviceProviderType: provider.typeAssignments.length > 0 
        ? provider.typeAssignments[0].serviceProviderType 
        : null,
      // Provide all types as an array
      serviceProviderTypes: provider.typeAssignments.map((assignment: any) => assignment.serviceProviderType),
    }),
    // Ensure dates are serialized properly
    createdAt: provider.createdAt?.toISOString(),
    updatedAt: provider.updatedAt?.toISOString(),
  };
}
