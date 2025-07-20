/**
 * Integration tests for multi-type provider scenarios
 * Tests the complete workflow from registration to approval with multiple provider types
 */

import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Import API handlers
import { GET as searchProviders, POST as createProvider } from '../../src/app/api/providers/route';
import { GET as getProvider } from '../../src/app/api/providers/[id]/route';
import { PUT as updateProviderBasicInfo } from '../../src/app/api/providers/[id]/basic-info/route';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Create mock Prisma client
const mockPrisma = {
  provider: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  providerType: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  providerTypeAssignment: {
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
} as unknown as PrismaClient;

// Test data
const mockProviderTypes = [
  {
    id: 'gp-type-id',
    name: 'General Practitioner',
    description: 'Primary healthcare provider',
  },
  {
    id: 'psych-type-id', 
    name: 'Psychologist',
    description: 'Mental health specialist',
  },
];

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
};

const mockSession = {
  user: mockUser,
};

const mockProvider = {
  id: 'provider-123',
  userId: 'user-123',
  name: 'Dr. Test Provider',
  bio: 'Test provider bio',
  email: 'provider@example.com',
  whatsapp: '+1234567890',
  website: 'https://test.com',
  languages: ['English'],
  status: 'PENDING',
  showPrice: true,
  typeAssignments: [
    {
      id: 'assignment-1',
      providerId: 'provider-123',
      providerTypeId: 'gp-type-id',
      providerType: mockProviderTypes[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'assignment-2',
      providerId: 'provider-123',
      providerTypeId: 'psych-type-id',
      providerType: mockProviderTypes[1],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  services: [],
  requirementSubmissions: [],
  user: mockUser,
};

describe('Multi-Type Provider Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('Provider Registration', () => {
    it('should register provider with multiple types successfully', async () => {
      // Mock user lookup
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock provider creation
      (mockPrisma.provider.create as jest.Mock).mockResolvedValue(mockProvider);

      const requestBody = {
        basicInfo: {
          name: 'Dr. Test Provider',
          bio: 'Test provider bio',
          email: 'provider@example.com',
          whatsapp: '+1234567890',
          languages: ['English'],
        },
        providerTypeIds: ['gp-type-id', 'psych-type-id'],
        services: {
          availableServices: ['service-1'],
        },
        regulatoryRequirements: {
          requirements: [],
        },
      };

      const request = new NextRequest('http://localhost/api/providers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await createProvider(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(mockPrisma.provider.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            typeAssignments: {
              create: [
                { providerTypeId: 'gp-type-id' },
                { providerTypeId: 'psych-type-id' },
              ],
            },
          }),
        })
      );
    });

    it('should handle single provider type for backward compatibility', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.provider.create as jest.Mock).mockResolvedValue({
        ...mockProvider,
        typeAssignments: [mockProvider.typeAssignments[0]], // Only one assignment
      });

      const requestBody = {
        basicInfo: {
          name: 'Dr. Test Provider',
          bio: 'Test provider bio',
          email: 'provider@example.com',
        },
        providerTypeId: 'gp-type-id', // Legacy single type
        services: { availableServices: [] },
        regulatoryRequirements: { requirements: [] },
      };

      const request = new NextRequest('http://localhost/api/providers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await createProvider(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(mockPrisma.provider.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            typeAssignments: {
              create: [{ providerTypeId: 'gp-type-id' }],
            },
          }),
        })
      );
    });

    it('should reject registration without provider types', async () => {
      const requestBody = {
        basicInfo: {
          name: 'Dr. Test Provider',
          email: 'provider@example.com',
        },
        // No providerTypeIds or providerTypeId
        services: { availableServices: [] },
        regulatoryRequirements: { requirements: [] },
      };

      const request = new NextRequest('http://localhost/api/providers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await createProvider(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.error).toContain('At least one provider type is required');
    });
  });

  describe('Provider Search', () => {
    it('should search providers by multiple types', async () => {
      (mockPrisma.provider.findMany as jest.Mock).mockResolvedValue([mockProvider]);
      (mockPrisma.provider.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost/api/providers?typeIds=gp-type-id,psych-type-id&limit=10'
      );

      const response = await searchProviders(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.providers).toHaveLength(1);
      expect(responseBody.providers[0].typeAssignments).toHaveLength(2);
      expect(responseBody.pagination.total).toBe(1);

      expect(mockPrisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            typeAssignments: {
              some: {
                providerTypeId: {
                  in: ['gp-type-id', 'psych-type-id'],
                },
              },
            },
          }),
        })
      );
    });

    it('should search providers by text and filter by types', async () => {
      (mockPrisma.provider.findMany as jest.Mock).mockResolvedValue([mockProvider]);
      (mockPrisma.provider.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost/api/providers?search=Dr&typeIds=gp-type-id&limit=5'
      );

      const response = await searchProviders(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: { contains: 'Dr', mode: 'insensitive' },
              }),
            ]),
            typeAssignments: {
              some: {
                providerTypeId: { in: ['gp-type-id'] },
              },
            },
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      (mockPrisma.provider.findMany as jest.Mock).mockResolvedValue([mockProvider]);
      (mockPrisma.provider.count as jest.Mock).mockResolvedValue(100);

      const request = new NextRequest(
        'http://localhost/api/providers?limit=10&offset=20'
      );

      const response = await searchProviders(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.pagination).toEqual({
        total: 100,
        limit: 10,
        offset: 20,
        hasMore: true,
      });

      expect(mockPrisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe('Provider Details', () => {
    it('should return provider with all type assignments', async () => {
      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);

      const request = new NextRequest('http://localhost/api/providers/provider-123');

      const response = await getProvider(request, { params: { id: 'provider-123' } });
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.id).toBe('provider-123');
      expect(responseBody.typeAssignments).toHaveLength(2);
      expect(responseBody.providerTypes).toHaveLength(2);
      expect(responseBody.providerType).toEqual(mockProviderTypes[0]); // Legacy field
    });

    it('should return 404 for non-existent provider', async () => {
      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/providers/non-existent');

      const response = await getProvider(request, { params: { id: 'non-existent' } });
      const responseBody = await response.json();

      expect(response.status).toBe(404);
      expect(responseBody.error).toContain('not found');
    });
  });

  describe('Provider Updates', () => {
    it('should update provider types successfully', async () => {
      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);
      (mockPrisma.provider.update as jest.Mock).mockResolvedValue({
        ...mockProvider,
        typeAssignments: [mockProvider.typeAssignments[1]], // Only psychologist now
      });

      const formData = new FormData();
      formData.append('id', 'provider-123');
      formData.append('name', 'Updated Name');
      formData.append('providerTypeIds', 'psych-type-id'); // Only one type now

      const request = new NextRequest('http://localhost/api/providers/provider-123/basic-info', {
        method: 'PUT',
        body: formData,
      });

      const response = await updateProviderBasicInfo(request, { params: { id: 'provider-123' } });
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(mockPrisma.provider.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            typeAssignments: {
              deleteMany: {},
              create: [{ providerTypeId: 'psych-type-id' }],
            },
          }),
        })
      );
    });

    it('should handle authorization for provider updates', async () => {
      const unauthorizedProvider = { ...mockProvider, userId: 'different-user' };
      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(unauthorizedProvider);

      const formData = new FormData();
      formData.append('id', 'provider-123');
      formData.append('name', 'Updated Name');

      const request = new NextRequest('http://localhost/api/providers/provider-123/basic-info', {
        method: 'PUT',
        body: formData,
      });

      const response = await updateProviderBasicInfo(request, { params: { id: 'provider-123' } });

      expect(response.status).toBe(400);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database errors gracefully', async () => {
      (mockPrisma.provider.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/providers');

      const response = await searchProviders(request);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody.error).toContain('Failed to search providers');
    });

    it('should validate request parameters', async () => {
      const request = new NextRequest(
        'http://localhost/api/providers?limit=invalid&offset=negative'
      );

      const response = await searchProviders(request);

      expect(response.status).toBe(200); // Should handle invalid params gracefully
    });
  });

  describe('Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      const largeProviderList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProvider,
        id: `provider-${i}`,
      }));

      (mockPrisma.provider.findMany as jest.Mock).mockResolvedValue(largeProviderList);
      (mockPrisma.provider.count as jest.Mock).mockResolvedValue(10000);

      const request = new NextRequest('http://localhost/api/providers?limit=1000');

      const startTime = Date.now();
      const response = await searchProviders(request);
      const endTime = Date.now();

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.providers).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

describe('Provider Type Assignment Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle provider type assignment edge cases', async () => {
    // Test removing all provider types (should fail)
    const formData = new FormData();
    formData.append('id', 'provider-123');
    formData.append('name', 'Test Provider');
    // No providerTypeIds provided

    (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost/api/providers/provider-123/basic-info', {
      method: 'PUT',
      body: formData,
    });

    const response = await updateProviderBasicInfo(request, { params: { id: 'provider-123' } });

    // Should succeed without changing type assignments when no types provided
    expect(response.status).toBe(200);
  });

  it('should preserve existing assignments when no change requested', async () => {
    const formData = new FormData();
    formData.append('id', 'provider-123');
    formData.append('name', 'Test Provider');
    formData.append('providerTypeIds', 'gp-type-id');
    formData.append('providerTypeIds', 'psych-type-id');

    (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);
    (mockPrisma.provider.update as jest.Mock).mockResolvedValue(mockProvider);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost/api/providers/provider-123/basic-info', {
      method: 'PUT',
      body: formData,
    });

    const response = await updateProviderBasicInfo(request, { params: { id: 'provider-123' } });

    expect(response.status).toBe(200);
    // Should not include typeAssignments update since they're the same
    expect(mockPrisma.provider.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          typeAssignments: expect.anything(),
        }),
      })
    );
  });
});