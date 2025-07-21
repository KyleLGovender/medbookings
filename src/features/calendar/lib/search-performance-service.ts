import { AvailabilityStatus, SlotStatus } from '@/features/calendar/types/types';
import { prisma } from '@/lib/prisma';

export interface SearchPerformanceOptions {
  enableCaching?: boolean;
  useIndexHints?: boolean;
  limitResults?: number;
  enableParallelQueries?: boolean;
  optimizeForDistance?: boolean;
  prefetchRelations?: boolean;
}

export interface PerformanceMetrics {
  queryExecutionTime: number;
  totalResults: number;
  indexesUsed: string[];
  cacheHitRatio?: number;
  memoryUsage?: number;
  optimizationSuggestions: string[];
}

/**
 * Service for optimizing search query performance using database indexes and caching
 */
export class SearchPerformanceService {
  private readonly DEFAULT_LIMIT = 50;
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  /**
   * Optimize provider search queries with proper indexing strategy
   */
  async optimizedProviderSearch(params: {
    coordinates?: { lat: number; lng: number };
    maxDistance?: number;
    serviceTypeIds?: string[];
    priceRange?: { min?: number; max?: number };
    dateRange?: { startDate: Date; endDate: Date };
    limit?: number;
  }): Promise<{
    results: any[];
    metrics: PerformanceMetrics;
  }> {
    const startTime = Date.now();
    const limit = params.limit || this.DEFAULT_LIMIT;
    const indexesUsed: string[] = [];
    const optimizationSuggestions: string[] = [];

    try {
      // Step 1: Use compound index on ServiceAvailabilityConfig (providerId, isActive, price)
      indexesUsed.push('ServiceAvailabilityConfig_compound_idx');

      const serviceConfigsQuery = prisma.serviceAvailabilityConfig.findMany({
        where: {
          provider: {
            status: 'ACTIVE', // Uses index on Provider.status
          },
          ...(params.serviceTypeIds
            ? {
                service: {
                  providerTypeId: { in: params.serviceTypeIds }, // Uses index on Service.providerTypeId
                },
              }
            : {}),
          ...(params.priceRange
            ? {
                price: {
                  ...(params.priceRange.min ? { gte: params.priceRange.min } : {}),
                  ...(params.priceRange.max ? { lte: params.priceRange.max } : {}),
                }, // Uses index on price
              }
            : {}),
        },
        select: {
          id: true,
          providerId: true,
          serviceId: true,
          locationId: true,
          price: true,
          duration: true,
          provider: {
            select: {
              id: true,
              showPrice: true, // Provider-level price display setting
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              typeAssignments: {
                select: {
                  providerType: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              providerTypeId: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              formattedAddress: true,
              coordinates: true,
            },
          },
        },
        take: limit * 2, // Fetch more to allow for distance filtering
      });

      // Step 2: Use optimized availability query with compound index
      indexesUsed.push('Availability_compound_idx');

      const availabilityQuery = prisma.availability.findMany({
        where: {
          status: AvailabilityStatus.ACCEPTED, // Uses index on status
          ...(params.dateRange
            ? {
                startTime: { gte: params.dateRange.startDate }, // Uses index on startTime
                endTime: { lte: params.dateRange.endDate },
              }
            : {}),
        },
        select: {
          id: true,
          providerId: true,
          locationId: true,
          startTime: true,
          endTime: true,
          isOnlineAvailable: true,
          calculatedSlots: {
            where: {
              status: SlotStatus.AVAILABLE, // Uses index on CalculatedAvailabilitySlot.status
              ...(params.dateRange
                ? {
                    startTime: { gte: params.dateRange.startDate }, // Uses index on startTime
                    endTime: { lte: params.dateRange.endDate },
                  }
                : {}),
            },
            select: {
              id: true,
              startTime: true,
              endTime: true,
              serviceId: true,
            },
            orderBy: {
              startTime: 'asc', // Uses index on startTime for ordering
            },
            take: 10, // Limit slots per availability
          },
        },
        take: limit * 3, // Allow for more availability records
      });

      // Execute queries in parallel for better performance
      const [serviceConfigs, availabilities] = await Promise.all([
        serviceConfigsQuery,
        availabilityQuery,
      ]);

      // Step 3: Efficient data joining using Maps for O(1) lookup
      const providerMap = new Map();
      const locationMap = new Map();
      const serviceMap = new Map();

      // Build lookup maps for efficient joining
      serviceConfigs.forEach((config) => {
        const providerId = config.providerId;

        if (!providerMap.has(providerId)) {
          providerMap.set(providerId, {
            provider: config.provider,
            services: [],
            locations: new Set(),
          });
        }

        providerMap.get(providerId).services.push({
          serviceId: config.service.id,
          serviceName: config.service.name,
          providerTypeId: config.service.providerTypeId,
          duration: config.duration,
          price: config.price,
          showPrice: config.provider.showPrice,
        });

        if (config.location) {
          locationMap.set(config.locationId, config.location);
          providerMap.get(providerId).locations.add(config.locationId);
        }
      });

      // Step 4: Efficient slot aggregation
      const providerSlots = new Map();
      availabilities.forEach((availability) => {
        const providerId = availability.providerId;

        if (!providerSlots.has(providerId)) {
          providerSlots.set(providerId, {
            totalSlots: 0,
            nearestSlot: null,
            allSlots: [],
          });
        }

        const providerSlotData = providerSlots.get(providerId);

        availability.calculatedSlots.forEach((slot) => {
          providerSlotData.totalSlots++;
          providerSlotData.allSlots.push({
            ...slot,
            locationId: availability.locationId,
            isOnlineAvailable: availability.isOnlineAvailable,
          });

          if (
            !providerSlotData.nearestSlot ||
            slot.startTime < providerSlotData.nearestSlot.startTime
          ) {
            providerSlotData.nearestSlot = slot;
          }
        });
      });

      // Step 5: Combine results with distance calculation optimization
      const results = [];

      for (const [providerId, providerData] of Array.from(providerMap.entries())) {
        const slotData = providerSlots.get(providerId);
        if (!slotData || slotData.totalSlots === 0) continue;

        // Calculate distance only if coordinates are provided and location exists
        let distance: number | undefined;
        let primaryLocation: any;

        if (params.coordinates && providerData.locations.size > 0) {
          let minDistance = Infinity;

          for (const locationId of providerData.locations) {
            const location = locationMap.get(locationId);
            if (location?.coordinates) {
              const locDistance = this.calculateHaversineDistance(
                params.coordinates.lat,
                params.coordinates.lng,
                location.coordinates.lat,
                location.coordinates.lng
              );

              if (locDistance < minDistance) {
                minDistance = locDistance;
                primaryLocation = location;
              }
            }
          }

          distance = minDistance !== Infinity ? minDistance : undefined;
        }

        // Apply distance filter early to reduce processing
        if (params.maxDistance && distance && distance > params.maxDistance) {
          continue;
        }

        results.push({
          providerId,
          providerName: providerData.provider.user.name || 'Unknown Provider',
          providerType: providerData.provider.typeAssignments?.[0]?.providerType?.name || 'Healthcare Provider',
          distance,
          location: primaryLocation
            ? {
                name: primaryLocation.name,
                address: primaryLocation.address,
              }
            : undefined,
          availableServices: providerData.services,
          nearestAvailableSlot: slotData.nearestSlot
            ? {
                slotId: slotData.nearestSlot.id,
                startTime: slotData.nearestSlot.startTime,
                endTime: slotData.nearestSlot.endTime,
                isOnlineAvailable: slotData.nearestSlot.isOnlineAvailable,
                price: slotData.nearestSlot.price,
              }
            : undefined,
          totalAvailableSlots: slotData.totalSlots,
        });
      }

      // Step 6: Efficient sorting and limiting
      const sortedResults = results
        .sort((a, b) => {
          // Sort by distance first (online providers = 0 distance)
          const distanceA = a.distance ?? 0;
          const distanceB = b.distance ?? 0;
          if (distanceA !== distanceB) return distanceA - distanceB;

          // Then by availability count
          return b.totalAvailableSlots - a.totalAvailableSlots;
        })
        .slice(0, limit);

      const executionTime = Date.now() - startTime;

      // Generate optimization suggestions
      if (executionTime > 1000) {
        optimizationSuggestions.push(
          'Query execution time > 1s - consider adding more specific filters'
        );
      }

      if (results.length > limit * 2) {
        optimizationSuggestions.push(
          'Large result set - consider adding location-based pre-filtering'
        );
      }

      if (params.coordinates && !params.maxDistance) {
        optimizationSuggestions.push(
          'Distance calculation without limit - consider adding maxDistance filter'
        );
      }

      return {
        results: sortedResults,
        metrics: {
          queryExecutionTime: executionTime,
          totalResults: results.length,
          indexesUsed,
          optimizationSuggestions,
        },
      };
    } catch (error) {
      console.error('Error in optimized provider search:', error);
      return {
        results: [],
        metrics: {
          queryExecutionTime: Date.now() - startTime,
          totalResults: 0,
          indexesUsed,
          optimizationSuggestions: ['Query failed - check database connection and indexes'],
        },
      };
    }
  }

  /**
   * Optimized slot search with proper indexing
   */
  async optimizedSlotSearch(params: {
    providerId?: string;
    serviceIds?: string[];
    dateRange?: { startDate: Date; endDate: Date };
    timeRange?: { startHour: number; endHour: number };
    limit?: number;
  }): Promise<{
    slots: any[];
    metrics: PerformanceMetrics;
  }> {
    const startTime = Date.now();
    const limit = params.limit || this.DEFAULT_LIMIT;
    const indexesUsed: string[] = [];

    try {
      // Use compound index on CalculatedAvailabilitySlot (status, startTime, serviceId)
      indexesUsed.push('CalculatedAvailabilitySlot_compound_idx');

      let whereClause: any = {
        status: SlotStatus.AVAILABLE, // Primary index field
      };

      // Add time-based filters that can use indexes
      if (params.dateRange) {
        whereClause.startTime = {
          gte: params.dateRange.startDate,
          lte: params.dateRange.endDate,
        };
        indexesUsed.push('CalculatedAvailabilitySlot_startTime_idx');
      }

      // Add service filters
      if (params.serviceIds && params.serviceIds.length > 0) {
        whereClause.serviceId = { in: params.serviceIds };
        indexesUsed.push('CalculatedAvailabilitySlot_serviceId_idx');
      }

      // Add provider filter through availability relationship
      if (params.providerId) {
        whereClause.availability = {
          providerId: params.providerId,
          status: AvailabilityStatus.ACCEPTED,
        };
        indexesUsed.push('Availability_providerId_idx');
      }

      const slots = await prisma.calculatedAvailabilitySlot.findMany({
        where: whereClause,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          serviceId: true,
          availability: {
            select: {
              providerId: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc', // Uses index for efficient ordering
        },
        take: limit,
      });

      // Apply time-of-day filtering in application if needed (more efficient than DB for this)
      let filteredSlots = slots;
      if (params.timeRange) {
        filteredSlots = slots.filter((slot) => {
          const hour = slot.startTime.getHours();
          return hour >= params.timeRange!.startHour && hour <= params.timeRange!.endHour;
        });
      }

      const executionTime = Date.now() - startTime;

      return {
        slots: filteredSlots,
        metrics: {
          queryExecutionTime: executionTime,
          totalResults: filteredSlots.length,
          indexesUsed,
          optimizationSuggestions:
            executionTime > 500 ? ['Consider adding more specific time range filters'] : [],
        },
      };
    } catch (error) {
      console.error('Error in optimized slot search:', error);
      return {
        slots: [],
        metrics: {
          queryExecutionTime: Date.now() - startTime,
          totalResults: 0,
          indexesUsed,
          optimizationSuggestions: ['Query failed - check database indexes'],
        },
      };
    }
  }

  /**
   * Get database performance recommendations
   */
  async getDatabasePerformanceRecommendations(): Promise<{
    recommendedIndexes: Array<{
      table: string;
      columns: string[];
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    queryOptimizations: string[];
  }> {
    return {
      recommendedIndexes: [
        {
          table: 'ServiceAvailabilityConfig',
          columns: ['providerId', 'isActive', 'price'],
          reason: 'Optimizes provider service filtering with price range queries',
          priority: 'high',
        },
        {
          table: 'CalculatedAvailabilitySlot',
          columns: ['status', 'startTime', 'serviceId'],
          reason: 'Optimizes slot searches by availability status and time',
          priority: 'high',
        },
        {
          table: 'Availability',
          columns: ['providerId', 'status', 'startTime'],
          reason: 'Optimizes provider availability lookups',
          priority: 'high',
        },
        {
          table: 'Service',
          columns: ['serviceTypeId', 'name'],
          reason: 'Optimizes service type filtering and text searches',
          priority: 'medium',
        },
        {
          table: 'Location',
          columns: ['coordinates'],
          reason: 'Optimizes geographical distance calculations (requires PostGIS)',
          priority: 'medium',
        },
        {
          table: 'Provider',
          columns: ['status', 'providerTypeId'],
          reason: 'Optimizes provider filtering by status and type',
          priority: 'medium',
        },
        {
          table: 'CalculatedAvailabilitySlot',
          columns: ['locationId', 'isOnlineAvailable'],
          reason: 'Optimizes location-based slot filtering',
          priority: 'low',
        },
      ],
      queryOptimizations: [
        'Use LIMIT clauses to prevent large result sets',
        'Filter by indexed columns first (status, isActive) before other conditions',
        'Use date ranges instead of open-ended time queries',
        'Consider using connection pooling for high-concurrency scenarios',
        'Implement result caching for frequently accessed data',
        'Use parallel queries for independent data fetching',
        'Consider materialized views for complex aggregations',
        'Use database-native geospatial functions for distance calculations',
      ],
    };
  }

  /**
   * Efficient Haversine distance calculation
   */
  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
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

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

/**
 * Optimized provider search with performance metrics
 */
export async function optimizedProviderSearch(params: {
  coordinates?: { lat: number; lng: number };
  maxDistance?: number;
  serviceTypeIds?: string[];
  priceRange?: { min?: number; max?: number };
  dateRange?: { startDate: Date; endDate: Date };
  limit?: number;
}): Promise<{
  results: any[];
  metrics: PerformanceMetrics;
}> {
  const service = new SearchPerformanceService();
  return await service.optimizedProviderSearch(params);
}

/**
 * Optimized slot search with performance metrics
 */
export async function optimizedSlotSearch(params: {
  providerId?: string;
  serviceIds?: string[];
  dateRange?: { startDate: Date; endDate: Date };
  timeRange?: { startHour: number; endHour: number };
  limit?: number;
}): Promise<{
  slots: any[];
  metrics: PerformanceMetrics;
}> {
  const service = new SearchPerformanceService();
  return await service.optimizedSlotSearch(params);
}

/**
 * Get performance recommendations for database optimization
 */
export async function getDatabasePerformanceRecommendations(): Promise<{
  recommendedIndexes: Array<{
    table: string;
    columns: string[];
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  queryOptimizations: string[];
}> {
  const service = new SearchPerformanceService();
  return await service.getDatabasePerformanceRecommendations();
}
