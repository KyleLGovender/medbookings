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
        price: typeof config.price === 'object' && config.price !== null ? Number(config.price) : config.price,
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

/**
 * Gets service configuration with fallback to default values
 * @param provider Provider with services and serviceConfigs
 * @param serviceId ID of the service to get config for
 * @returns Service configuration with price/duration, falling back to service defaults
 */
export function getServiceConfig(provider: any, serviceId: string) {
  // First try to find custom ServiceAvailabilityConfig
  const customConfig = provider.serviceConfigs?.find((config: any) => config.serviceId === serviceId);
  
  if (customConfig) {
    return {
      duration: customConfig.duration,
      price: customConfig.price,
      isOnlineAvailable: customConfig.isOnlineAvailable,
      isInPerson: customConfig.isInPerson,
      locationId: customConfig.locationId,
      source: 'custom' as const,
    };
  }

  // Fallback to service defaults
  const service = provider.services?.find((s: any) => s.id === serviceId);
  
  if (service) {
    return {
      duration: service.defaultDuration,
      price: service.defaultPrice,
      isOnlineAvailable: true, // Default assumption for service without config
      isInPerson: false, // Default assumption for service without config
      locationId: null,
      source: 'default' as const,
    };
  }

  // Service not found
  return null;
}

/**
 * Gets all service configurations for a provider with fallbacks
 * @param provider Provider with services and serviceConfigs
 * @returns Array of service configurations with fallbacks applied
 */
export function getAllServiceConfigs(provider: any) {
  if (!provider.services) return [];

  return provider.services.map((service: any) => {
    const config = getServiceConfig(provider, service.id);
    return {
      serviceId: service.id,
      service,
      ...config,
    };
  });
}
