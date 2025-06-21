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
    // Serialize availability configs
    ...(provider.availabilityConfigs && {
      availabilityConfigs: provider.availabilityConfigs.map((config: any) => ({
        ...config,
        price: config.price instanceof Decimal ? Number(config.price) : config.price,
        duration: config.duration instanceof Decimal ? Number(config.duration) : config.duration,
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
    // Ensure dates are serialized properly
    createdAt: provider.createdAt?.toISOString(),
    updatedAt: provider.updatedAt?.toISOString(),
  };
}
