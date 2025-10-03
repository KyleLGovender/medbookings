/**
 * Caching implementation for frequently accessed provider type combinations
 */
import { nowUTC } from '@/lib/timezone';

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expires: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTLMinutes = 15) {
    this.defaultTTL = defaultTTLMinutes * 60 * 1000; // Convert to milliseconds
  }

  set(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL;
    const expires = nowUTC().getTime() + ttl;
    this.cache.set(key, { data, expires });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (nowUTC().getTime() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = nowUTC().getTime();
    this.cache.forEach((entry, key) => {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    });
  }
}

// Cache instances for different data types
export const providerTypeStatsCache = new MemoryCache<
  Array<{ typeId: string; typeName: string; count: number }>
>(30); // 30 min TTL
export const providerSearchCache = new MemoryCache<any>(10); // 10 min TTL for search results
export const providersByTypeCache = new MemoryCache<any>(20); // 20 min TTL

// Cache key generators
export function generateSearchCacheKey(
  search?: string,
  typeIds?: string[],
  status?: string,
  limit?: number,
  offset?: number
): string {
  const params = [
    search || '',
    typeIds?.sort().join(',') || '',
    status || '',
    limit || '',
    offset || '',
  ];
  return `search:${params.join(':')}`;
}

export function generateProvidersByTypeCacheKey(typeId: string, limit: number): string {
  return `providers-by-type:${typeId}:${limit}`;
}

// Cache invalidation helpers
export function invalidateProviderCaches(): void {
  providerTypeStatsCache.clear();
  providerSearchCache.clear();
  providersByTypeCache.clear();
}

export function invalidateProviderTypeCache(typeId?: string): void {
  if (typeId) {
    // Clear specific type-related caches
    providersByTypeCache['cache'].forEach((_, key) => {
      if (key.includes(typeId)) {
        providersByTypeCache.delete(key);
      }
    });
  }

  // Always clear stats cache when provider types change
  providerTypeStatsCache.clear();
}

// Periodic cleanup (run every 5 minutes)
setInterval(
  () => {
    providerTypeStatsCache.cleanup();
    providerSearchCache.cleanup();
    providersByTypeCache.cleanup();
  },
  5 * 60 * 1000
);

// Cached wrapper functions
export async function getCachedProviderTypeStats(
  fetcher: () => Promise<Array<{ typeId: string; typeName: string; count: number }>>
): Promise<Array<{ typeId: string; typeName: string; count: number }>> {
  const cacheKey = 'provider-type-stats';

  // Try to get from cache
  const cached = providerTypeStatsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  providerTypeStatsCache.set(cacheKey, data);

  return data;
}

export async function getCachedProviderSearch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = providerSearchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache with shorter TTL for search results
  providerSearchCache.set(cacheKey, data, 5); // 5 minutes for search results

  return data;
}

export async function getCachedProvidersByType<T>(
  cacheKey: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = providersByTypeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  providersByTypeCache.set(cacheKey, data);

  return data;
}
