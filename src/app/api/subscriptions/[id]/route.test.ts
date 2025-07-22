/**
 * Unit tests for subscription update API endpoint
 * Testing polymorphic constraint validation and proper error handling for updates
 */
import { NextRequest } from 'next/server';

import { getServerSession } from 'next-auth/next';

import { prisma } from '@/lib/prisma';

import { DELETE, GET, PATCH } from './route';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
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

describe('/api/subscriptions/[id]', () => {
  const mockParams = { params: { id: 'sub123' } };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for authenticated user
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' },
    } as any);

    // Default mock for existing subscription
    mockPrisma.subscription.findUnique.mockResolvedValue({
      id: 'sub123',
      organizationId: 'org123',
      locationId: null,
      serviceProviderId: null,
      planId: 'plan123',
      status: 'ACTIVE',
    } as any);
  });

  describe('GET /api/subscriptions/[id]', () => {
    it('should retrieve subscription by ID with relations', async () => {
      const request = new NextRequest('http://localhost/api/subscriptions/sub123');

      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription).toBeDefined();
      expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: 'sub123' },
        include: {
          plan: true,
          organization: true,
          location: true,
          serviceProvider: true,
          payments: expect.any(Object),
          usageRecords: expect.any(Object),
        },
      });
    });

    it('should return 404 when subscription not found', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions/sub123');

      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Subscription not found');
    });

    it('should fail when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions/sub123');

      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('PATCH /api/subscriptions/[id]', () => {
    beforeEach(() => {
      // Mock entity existence checks
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org456' } as any);
      mockPrisma.location.findUnique.mockResolvedValue({ id: 'loc456' } as any);
      mockPrisma.serviceProvider.findUnique.mockResolvedValue({ id: 'provider456' } as any);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'plan456' } as any);

      // Mock successful subscription update
      mockPrisma.subscription.update.mockResolvedValue({
        id: 'sub123',
        organizationId: 'org456',
        locationId: null,
        serviceProviderId: null,
      } as any);
    });

    it('should update subscription with new organization ID', async () => {
      const updateData = {
        organizationId: 'org456',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription).toBeDefined();
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub123' },
        data: {
          organizationId: 'org456',
          locationId: null,
          serviceProviderId: null,
        },
        include: expect.any(Object),
      });
    });

    it('should update subscription with new location ID', async () => {
      const updateData = {
        locationId: 'loc456',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub123' },
        data: {
          organizationId: null,
          locationId: 'loc456',
          serviceProviderId: null,
        },
        include: expect.any(Object),
      });
    });

    it('should update subscription with new service provider ID', async () => {
      const updateData = {
        serviceProviderId: 'provider456',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub123' },
        data: {
          organizationId: null,
          locationId: null,
          serviceProviderId: 'provider456',
        },
        include: expect.any(Object),
      });
    });

    it('should update subscription status without changing entity', async () => {
      const updateData = {
        status: 'CANCELLED',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub123' },
        data: {
          status: 'CANCELLED',
        },
        include: expect.any(Object),
      });
    });

    it('should fail when trying to set multiple entity IDs', async () => {
      const updateData = {
        organizationId: 'org456',
        locationId: 'loc456',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message:
              'If updating entity relationship, exactly one of organizationId, locationId, or serviceProviderId must be provided',
          }),
        ])
      );
    });

    it('should fail when trying to set all three entity IDs', async () => {
      const updateData = {
        organizationId: 'org456',
        locationId: 'loc456',
        serviceProviderId: 'provider456',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message:
              'If updating entity relationship, exactly one of organizationId, locationId, or serviceProviderId must be provided',
          }),
        ])
      );
    });

    it('should allow explicitly setting entity to null', async () => {
      const updateData = {
        organizationId: null,
        locationId: 'loc456',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub123' },
        data: {
          organizationId: null,
          locationId: 'loc456',
          serviceProviderId: null,
        },
        include: expect.any(Object),
      });
    });

    it('should fail when referenced organization does not exist', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      const updateData = {
        organizationId: 'nonexistent-org',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Organization not found');
    });

    it('should fail when referenced location does not exist', async () => {
      mockPrisma.location.findUnique.mockResolvedValue(null);

      const updateData = {
        locationId: 'nonexistent-loc',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Location not found');
    });

    it('should fail when referenced service provider does not exist', async () => {
      mockPrisma.serviceProvider.findUnique.mockResolvedValue(null);

      const updateData = {
        serviceProviderId: 'nonexistent-provider',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Service provider not found');
    });

    it('should fail when subscription plan does not exist', async () => {
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      const updateData = {
        planId: 'nonexistent-plan',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Subscription plan not found');
    });

    it('should return 404 when subscription not found', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      const updateData = {
        status: 'CANCELLED',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Subscription not found');
    });

    it('should fail when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const updateData = {
        status: 'CANCELLED',
      };

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/subscriptions/[id]', () => {
    beforeEach(() => {
      mockPrisma.subscription.update.mockResolvedValue({
        id: 'sub123',
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Cancelled via API',
      } as any);
    });

    it('should soft delete subscription by marking as cancelled', async () => {
      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription).toBeDefined();
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub123' },
        data: {
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
          cancelReason: 'Cancelled via API',
        },
        include: expect.any(Object),
      });
    });

    it('should return 404 when subscription not found', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Subscription not found');
    });

    it('should fail when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/subscriptions/sub123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
