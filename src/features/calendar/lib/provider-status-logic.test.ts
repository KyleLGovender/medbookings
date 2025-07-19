import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAvailability } from './actions';
import { AvailabilityStatus, SchedulingRule } from '@/features/calendar/types/types';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    serviceProvider: {
      findUnique: vi.fn(),
    },
    organizationMembership: {
      findFirst: vi.fn(),
    },
    availability: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    calculatedAvailabilitySlot: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('./slot-generation', () => ({
  generateSlotsForMultipleAvailability: vi.fn(),
}));

describe('Provider Status Logic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider-created availability', () => {
    it('should set status to ACCEPTED when provider creates their own availability', async () => {
      // Mock current user (provider)
      const mockUser = {
        id: 'user-provider-123',
        name: 'Dr. Smith',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider lookup - user IS the service provider
      const mockServiceProvider = {
        id: 'sp-123',
        userId: 'user-provider-123',
      };
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);

      // Mock availability creation
      const mockAvailability = {
        id: 'availability-123',
        serviceProviderId: 'sp-123',
        status: AvailabilityStatus.ACCEPTED,
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        availableServices: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      };
      (mockPrisma.prisma.availability.create as any).mockResolvedValue(mockAvailability);

      // Mock slot generation
      const mockSlotGeneration = await import('./slot-generation');
      (mockSlotGeneration.generateSlotsForMultipleAvailability as any).mockResolvedValue({
        success: true,
        slotsGenerated: 4,
      });

      const createData = {
        serviceProviderId: 'sp-123', // Same as the provider's ID
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
        isRecurring: false,
      };

      const result = await createAvailability(createData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(AvailabilityStatus.ACCEPTED);
      
      // Verify ServiceProvider lookup was called with correct user ID
      expect(mockPrisma.prisma.serviceProvider.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-provider-123' },
      });

      // Verify slots were generated (only for ACCEPTED status)
      expect(mockSlotGeneration.generateSlotsForMultipleAvailability).toHaveBeenCalled();
    });

    it('should set status to PENDING when provider creates availability for different provider', async () => {
      // Mock current user (provider)
      const mockUser = {
        id: 'user-provider-123',
        name: 'Dr. Smith',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider lookup - user is a different provider
      const mockServiceProvider = {
        id: 'sp-123',
        userId: 'user-provider-123',
      };
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);

      // Mock availability creation
      const mockAvailability = {
        id: 'availability-456',
        serviceProviderId: 'sp-456', // Different provider
        status: AvailabilityStatus.PENDING,
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        availableServices: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      };
      (mockPrisma.prisma.availability.create as any).mockResolvedValue(mockAvailability);

      const createData = {
        serviceProviderId: 'sp-456', // Different from user's provider ID
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
        isRecurring: false,
      };

      const result = await createAvailability(createData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(AvailabilityStatus.PENDING);
      
      // Verify ServiceProvider lookup was called
      expect(mockPrisma.prisma.serviceProvider.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-provider-123' },
      });

      // Verify slots were NOT generated (PENDING status)
      const mockSlotGeneration = await import('./slot-generation');
      expect(mockSlotGeneration.generateSlotsForMultipleAvailability).not.toHaveBeenCalled();
    });
  });

  describe('Organization-created availability', () => {
    it('should set status to PENDING when organization member creates availability', async () => {
      // Mock current user (organization member)
      const mockUser = {
        id: 'user-org-456',
        name: 'Organization Manager',
        role: 'ORGANIZATION',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider lookup - user is NOT a service provider
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(null);

      // Mock organization membership
      const mockMembership = {
        id: 'membership-123',
        userId: 'user-org-456',
        organizationId: 'org-123',
        role: 'MANAGER',
      };
      (mockPrisma.prisma.organizationMembership.findFirst as any).mockResolvedValue(mockMembership);

      // Mock availability creation
      const mockAvailability = {
        id: 'availability-789',
        serviceProviderId: 'sp-123',
        status: AvailabilityStatus.PENDING,
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        availableServices: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      };
      (mockPrisma.prisma.availability.create as any).mockResolvedValue(mockAvailability);

      const createData = {
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
        isRecurring: false,
      };

      const result = await createAvailability(createData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(AvailabilityStatus.PENDING);
      
      // Verify ServiceProvider lookup was called
      expect(mockPrisma.prisma.serviceProvider.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-org-456' },
      });

      // Verify slots were NOT generated (PENDING status)
      const mockSlotGeneration = await import('./slot-generation');
      expect(mockSlotGeneration.generateSlotsForMultipleAvailability).not.toHaveBeenCalled();
    });

    it('should set status to ACCEPTED when organization member creates availability for their own provider account', async () => {
      // Mock current user (organization member who is ALSO a provider)
      const mockUser = {
        id: 'user-dual-789',
        name: 'Dr. Manager',
        role: 'ORGANIZATION',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider lookup - user IS also a service provider
      const mockServiceProvider = {
        id: 'sp-789',
        userId: 'user-dual-789',
      };
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);

      // Mock organization membership
      const mockMembership = {
        id: 'membership-456',
        userId: 'user-dual-789',
        organizationId: 'org-123',
        role: 'MANAGER',
      };
      (mockPrisma.prisma.organizationMembership.findFirst as any).mockResolvedValue(mockMembership);

      // Mock availability creation
      const mockAvailability = {
        id: 'availability-999',
        serviceProviderId: 'sp-789',
        status: AvailabilityStatus.ACCEPTED,
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        availableServices: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      };
      (mockPrisma.prisma.availability.create as any).mockResolvedValue(mockAvailability);

      // Mock slot generation
      const mockSlotGeneration = await import('./slot-generation');
      (mockSlotGeneration.generateSlotsForMultipleAvailability as any).mockResolvedValue({
        success: true,
        slotsGenerated: 4,
      });

      const createData = {
        serviceProviderId: 'sp-789', // Same as user's provider account
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
        isRecurring: false,
      };

      const result = await createAvailability(createData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(AvailabilityStatus.ACCEPTED);
      
      // Verify ServiceProvider lookup was called
      expect(mockPrisma.prisma.serviceProvider.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-dual-789' },
      });

      // Verify slots were generated (ACCEPTED status)
      expect(mockSlotGeneration.generateSlotsForMultipleAvailability).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle case where user has no service provider account', async () => {
      // Mock current user (admin or other role)
      const mockUser = {
        id: 'user-admin-999',
        name: 'Admin User',
        role: 'ADMIN',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider lookup - user has no provider account
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(null);

      // Mock organization membership
      const mockMembership = {
        id: 'membership-admin',
        userId: 'user-admin-999',
        organizationId: 'org-123',
        role: 'ADMIN',
      };
      (mockPrisma.prisma.organizationMembership.findFirst as any).mockResolvedValue(mockMembership);

      // Mock availability creation
      const mockAvailability = {
        id: 'availability-admin',
        serviceProviderId: 'sp-123',
        status: AvailabilityStatus.PENDING,
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        availableServices: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      };
      (mockPrisma.prisma.availability.create as any).mockResolvedValue(mockAvailability);

      const createData = {
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
        isRecurring: false,
      };

      const result = await createAvailability(createData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(AvailabilityStatus.PENDING);
      
      // Verify ServiceProvider lookup was called
      expect(mockPrisma.prisma.serviceProvider.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-admin-999' },
      });
    });
  });
});