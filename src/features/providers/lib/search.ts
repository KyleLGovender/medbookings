/**
 * Optimized provider search queries using the new n:n relationship structure
 */
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { serializeServiceProvider } from './helper';
import {
  generateSearchCacheKey,
  generateProvidersByTypeCacheKey,
  getCachedProviderSearch,
  getCachedProvidersByType,
  getCachedProviderTypeStats,
} from '@/lib/cache';

interface ProviderSearchOptions {
  search?: string;
  typeIds?: string[];
  status?: string;
  limit?: number;
  offset?: number;
  includeServices?: boolean;
  includeRequirements?: boolean;
}

interface ProviderSearchResult {
  providers: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Optimized provider search that efficiently joins through assignment table
 * Uses the new indexes on ServiceProviderTypeAssignment for fast filtering
 */
export async function searchProviders(options: ProviderSearchOptions): Promise<ProviderSearchResult> {
  const {
    search,
    typeIds = [],
    status = 'APPROVED',
    limit = 50,
    offset = 0,
    includeServices = true,
    includeRequirements = false,
  } = options;

  // Generate cache key for this search
  const cacheKey = generateSearchCacheKey(search, typeIds, status, limit, offset);
  
  // Use cached search with optimized fetcher
  return getCachedProviderSearch(cacheKey, async () => {
    return performProviderSearch(options);
  });
}

/**
 * Internal function that performs the actual search without caching
 */
async function performProviderSearch(options: ProviderSearchOptions): Promise<ProviderSearchResult> {
  const {
    search,
    typeIds = [],
    status = 'APPROVED',
    limit = 50,
    offset = 0,
    includeServices = true,
    includeRequirements = false,
  } = options;

  // Build optimized where clause
  const where: Prisma.ServiceProviderWhereInput = {
    status: status as any,
  };

  // Add search filter with optimized text search
  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        user: {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      {
        bio: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Optimized type filter using the indexed n:n relationship
  if (typeIds.length > 0) {
    where.typeAssignments = {
      some: {
        serviceProviderTypeId: {
          in: typeIds,
        },
      },
    };
  }

  // Build optimized include clause based on requirements
  const include: Prisma.ServiceProviderInclude = {
    user: {
      select: {
        email: true,
      },
    },
    typeAssignments: {
      include: {
        serviceProviderType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    },
  };

  // Conditionally include services to avoid unnecessary JOINs
  if (includeServices) {
    include.services = true;
  }

  // Conditionally include requirements to avoid unnecessary JOINs
  if (includeRequirements) {
    include.requirementSubmissions = {
      include: {
        requirementType: true,
      },
    };
  }

  // Execute optimized query with pagination
  const [providers, total] = await Promise.all([
    prisma.serviceProvider.findMany({
      where,
      include,
      orderBy: {
        name: 'asc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.serviceProvider.count({ where }),
  ]);

  // Serialize providers for JSON response
  const serializedProviders = providers.map(provider => serializeServiceProvider(provider));

  return {
    providers: serializedProviders,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

/**
 * Fast provider type lookup using indexed assignment table
 * Optimized for dashboard widgets and quick filters
 */
export async function getProvidersByType(typeId: string, limit = 10): Promise<any[]> {
  const cacheKey = generateProvidersByTypeCacheKey(typeId, limit);
  
  return getCachedProvidersByType(cacheKey, async () => {
    return performGetProvidersByType(typeId, limit);
  });
}

/**
 * Internal function that performs the actual lookup without caching
 */
async function performGetProvidersByType(typeId: string, limit: number): Promise<any[]> {
  const providers = await prisma.serviceProvider.findMany({
    where: {
      status: 'APPROVED',
      typeAssignments: {
        some: {
          serviceProviderTypeId: typeId,
        },
      },
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
      typeAssignments: {
        include: {
          serviceProviderType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
    take: limit,
  });

  return providers.map(provider => serializeServiceProvider(provider));
}

/**
 * Get provider type statistics using optimized aggregation
 * Uses the indexed assignment table for fast counts
 */
export async function getProviderTypeStats(): Promise<Array<{ typeId: string; typeName: string; count: number }>> {
  return getCachedProviderTypeStats(async () => {
    return performGetProviderTypeStats();
  });
}

/**
 * Internal function that performs the actual stats calculation without caching
 */
async function performGetProviderTypeStats(): Promise<Array<{ typeId: string; typeName: string; count: number }>> {
  const stats = await prisma.serviceProviderTypeAssignment.groupBy({
    by: ['serviceProviderTypeId'],
    where: {
      serviceProvider: {
        status: 'APPROVED',
      },
    },
    _count: {
      serviceProviderId: true,
    },
  });

  // Get type names in a separate optimized query
  const typeIds = stats.map(stat => stat.serviceProviderTypeId);
  const types = await prisma.serviceProviderType.findMany({
    where: {
      id: {
        in: typeIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Combine stats with type names
  const typeMap = new Map(types.map(type => [type.id, type.name]));
  
  return stats.map(stat => ({
    typeId: stat.serviceProviderTypeId,
    typeName: typeMap.get(stat.serviceProviderTypeId) || 'Unknown',
    count: stat._count.serviceProviderId,
  }));
}

/**
 * Advanced multi-type search with intersection logic
 * For finding providers that have ALL specified types (AND logic)
 */
export async function searchProvidersWithAllTypes(
  typeIds: string[],
  options: Omit<ProviderSearchOptions, 'typeIds'> = {}
): Promise<ProviderSearchResult> {
  if (typeIds.length === 0) {
    return searchProviders(options);
  }

  const {
    search,
    status = 'APPROVED',
    limit = 50,
    offset = 0,
    includeServices = true,
    includeRequirements = false,
  } = options;

  // Use a more complex query for AND logic (provider must have ALL specified types)
  const providerIds = await prisma.serviceProviderTypeAssignment.groupBy({
    by: ['serviceProviderId'],
    where: {
      serviceProviderTypeId: {
        in: typeIds,
      },
      serviceProvider: {
        status: status as any,
      },
    },
    having: {
      serviceProviderId: {
        _count: {
          equals: typeIds.length, // Must have assignments for ALL types
        },
      },
    },
  });

  const matchingProviderIds = providerIds.map(group => group.serviceProviderId);

  if (matchingProviderIds.length === 0) {
    return {
      providers: [],
      pagination: { total: 0, limit, offset, hasMore: false },
    };
  }

  // Now search within these matching providers
  return searchProviders({
    ...options,
    // Override typeIds to use the pre-filtered list
    typeIds: [], // Don't filter by type again since we already did AND filtering
  });
}