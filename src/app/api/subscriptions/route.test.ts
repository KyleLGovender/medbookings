/**
 * Unit tests for subscription creation and retrieval API endpoints
 * Testing polymorphic constraint validation and proper error handling
 */

import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    location: {
      findUnique: jest.fn(),
    },
    serviceProvider: {
      findUnique: jest.fn(),
    },
    subscriptionPlan: {
      findUnique: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for authenticated user
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' },
    } as any);
  });

  describe('POST /api/subscriptions', () => {
    const validSubscriptionData = {
      planId: 'plan123',
      organizationId: 'org123',
      status: 'ACTIVE',
      startDate: '2024-01-01T00:00:00.000Z',
      type: 'BASE',
    };

    beforeEach(() => {
      // Mock entity existence checks
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org123' } as any);
      mockPrisma.location.findUnique.mockResolvedValue({ id: 'loc123' } as any);
      mockPrisma.serviceProvider.findUnique.mockResolvedValue({ id: 'provider123' } as any);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'plan123' } as any);
      
      // Mock successful subscription creation
      mockPrisma.subscription.create.mockResolvedValue({
        id: 'sub123',
        ...validSubscriptionData,
        startDate: new Date(validSubscriptionData.startDate),
      } as any);
    });

    it('should create subscription with organization ID only', async () => {
      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(validSubscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.subscription).toBeDefined();
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org123',
          locationId: null,
          serviceProviderId: null,
        }),
        include: expect.any(Object),
      });
    });

    it('should create subscription with location ID only', async () => {
      const subscriptionData = {
        ...validSubscriptionData,
        organizationId: undefined,
        locationId: 'loc123',
      };

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: null,
          locationId: 'loc123',
          serviceProviderId: null,
        }),
        include: expect.any(Object),
      });
    });

    it('should create subscription with service provider ID only', async () => {
      const subscriptionData = {
        ...validSubscriptionData,
        organizationId: undefined,
        serviceProviderId: 'provider123',
      };

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: null,
          locationId: null,
          serviceProviderId: 'provider123',
        }),
        include: expect.any(Object),
      });
    });

    it('should fail when no entity ID is provided', async () => {
      const subscriptionData = {
        ...validSubscriptionData,
        organizationId: undefined,
      };

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Exactly one of organizationId, locationId, or serviceProviderId must be provided',
          }),
        ])
      );
    });

    it('should fail when multiple entity IDs are provided', async () => {
      const subscriptionData = {
        ...validSubscriptionData,
        organizationId: 'org123',
        locationId: 'loc123',
      };

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Exactly one of organizationId, locationId, or serviceProviderId must be provided',
          }),
        ])
      );
    });

    it('should fail when all three entity IDs are provided', async () => {
      const subscriptionData = {
        ...validSubscriptionData,
        organizationId: 'org123',
        locationId: 'loc123',
        serviceProviderId: 'provider123',
      };

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Exactly one of organizationId, locationId, or serviceProviderId must be provided',
          }),
        ])
      );
    });

    it('should fail when referenced organization does not exist', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(validSubscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Organization not found');
    });

    it('should fail when referenced location does not exist', async () => {
      const subscriptionData = {
        ...validSubscriptionData,
        organizationId: undefined,
        locationId: 'loc123',
      };

      mockPrisma.location.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Location not found');
    });

    it('should fail when referenced service provider does not exist', async () => {
      const subscriptionData = {
        ...validSubscriptionData,
        organizationId: undefined,
        serviceProviderId: 'provider123',
      };

      mockPrisma.serviceProvider.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Service provider not found');
    });

    it('should fail when subscription plan does not exist', async () => {
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(validSubscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Subscription plan not found');
    });

    it('should fail when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(validSubscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should fail with invalid subscription status', async () => {
      const subscriptionData = {
        ...validSubscriptionData,
        status: 'INVALID_STATUS',
      };

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should fail with missing required fields', async () => {
      const subscriptionData = {
        organizationId: 'org123',
        // Missing planId and status
      };

      const request = new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('GET /api/subscriptions', () => {
    beforeEach(() => {
      mockPrisma.subscription.findMany.mockResolvedValue([
        {
          id: 'sub123',
          organizationId: 'org123',
          locationId: null,
          serviceProviderId: null,
        },
      ] as any);
    });

    it('should retrieve subscriptions without filters', async () => {
      const request = new NextRequest('http://localhost/api/subscriptions');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscriptions).toBeDefined();
      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should retrieve subscriptions filtered by organization ID', async () => {
      const request = new NextRequest('http://localhost/api/subscriptions?organizationId=org123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should retrieve subscriptions filtered by location ID', async () => {
      const request = new NextRequest('http://localhost/api/subscriptions?locationId=loc123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: { locationId: 'loc123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should retrieve subscriptions filtered by service provider ID', async () => {
      const request = new NextRequest('http://localhost/api/subscriptions?serviceProviderId=provider123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: { serviceProviderId: 'provider123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should fail when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});