/**
 * Helper functions for providers
 */

/**
 * Serializes a provider object to ensure it's safe for JSON responses
 * Handles Decimal values and other non-serializable types
 */
export function serializeProvider(provider: any): any {
  if (!provider) return null;

  return {
    ...provider,
    // Convert any Decimal values to numbers
    ...(provider.services && {
      services: provider.services.map((service: any) => ({
        ...service,
        defaultPrice:
          typeof service.defaultPrice === 'object' && service.defaultPrice !== null
            ? Number(service.defaultPrice)
            : service.defaultPrice,
      })),
    }),
    // Serialize availabilityConfigs with Decimal prices, aliased as serviceConfigs for compatibility
    ...(provider.availabilityConfigs && {
      serviceConfigs: provider.availabilityConfigs.map((config: any) => ({
        ...config,
        price:
          typeof config.price === 'object' && config.price !== null
            ? Number(config.price)
            : config.price,
        createdAt: config.createdAt?.toISOString(),
        updatedAt: config.updatedAt?.toISOString(),
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
      // Also provide a legacy providerType for backward compatibility
      providerType:
        provider.typeAssignments.length > 0 ? provider.typeAssignments[0].providerType : null,
      // Provide providerTypeId for hooks that need it
      providerTypeId:
        provider.typeAssignments.length > 0 ? provider.typeAssignments[0].providerType?.id : null,
      // Provide all types as an array
      providerTypes: provider.typeAssignments.map((assignment: any) => assignment.providerType),
    }),
    // Ensure dates are serialized properly
    createdAt: provider.createdAt?.toISOString(),
    updatedAt: provider.updatedAt?.toISOString(),
  };
}

// Backward compatibility export
export const serializeServiceProvider = serializeProvider;

