import { AvailabilityStatus, SlotStatus } from '@/features/calendar/types/types';
import { prisma } from '@/lib/prisma';

export interface ServiceFilterParams {
  serviceTypeIds?: string[]; // Service type IDs (e.g., "consultation", "imaging")
  serviceIds?: string[]; // Specific service IDs
  serviceNames?: string[]; // Service names for text-based filtering
  serviceCategories?: string[]; // Service categories
  providerTypeIds?: string[]; // Healthcare provider types
  specializations?: string[]; // Provider specializations
  priceRange?: {
    min?: number;
    max?: number;
  };
  durationRange?: {
    min?: number; // minutes
    max?: number; // minutes
  };
  excludeServices?: string[]; // Service IDs to exclude
  includeInactive?: boolean; // Include inactive services (default: false)
}

export interface ServiceResult {
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  serviceCategory?: string;
  serviceType: {
    id: string;
    name: string;
    category?: string;
  };
  provider: {
    id: string;
    name: string;
    type: string;
    specialization?: string;
  };
  pricing: {
    price: number;
    showPrice: boolean;
    defaultDuration: number;
    minDuration?: number;
    maxDuration?: number;
  };
  availability: {
    hasSlots: boolean;
    nextAvailableSlot?: Date;
    totalSlots: number;
    locations: Array<{
      locationId?: string;
      locationName?: string;
      isOnline: boolean;
    }>;
  };
  rating?: number;
  reviewCount?: number;
}

export interface ServiceFilterResult {
  services: ServiceResult[];
  totalCount: number;
  serviceTypes: Array<{
    id: string;
    name: string;
    count: number;
    category?: string;
  }>;
  providerTypes: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  durationRange: {
    min: number;
    max: number;
    average: number;
  };
  categories: Array<{
    name: string;
    count: number;
    services: string[];
  }>;
}

/**
 * Service for filtering and searching by service types and characteristics
 */
export class ServiceFilterService {
  /**
   * Filter services based on criteria
   */
  async filterServices(
    params: ServiceFilterParams,
    additionalFilters?: {
      providerId?: string;
      locationId?: string;
      dateRange?: {
        startDate: Date;
        endDate: Date;
      };
    }
  ): Promise<ServiceFilterResult> {
    try {
      const {
        serviceTypeIds,
        serviceIds,
        serviceNames,
        serviceCategories,
        providerTypeIds,
        specializations,
        priceRange,
        durationRange,
        excludeServices = [],
        includeInactive = false,
      } = params;

      // Build the where clause for service configs
      const whereClause: any = {
        isActive: includeInactive ? undefined : true,
        provider: {
          status: 'ACTIVE',
          ...(providerTypeIds && providerTypeIds.length > 0
            ? {
                typeAssignments: {
                  some: {
                    providerTypeId: { in: providerTypeIds },
                  },
                },
              }
            : {}),
          ...(additionalFilters?.providerId ? { id: additionalFilters.providerId } : {}),
        },
        service: {
          ...(serviceIds && serviceIds.length > 0 ? { id: { in: serviceIds } } : {}),
          ...(serviceNames && serviceNames.length > 0
            ? {
                name: {
                  in: serviceNames,
                  mode: 'insensitive' as const,
                },
              }
            : {}),
          ...(excludeServices.length > 0 ? { id: { notIn: excludeServices } } : {}),
        },
        ...(priceRange
          ? {
              price: {
                ...(priceRange.min !== undefined ? { gte: priceRange.min } : {}),
                ...(priceRange.max !== undefined ? { lte: priceRange.max } : {}),
              },
            }
          : {}),
        ...(durationRange
          ? {
              defaultDuration: {
                ...(durationRange.min !== undefined ? { gte: durationRange.min } : {}),
                ...(durationRange.max !== undefined ? { lte: durationRange.max } : {}),
              },
            }
          : {}),
        ...(additionalFilters?.locationId ? { locationId: additionalFilters.locationId } : {}),
      };

      // Get service configurations with all related data
      const serviceConfigs = await prisma.serviceAvailabilityConfig.findMany({
        where: whereClause,
        include: {
          service: true,
          provider: {
            include: {
              user: true,
              typeAssignments: {
                include: {
                  providerType: true,
                },
              },
              availabilities: {
                where: {
                  status: AvailabilityStatus.ACCEPTED,
                  ...(additionalFilters?.dateRange
                    ? {
                        startTime: { gte: additionalFilters.dateRange.startDate },
                        endTime: { lte: additionalFilters.dateRange.endDate },
                      }
                    : {}),
                },
                include: {
                  calculatedSlots: {
                    where: {
                      status: SlotStatus.AVAILABLE,
                      ...(additionalFilters?.dateRange
                        ? {
                            startTime: { gte: additionalFilters.dateRange.startDate },
                            endTime: { lte: additionalFilters.dateRange.endDate },
                          }
                        : {}),
                    },
                    orderBy: {
                      startTime: 'asc',
                    },
                    take: 1, // Just get the next available slot
                  },
                  location: true,
                },
              },
            },
          },
          location: true,
        },
        orderBy: [{ service: { name: 'asc' } }, { provider: { user: { name: 'asc' } } }],
      });

      // Filter by service categories if specified
      let filteredConfigs = serviceConfigs;
      if (serviceCategories && serviceCategories.length > 0) {
        filteredConfigs = serviceConfigs.filter((config) =>
          serviceCategories.some(
            (category) =>
              config.service.name.toLowerCase().includes(category.toLowerCase()) ||
              config.provider.typeAssignments?.[0]?.providerType?.name
                ?.toLowerCase()
                .includes(category.toLowerCase()) ||
              false
          )
        );
      }

      // Filter by specializations if specified
      if (specializations && specializations.length > 0) {
        filteredConfigs = filteredConfigs.filter((config) =>
          specializations.some(
            (spec) =>
              config.provider.typeAssignments?.[0]?.providerType?.name
                ?.toLowerCase()
                .includes(spec.toLowerCase()) || false
          )
        );
      }

      // Convert to service results
      const services: ServiceResult[] = filteredConfigs.map((config) => {
        // Get all slots for this service/provider combination
        const allSlots = config.provider.availabilities
          .flatMap((avail) => avail.calculatedSlots)
          .filter((slot) => slot.serviceId === config.serviceId);

        const nextSlot = allSlots[0];

        // Get all locations for this service
        const locations = Array.from(
          new Map(
            config.provider.availabilities
              .filter((avail) =>
                avail.calculatedSlots.some((slot) => slot.serviceId === config.serviceId)
              )
              .map((avail) => [
                avail.locationId || 'online',
                {
                  locationId: avail.locationId || undefined,
                  locationName:
                    avail.location?.name || (avail.isOnlineAvailable ? 'Online' : 'Unknown'),
                  isOnline: avail.isOnlineAvailable || !avail.locationId,
                },
              ])
          ).values()
        );

        return {
          serviceId: config.service.id,
          serviceName: config.service.name,
          serviceDescription: config.service.description || undefined,
          serviceCategory: this.categorizeService(config.service.name),
          serviceType: {
            id: config.provider.typeAssignments?.[0]?.providerType?.id || 'unknown',
            name: config.provider.typeAssignments?.[0]?.providerType?.name || 'Healthcare Provider',
            category: this.categorizeServiceType(
              config.provider.typeAssignments?.[0]?.providerType?.name || 'Healthcare Provider'
            ),
          },
          provider: {
            id: config.provider.id,
            name: config.provider.user.name || 'Unknown Provider',
            type: config.provider.typeAssignments?.[0]?.providerType?.name || 'Healthcare Provider',
            specialization:
              config.provider.typeAssignments?.[0]?.providerType?.name || 'Healthcare Provider',
          },
          pricing: {
            price: config.price.toNumber(),
            showPrice: config.provider.showPrice, // Use provider-level setting
            defaultDuration: config.duration,
          },
          availability: {
            hasSlots: allSlots.length > 0,
            nextAvailableSlot: nextSlot?.startTime,
            totalSlots: allSlots.length,
            locations,
          },
          rating: 0, // Will come from database
          reviewCount: 0, // Will come from database
        };
      });

      // Calculate aggregated statistics
      const serviceTypeMap = new Map<string, { name: string; count: number; category?: string }>();
      const providerTypeMap = new Map<string, { name: string; count: number }>();
      const categoryMap = new Map<string, { count: number; services: Set<string> }>();

      let totalPrice = 0;
      let totalDuration = 0;
      let minPrice = Infinity;
      let maxPrice = 0;
      let minDuration = Infinity;
      let maxDuration = 0;

      services.forEach((service) => {
        // Service types
        const serviceTypeKey = service.serviceType.id;
        const existingServiceType = serviceTypeMap.get(serviceTypeKey);
        serviceTypeMap.set(serviceTypeKey, {
          name: service.serviceType.name,
          count: (existingServiceType?.count || 0) + 1,
          category: service.serviceType.category,
        });

        // Provider types
        const providerTypeKey = service.provider.id;
        const existingProviderType = providerTypeMap.get(providerTypeKey);
        providerTypeMap.set(providerTypeKey, {
          name: service.provider.type,
          count: (existingProviderType?.count || 0) + 1,
        });

        // Categories
        if (service.serviceCategory) {
          const existingCategory = categoryMap.get(service.serviceCategory);
          categoryMap.set(service.serviceCategory, {
            count: (existingCategory?.count || 0) + 1,
            services: (existingCategory?.services || new Set()).add(service.serviceName),
          });
        }

        // Price and duration statistics
        totalPrice += service.pricing.price;
        minPrice = Math.min(minPrice, service.pricing.price);
        maxPrice = Math.max(maxPrice, service.pricing.price);
      });

      const serviceCount = services.length;

      return {
        services,
        totalCount: serviceCount,
        serviceTypes: Array.from(serviceTypeMap.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          count: data.count,
          category: data.category,
        })),
        providerTypes: Array.from(providerTypeMap.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          count: data.count,
        })),
        priceRange: {
          min: serviceCount > 0 ? minPrice : 0,
          max: serviceCount > 0 ? maxPrice : 0,
          average: serviceCount > 0 ? Math.round(totalPrice / serviceCount) : 0,
        },
        durationRange: {
          min: serviceCount > 0 ? minDuration : 0,
          max: serviceCount > 0 ? maxDuration : 0,
          average: serviceCount > 0 ? Math.round(totalDuration / serviceCount) : 0,
        },
        categories: Array.from(categoryMap.entries()).map(([name, data]) => ({
          name,
          count: data.count,
          services: Array.from(data.services),
        })),
      };
    } catch (error) {
      console.error('Error filtering services:', error);
      return {
        services: [],
        totalCount: 0,
        serviceTypes: [],
        providerTypes: [],
        priceRange: { min: 0, max: 0, average: 0 },
        durationRange: { min: 0, max: 0, average: 0 },
        categories: [],
      };
    }
  }

  /**
   * Get all available service types
   */
  async getAvailableServiceTypes(): Promise<
    Array<{
      id: string;
      name: string;
      description?: string;
      category: string;
      serviceCount: number;
      providerCount: number;
    }>
  > {
    try {
      const serviceTypes = await prisma.service.groupBy({
        by: ['providerTypeId'],
        where: {
          availabilityConfigs: {
            some: {
              provider: {
                status: 'ACTIVE',
              },
            },
          },
        },
        _count: {
          id: true,
        },
      });

      const serviceTypeDetails = await prisma.providerType.findMany({
        where: {
          id: { in: serviceTypes.map((st) => st.providerTypeId) },
        },
        include: {
          services: {
            include: {
              availabilityConfigs: {
                where: {
                  provider: {
                    status: 'ACTIVE',
                  },
                },
                include: {
                  provider: true,
                },
              },
            },
          },
        },
      });

      return serviceTypeDetails.map((serviceType) => {
        const providerIds = new Set(
          serviceType.services.flatMap((service) =>
            service.availabilityConfigs.map((config) => config.providerId)
          )
        );

        return {
          id: serviceType.id,
          name: serviceType.name,
          description: serviceType.description || undefined,
          category: this.categorizeServiceType(serviceType.name),
          serviceCount: serviceType.services.length,
          providerCount: providerIds.size,
        };
      });
    } catch (error) {
      console.error('Error getting available service types:', error);
      return [];
    }
  }

  /**
   * Get services by text search
   */
  async searchServices(
    searchQuery: string,
    filters?: Partial<ServiceFilterParams>
  ): Promise<ServiceFilterResult> {
    try {
      // Split search query into terms
      const searchTerms = searchQuery
        .toLowerCase()
        .split(' ')
        .filter((term) => term.length > 2);

      if (searchTerms.length === 0) {
        return await this.filterServices(filters || {});
      }

      // Find matching services by name or description
      const matchingServices = await prisma.service.findMany({
        where: {
          OR: [
            {
              name: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
            {
              providerType: {
                name: {
                  contains: searchQuery,
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      const serviceIds = matchingServices.map((service) => service.id);

      return await this.filterServices({
        ...filters,
        serviceIds,
      });
    } catch (error) {
      console.error('Error searching services:', error);
      return {
        services: [],
        totalCount: 0,
        serviceTypes: [],
        providerTypes: [],
        priceRange: { min: 0, max: 0, average: 0 },
        durationRange: { min: 0, max: 0, average: 0 },
        categories: [],
      };
    }
  }

  /**
   * Categorize a service name into a broader category
   */
  private categorizeService(serviceName: string): string {
    const name = serviceName.toLowerCase();

    if (name.includes('consultation') || name.includes('appointment') || name.includes('visit')) {
      return 'Consultations';
    }
    if (name.includes('therapy') || name.includes('treatment') || name.includes('session')) {
      return 'Therapy & Treatment';
    }
    if (
      name.includes('test') ||
      name.includes('lab') ||
      name.includes('blood') ||
      name.includes('urine')
    ) {
      return 'Diagnostic Tests';
    }
    if (
      name.includes('x-ray') ||
      name.includes('scan') ||
      name.includes('mri') ||
      name.includes('ct') ||
      name.includes('ultrasound')
    ) {
      return 'Medical Imaging';
    }
    if (name.includes('vaccination') || name.includes('vaccine') || name.includes('immunization')) {
      return 'Vaccinations';
    }
    if (name.includes('surgery') || name.includes('procedure') || name.includes('operation')) {
      return 'Procedures & Surgery';
    }
    if (name.includes('check') || name.includes('screening') || name.includes('exam')) {
      return 'Health Screenings';
    }

    return 'General Services';
  }

  /**
   * Categorize a service type into a broader category
   */
  private categorizeServiceType(serviceTypeName: string): string {
    const name = serviceTypeName.toLowerCase();

    if (name.includes('general') || name.includes('family') || name.includes('primary')) {
      return 'Primary Care';
    }
    if (
      name.includes('specialist') ||
      name.includes('cardio') ||
      name.includes('neuro') ||
      name.includes('ortho')
    ) {
      return 'Specialist Care';
    }
    if (name.includes('mental') || name.includes('psych') || name.includes('therapy')) {
      return 'Mental Health';
    }
    if (name.includes('dental') || name.includes('oral')) {
      return 'Dental Care';
    }
    if (name.includes('physio') || name.includes('rehab') || name.includes('physical')) {
      return 'Rehabilitation';
    }
    if (name.includes('diagnostic') || name.includes('imaging') || name.includes('radiology')) {
      return 'Diagnostics';
    }

    return 'Healthcare Services';
  }
}

/**
 * Filter services based on criteria
 */
export async function filterServices(
  params: ServiceFilterParams,
  additionalFilters?: {
    providerId?: string;
    locationId?: string;
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
  }
): Promise<ServiceFilterResult> {
  const service = new ServiceFilterService();
  return await service.filterServices(params, additionalFilters);
}

/**
 * Get all available service types
 */
export async function getAvailableServiceTypes(): Promise<
  Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    serviceCount: number;
    providerCount: number;
  }>
> {
  const service = new ServiceFilterService();
  return await service.getAvailableServiceTypes();
}

/**
 * Search services by text query
 */
export async function searchServices(
  searchQuery: string,
  filters?: Partial<ServiceFilterParams>
): Promise<ServiceFilterResult> {
  const service = new ServiceFilterService();
  return await service.searchServices(searchQuery, filters);
}
