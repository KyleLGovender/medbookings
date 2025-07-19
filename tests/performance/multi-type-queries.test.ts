/**
 * Performance tests for complex multi-type queries
 * Tests query performance with realistic data volumes and complex filtering
 */

import { searchProviders, getProvidersByType, getProviderTypeStats } from '../../src/features/providers/lib/search';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock cache to disable during performance tests
jest.mock('../../src/lib/cache', () => ({
  generateSearchCacheKey: jest.fn(() => 'test-key'),
  getCachedProviderSearch: jest.fn((key, fetcher) => fetcher()),
  getCachedProvidersByType: jest.fn((key, fetcher) => fetcher()),
  getCachedProviderTypeStats: jest.fn((fetcher) => fetcher()),
}));

const mockPrisma = {
  serviceProvider: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  serviceProviderTypeAssignment: {
    groupBy: jest.fn(),
  },
  serviceProviderType: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Generate mock data
function generateMockProviders(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `provider-${i}`,
    name: `Dr. Provider ${i}`,
    bio: `Bio for provider ${i}`,
    email: `provider${i}@example.com`,
    status: 'APPROVED',
    typeAssignments: [
      {
        id: `assignment-${i}-1`,
        serviceProviderTypeId: `type-${i % 5}`, // Distribute across 5 types
        serviceProviderType: {
          id: `type-${i % 5}`,
          name: `Provider Type ${i % 5}`,
          description: `Description for type ${i % 5}`,
        },
      },
      // Some providers have multiple types
      ...(i % 3 === 0 ? [{
        id: `assignment-${i}-2`,
        serviceProviderTypeId: `type-${(i + 1) % 5}`,
        serviceProviderType: {
          id: `type-${(i + 1) % 5}`,
          name: `Provider Type ${(i + 1) % 5}`,
          description: `Description for type ${(i + 1) % 5}`,
        },
      }] : []),
    ],
    services: [
      {
        id: `service-${i}`,
        name: `Service ${i}`,
        defaultPrice: 100 + (i * 10),
        defaultDuration: 30,
      },
    ],
    user: {
      email: `provider${i}@example.com`,
    },
  }));
}

function generateMockProviderTypes(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `type-${i}`,
    name: `Provider Type ${i}`,
    description: `Description for type ${i}`,
  }));
}

describe('Multi-Type Query Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Large Dataset Search Performance', () => {
    it('should handle search across 10,000 providers efficiently', async () => {
      const largeProviderSet = generateMockProviders(10000);
      (mockPrisma.serviceProvider.findMany as jest.Mock).mockResolvedValue(largeProviderSet.slice(0, 50));
      (mockPrisma.serviceProvider.count as jest.Mock).mockResolvedValue(10000);

      const startTime = process.hrtime.bigint();
      
      const result = await searchProviders({
        search: 'Dr',
        typeIds: ['type-1', 'type-2'],
        limit: 50,
        offset: 0,
      });
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.providers).toHaveLength(50);
      expect(result.pagination.total).toBe(10000);
      expect(durationMs).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle complex multi-type filtering efficiently', async () => {
      const complexProviderSet = generateMockProviders(5000);
      (mockPrisma.serviceProvider.findMany as jest.Mock).mockResolvedValue(complexProviderSet.slice(0, 20));
      (mockPrisma.serviceProvider.count as jest.Mock).mockResolvedValue(5000);

      const startTime = process.hrtime.bigint();
      
      const result = await searchProviders({
        search: 'Provider',
        typeIds: ['type-0', 'type-1', 'type-2', 'type-3', 'type-4'], // All 5 types
        status: 'APPROVED',
        limit: 20,
        offset: 100,
        includeServices: true,
        includeRequirements: false,
      });
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.providers).toHaveLength(20);
      expect(durationMs).toBeLessThan(150); // Should complete within 150ms
    });

    it('should handle deep pagination efficiently', async () => {
      const paginationSet = generateMockProviders(100);
      (mockPrisma.serviceProvider.findMany as jest.Mock).mockResolvedValue(paginationSet);
      (mockPrisma.serviceProvider.count as jest.Mock).mockResolvedValue(50000);

      const startTime = process.hrtime.bigint();
      
      const result = await searchProviders({
        limit: 100,
        offset: 49900, // Very deep pagination
      });
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.providers).toHaveLength(100);
      expect(result.pagination.hasMore).toBe(false);
      expect(durationMs).toBeLessThan(200); // Should complete within 200ms even with deep pagination
    });
  });

  describe('Provider Type Statistics Performance', () => {
    it('should calculate statistics for many provider types efficiently', async () => {
      const statsData = Array.from({ length: 20 }, (_, i) => ({
        serviceProviderTypeId: `type-${i}`,
        _count: { serviceProviderId: 50 + i * 10 },
      }));

      const typeData = generateMockProviderTypes(20);

      (mockPrisma.serviceProviderTypeAssignment.groupBy as jest.Mock).mockResolvedValue(statsData);
      (mockPrisma.serviceProviderType.findMany as jest.Mock).mockResolvedValue(typeData);

      const startTime = process.hrtime.bigint();
      
      const result = await getProviderTypeStats();
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result).toHaveLength(20);
      expect(result[0]).toHaveProperty('typeId');
      expect(result[0]).toHaveProperty('typeName');
      expect(result[0]).toHaveProperty('count');
      expect(durationMs).toBeLessThan(50); // Should complete within 50ms
    });
  });

  describe('Provider by Type Lookup Performance', () => {
    it('should retrieve providers by type efficiently', async () => {
      const typeProviders = generateMockProviders(500).filter((_, i) => i % 5 === 0); // Every 5th provider
      (mockPrisma.serviceProvider.findMany as jest.Mock).mockResolvedValue(typeProviders.slice(0, 10));

      const startTime = process.hrtime.bigint();
      
      const result = await getProvidersByType('type-0', 10);
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result).toHaveLength(10);
      expect(durationMs).toBeLessThan(30); // Should complete within 30ms
    });
  });

  describe('Concurrent Query Performance', () => {
    it('should handle multiple concurrent searches efficiently', async () => {
      const mockData = generateMockProviders(1000);
      (mockPrisma.serviceProvider.findMany as jest.Mock).mockResolvedValue(mockData.slice(0, 20));
      (mockPrisma.serviceProvider.count as jest.Mock).mockResolvedValue(1000);

      const startTime = process.hrtime.bigint();
      
      // Simulate 10 concurrent searches
      const searchPromises = Array.from({ length: 10 }, (_, i) =>
        searchProviders({
          search: `search-${i}`,
          typeIds: [`type-${i % 5}`],
          limit: 20,
          offset: i * 20,
        })
      );

      const results = await Promise.all(searchPromises);
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.providers).toHaveLength(20);
      });
      expect(durationMs).toBeLessThan(500); // All 10 searches should complete within 500ms
    });

    it('should handle mixed query types concurrently', async () => {
      // Setup different mock responses for different query types
      (mockPrisma.serviceProvider.findMany as jest.Mock)
        .mockResolvedValueOnce(generateMockProviders(50).slice(0, 20)) // Search query
        .mockResolvedValueOnce(generateMockProviders(20).slice(0, 10)); // Type lookup

      (mockPrisma.serviceProvider.count as jest.Mock).mockResolvedValue(1000);
      (mockPrisma.serviceProviderTypeAssignment.groupBy as jest.Mock).mockResolvedValue([
        { serviceProviderTypeId: 'type-1', _count: { serviceProviderId: 100 } },
      ]);
      (mockPrisma.serviceProviderType.findMany as jest.Mock).mockResolvedValue([
        { id: 'type-1', name: 'Type 1' },
      ]);

      const startTime = process.hrtime.bigint();
      
      // Run different types of queries concurrently
      const [searchResult, typeResult, statsResult] = await Promise.all([
        searchProviders({ search: 'test', limit: 20 }),
        getProvidersByType('type-1', 10),
        getProviderTypeStats(),
      ]);
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(searchResult.providers).toHaveLength(20);
      expect(typeResult).toHaveLength(10);
      expect(statsResult).toHaveLength(1);
      expect(durationMs).toBeLessThan(200); // All queries should complete within 200ms
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large result sets without excessive memory usage', async () => {
      const largeDataset = generateMockProviders(5000);
      (mockPrisma.serviceProvider.findMany as jest.Mock).mockResolvedValue(largeDataset);
      (mockPrisma.serviceProvider.count as jest.Mock).mockResolvedValue(5000);

      const initialMemory = process.memoryUsage().heapUsed;
      
      const result = await searchProviders({
        limit: 5000, // Request all data
        offset: 0,
      });
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result.providers).toHaveLength(5000);
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Should use less than 100MB additional memory
    });
  });

  describe('Query Complexity Performance', () => {
    it('should handle complex WHERE clauses efficiently', async () => {
      const complexData = generateMockProviders(2000);
      (mockPrisma.serviceProvider.findMany as jest.Mock).mockResolvedValue(complexData.slice(0, 50));
      (mockPrisma.serviceProvider.count as jest.Mock).mockResolvedValue(2000);

      const startTime = process.hrtime.bigint();
      
      // Complex search with all possible filters
      const result = await searchProviders({
        search: 'Dr Specialist Expert', // Multi-word search
        typeIds: ['type-1', 'type-2', 'type-3'], // Multiple type filters
        status: 'APPROVED',
        limit: 50,
        offset: 500,
        includeServices: true,
        includeRequirements: true, // Include all related data
      });
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.providers).toHaveLength(50);
      expect(durationMs).toBeLessThan(250); // Complex query should complete within 250ms
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty result sets efficiently', async () => {
      (mockPrisma.serviceProvider.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.serviceProvider.count as jest.Mock).mockResolvedValue(0);

      const startTime = process.hrtime.bigint();
      
      const result = await searchProviders({
        search: 'non-existent-term',
        typeIds: ['non-existent-type'],
      });
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.providers).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(durationMs).toBeLessThan(20); // Empty results should be very fast
    });

    it('should handle single character searches efficiently', async () => {
      const singleCharData = generateMockProviders(1000);
      (mockPrisma.serviceProvider.findMany as jest.Mock).mockResolvedValue(singleCharData.slice(0, 50));
      (mockPrisma.serviceProvider.count as jest.Mock).mockResolvedValue(1000);

      const startTime = process.hrtime.bigint();
      
      const result = await searchProviders({
        search: 'D', // Single character - potentially matches many records
        limit: 50,
      });
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.providers).toHaveLength(50);
      expect(durationMs).toBeLessThan(100); // Single char search should complete within 100ms
    });
  });
});