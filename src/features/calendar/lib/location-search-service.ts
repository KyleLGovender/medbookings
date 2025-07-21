import { Prisma } from '@prisma/client';

import { AvailabilityStatus, SlotStatus } from '@/features/calendar/types/types';
import { prisma } from '@/lib/prisma';

import { optimizedProviderSearch } from './search-performance-service';

export interface LocationSearchParams {
  coordinates: {
    lat: number;
    lng: number;
  };
  maxDistance: number; // in kilometers
  serviceTypes?: string[];
  preferredDate?: Date;
  preferredTime?: string;
  duration?: number;
  isOnlineAvailable?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export interface ProviderLocationResult {
  providerId: string;
  providerName: string;
  providerType: string;
  distance: number; // in kilometers
  coordinates: {
    lat: number;
    lng: number;
  };
  location?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  availableServices: Array<{
    serviceId: string;
    serviceName: string;
    duration: number;
    price: number;
    showPrice: boolean;
  }>;
  nearestAvailableSlot?: {
    slotId: string;
    startTime: Date;
    endTime: Date;
    isOnlineAvailable: boolean;
    price: number;
  };
  totalAvailableSlots: number;
}

/**
 * Service for location-based provider search using geographical distance calculations
 */
export class LocationSearchService {
  /**
   * Calculate the distance between two coordinates using the Haversine formula
   * @param lat1 Latitude of first point
   * @param lng1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lng2 Longitude of second point
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Search for providers within a specified distance from given coordinates
   */
  async searchProvidersByLocation(params: LocationSearchParams): Promise<ProviderLocationResult[]> {
    try {
      const {
        coordinates,
        maxDistance,
        serviceTypes,
        preferredDate,
        preferredTime,
        duration,
        isOnlineAvailable,
        priceRange,
      } = params;

      // Build date range for slot filtering
      let dateStart: Date | undefined;
      let dateEnd: Date | undefined;

      if (preferredDate) {
        dateStart = new Date(preferredDate);
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date(preferredDate);
        dateEnd.setHours(23, 59, 59, 999);
      }

      // Use optimized search service for better performance
      const optimizedResults = await optimizedProviderSearch({
        coordinates,
        maxDistance,
        serviceTypeIds: serviceTypes,
        priceRange,
        dateRange: dateStart && dateEnd ? { startDate: dateStart, endDate: dateEnd } : undefined,
        limit: 50,
      });

      // Convert optimized results to the expected format
      if (optimizedResults.results.length > 0) {
        return optimizedResults.results.map((result) => ({
          providerId: result.providerId,
          providerName: result.providerName,
          providerType: result.providerType,
          distance: result.distance || 0,
          coordinates: result.location?.coordinates || coordinates,
          location: result.location
            ? {
                id: result.location.id || 'unknown',
                name: result.location.name,
                address: result.location.address,
                coordinates: result.location.coordinates || coordinates,
              }
            : undefined,
          availableServices: result.availableServices,
          nearestAvailableSlot: result.nearestAvailableSlot,
          totalAvailableSlots: result.totalAvailableSlots,
        }));
      }

      // Fallback to original implementation for edge cases

      // First, get all providers with their locations and services
      const providers = await prisma.provider.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          user: true,
          typeAssignments: {
            include: {
              providerType: true,
            },
          },
          availabilityConfigs: {
            include: {
              service: true,
              location: true,
            },
            where: {
              ...(serviceTypes && serviceTypes.length > 0
                ? {
                    service: {
                      name: { in: serviceTypes },
                    },
                  }
                : {}),
              ...(priceRange
                ? {
                    price: {
                      ...(priceRange.min ? { gte: priceRange.min } : {}),
                      ...(priceRange.max ? { lte: priceRange.max } : {}),
                    },
                  }
                : {}),
            },
          },
          availabilities: {
            include: {
              location: true,
              calculatedSlots: {
                include: {
                  service: true,
                },
                where: {
                  status: SlotStatus.AVAILABLE,
                  ...(dateStart && dateEnd
                    ? {
                        startTime: {
                          gte: dateStart,
                          lte: dateEnd,
                        },
                      }
                    : {}),
                  ...(duration ? { duration: { gte: duration } } : {}),
                  ...(isOnlineAvailable !== undefined ? { isOnlineAvailable } : {}),
                },
              },
            },
            where: {
              status: AvailabilityStatus.ACCEPTED,
            },
          },
        },
      });

      const results: ProviderLocationResult[] = [];

      for (const provider of providers) {
        // Get all unique locations for this provider
        const providerLocations = new Map<string, any>();

        // Add locations from service configs
        provider.availabilityConfigs.forEach((config) => {
          if (config.location && config.location.coordinates) {
            providerLocations.set(config.location.id, config.location);
          }
        });

        // Add locations from availabilities
        provider.availabilities.forEach((availability) => {
          if (availability.location && availability.location.coordinates) {
            providerLocations.set(availability.location.id, availability.location);
          }
        });

        // Process each location separately
        for (const [locationId, location] of Array.from(providerLocations)) {
          const locationCoords = location.coordinates as {
            lat: number;
            lng: number;
          };

          // Calculate distance from search coordinates
          const distance = this.calculateDistance(
            coordinates.lat,
            coordinates.lng,
            locationCoords.lat,
            locationCoords.lng
          );

          // Skip if outside max distance
          if (distance > maxDistance) {
            continue;
          }

          // Get available services at this location
          const availableServices = provider.availabilityConfigs
            .filter((config) => config.locationId === locationId)
            .map((config) => ({
              serviceId: config.service.id,
              serviceName: config.service.name,
              duration: config.service.defaultDuration,
              price: config.price.toNumber(),
              showPrice: true,
            }));

          // Get available slots at this location
          const availableSlots = provider.availabilities
            .filter((avail) => avail.locationId === locationId)
            .flatMap((avail) => avail.calculatedSlots)
            .filter((slot) => {
              // Apply time filtering if specified
              if (preferredTime) {
                const slotTime = slot.startTime.toTimeString().substring(0, 5);
                const preferredTimeObj = new Date(`2000-01-01T${preferredTime}:00`);
                const slotTimeObj = new Date(`2000-01-01T${slotTime}:00`);
                const timeDiff = Math.abs(slotTimeObj.getTime() - preferredTimeObj.getTime());
                // Allow slots within 2 hours of preferred time
                if (timeDiff > 2 * 60 * 60 * 1000) {
                  return false;
                }
              }

              return true;
            });

          // Find the nearest available slot
          const nearestSlot = availableSlots.sort(
            (a, b) => a.startTime.getTime() - b.startTime.getTime()
          )[0];

          // Only include providers with available services or slots
          if (availableServices.length > 0 || availableSlots.length > 0) {
            results.push({
              providerId: provider.id,
              providerName: provider.user.name || 'Unknown Provider',
              providerType: provider.typeAssignments?.[0]?.providerType?.name || 'Healthcare Provider',
              distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
              coordinates: locationCoords,
              location: {
                id: location.id,
                name: location.name,
                address: location.address,
                coordinates: locationCoords,
              },
              availableServices,
              nearestAvailableSlot: nearestSlot
                ? {
                    slotId: nearestSlot.id,
                    startTime: nearestSlot.startTime,
                    endTime: nearestSlot.endTime,
                    isOnlineAvailable: false, // Default to false for location-based slots
                    price: nearestSlot.service.defaultPrice.toNumber(),
                  }
                : undefined,
              totalAvailableSlots: availableSlots.length,
            });
          }
        }

        // Also handle providers with online-only availability (no physical location)
        const onlineAvailabilities = provider.availabilities.filter(
          (avail) => !avail.locationId && avail.isOnlineAvailable
        );

        if (onlineAvailabilities.length > 0 && isOnlineAvailable !== false) {
          const onlineSlots = onlineAvailabilities
            .flatMap((avail) => avail.calculatedSlots)
            .filter((slot) => {
              if (preferredTime) {
                const slotTime = slot.startTime.toTimeString().substring(0, 5);
                const preferredTimeObj = new Date(`2000-01-01T${preferredTime}:00`);
                const slotTimeObj = new Date(`2000-01-01T${slotTime}:00`);
                const timeDiff = Math.abs(slotTimeObj.getTime() - preferredTimeObj.getTime());
                if (timeDiff > 2 * 60 * 60 * 1000) {
                  return false;
                }
              }
              return true;
            });

          const onlineServices = provider.availabilityConfigs
            .filter((config) => !config.locationId)
            .map((config) => ({
              serviceId: config.service.id,
              serviceName: config.service.name,
              duration: config.service.defaultDuration,
              price: config.price.toNumber(),
              showPrice: true,
            }));

          const nearestOnlineSlot = onlineSlots.sort(
            (a, b) => a.startTime.getTime() - b.startTime.getTime()
          )[0];

          if (onlineServices.length > 0 || onlineSlots.length > 0) {
            results.push({
              providerId: provider.id,
              providerName: provider.user.name || 'Unknown Provider',
              providerType: provider.typeAssignments?.[0]?.providerType?.name || 'Healthcare Provider',
              distance: 0, // Online services have no distance
              coordinates: coordinates, // Use search coordinates for online providers
              location: undefined, // No physical location
              availableServices: onlineServices,
              nearestAvailableSlot: nearestOnlineSlot
                ? {
                    slotId: nearestOnlineSlot.id,
                    startTime: nearestOnlineSlot.startTime,
                    endTime: nearestOnlineSlot.endTime,
                    isOnlineAvailable: true,
                    price: nearestOnlineSlot.service.defaultPrice.toNumber(),
                  }
                : undefined,
              totalAvailableSlots: onlineSlots.length,
            });
          }
        }
      }

      // Sort results by distance (online providers first with distance 0)
      return results.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error searching providers by location:', error);
      return [];
    }
  }

  /**
   * Get nearby locations within a radius
   */
  async getNearbyLocations(
    coordinates: { lat: number; lng: number },
    maxDistance: number
  ): Promise<
    Array<{
      locationId: string;
      name: string;
      address: string;
      coordinates: { lat: number; lng: number };
      distance: number;
      providerCount: number;
    }>
  > {
    try {
      const locations = await prisma.location.findMany({
        where: {
          coordinates: {
            not: Prisma.DbNull,
          },
        },
      });

      const nearbyLocations = locations
        .map((location) => {
          const locationCoords = location.coordinates as {
            lat: number;
            lng: number;
          };

          const distance = this.calculateDistance(
            coordinates.lat,
            coordinates.lng,
            locationCoords.lat,
            locationCoords.lng
          );

          return {
            locationId: location.id,
            name: location.name,
            address: location.formattedAddress,
            coordinates: locationCoords,
            distance: Math.round(distance * 10) / 10,
            providerCount: 0, // TODO: Implement proper count query
          };
        })
        .filter((location) => location.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);

      return nearbyLocations;
    } catch (error) {
      console.error('Error getting nearby locations:', error);
      return [];
    }
  }

  /**
   * Geocode an address string to coordinates
   * In production, this would integrate with Google Maps Geocoding API
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const normalizedAddress = address.toLowerCase().trim();

      // TODO: Implement actual geocoding service integration
      // For now, return null to indicate geocoding is not available
      console.warn('Geocoding not implemented - returning null');
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}

/**
 * Search for providers by location with distance filtering
 */
export async function searchProvidersByLocation(
  params: LocationSearchParams
): Promise<ProviderLocationResult[]> {
  const service = new LocationSearchService();
  return await service.searchProvidersByLocation(params);
}

/**
 * Get nearby locations within a radius
 */
export async function getNearbyLocations(
  coordinates: { lat: number; lng: number },
  maxDistance: number
): Promise<
  Array<{
    locationId: string;
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
    distance: number;
    providerCount: number;
  }>
> {
  const service = new LocationSearchService();
  return await service.getNearbyLocations(coordinates, maxDistance);
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const service = new LocationSearchService();
  return await service.geocodeAddress(address);
}
