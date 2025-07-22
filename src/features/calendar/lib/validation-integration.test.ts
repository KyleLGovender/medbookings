import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AvailabilityStatus, SchedulingRule } from '@/features/calendar/types/types';

import { createAvailability, updateAvailability } from './actions';

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
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    calculatedAvailabilitySlot: {
      createMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('./slot-generation', () => ({
  generateSlotsForMultipleAvailability: vi.fn(),
}));

describe('Validation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  describe('createAvailability with validation', () => {
    it('should reject availability with invalid duration', async () => {
      // Mock current user
      const mockUser = {
        id: 'user-123',
        name: 'Test Provider',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider
      const mockServiceProvider = {
        id: 'sp-123',
        userId: 'user-123',
      };
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const createData = {
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T14:10:00Z'), // 10 minutes (invalid)
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

      expect(result.success).toBe(false);
      expect(result.error).toContain('Availability duration must be at least 15 minutes');
      expect(mockPrisma.prisma.availability.create).not.toHaveBeenCalled();
    });

    it('should reject availability that is too far in the past', async () => {
      // Mock current user
      const mockUser = {
        id: 'user-123',
        name: 'Test Provider',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider
      const mockServiceProvider = {
        id: 'sp-123',
        userId: 'user-123',
      };
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const createData = {
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        startTime: new Date('2023-11-15T14:00:00Z'), // More than 30 days ago
        endTime: new Date('2023-11-15T15:00:00Z'),
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

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot create availability more than 30 days in the past');
      expect(mockPrisma.prisma.availability.create).not.toHaveBeenCalled();
    });

    it('should reject availability that is too far in the future', async () => {
      // Mock current user
      const mockUser = {
        id: 'user-123',
        name: 'Test Provider',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider
      const mockServiceProvider = {
        id: 'sp-123',
        userId: 'user-123',
      };
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const createData = {
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        startTime: new Date('2024-05-01T14:00:00Z'), // More than 3 months ahead
        endTime: new Date('2024-05-01T15:00:00Z'),
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

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot create availability more than 3 months in the future');
      expect(mockPrisma.prisma.availability.create).not.toHaveBeenCalled();
    });

    it('should reject overlapping availability', async () => {
      // Mock current user
      const mockUser = {
        id: 'user-123',
        name: 'Test Provider',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider
      const mockServiceProvider = {
        id: 'sp-123',
        userId: 'user-123',
      };
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);

      // Mock existing overlapping availability
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'existing-1',
          startTime: new Date('2024-01-01T14:30:00Z'),
          endTime: new Date('2024-01-01T15:30:00Z'),
          status: 'ACCEPTED',
        },
      ]);

      const createData = {
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'), // Overlaps with existing
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

      expect(result.success).toBe(false);
      expect(result.error).toContain('overlaps with existing availability');
      expect(mockPrisma.prisma.availability.create).not.toHaveBeenCalled();
    });

    it('should reject recurring availability with overlapping instances', async () => {
      // Mock current user
      const mockUser = {
        id: 'user-123',
        name: 'Test Provider',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider
      const mockServiceProvider = {
        id: 'sp-123',
        userId: 'user-123',
      };
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);

      // Mock existing availability that would overlap with recurring instances
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'existing-1',
          startTime: new Date('2024-01-02T14:30:00Z'), // Overlaps with second instance
          endTime: new Date('2024-01-02T15:30:00Z'),
          status: 'ACCEPTED',
        },
      ]);

      const createData = {
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
        isRecurring: true,
        recurrencePattern: {
          type: 'DAILY',
          interval: 1,
          count: 3,
        },
      };

      const result = await createAvailability(createData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('overlaps with existing availability');
      expect(mockPrisma.prisma.availability.create).not.toHaveBeenCalled();
    });

    it('should accept valid availability', async () => {
      // Mock current user
      const mockUser = {
        id: 'user-123',
        name: 'Test Provider',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock service provider
      const mockServiceProvider = {
        id: 'sp-123',
        userId: 'user-123',
      };
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);

      // Mock no existing availability (no overlaps)
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      // Mock availability creation
      const mockAvailability = {
        id: 'availability-123',
        serviceProviderId: 'sp-123',
        status: AvailabilityStatus.ACCEPTED,
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
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
        slotsGenerated: 2,
      });

      const createData = {
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
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
      expect(mockPrisma.prisma.availability.create).toHaveBeenCalled();
      expect(mockSlotGeneration.generateSlotsForMultipleAvailability).toHaveBeenCalled();
    });
  });

  describe('updateAvailability with validation', () => {
    it('should reject update with invalid time changes', async () => {
      // Mock current user
      const mockUser = {
        id: 'user-123',
        name: 'Test Provider',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock existing availability
      const mockExistingAvailability = {
        id: 'availability-123',
        serviceProviderId: 'user-123',
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
        calculatedSlots: [],
      };

      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findUnique as any).mockResolvedValue(
        mockExistingAvailability
      );
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const updateData = {
        id: 'availability-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T14:10:00Z'), // Invalid duration (10 minutes)
      };

      const result = await updateAvailability(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Availability duration must be at least 15 minutes');
      expect(mockPrisma.prisma.availability.update).not.toHaveBeenCalled();
    });

    it('should reject update that would create overlaps', async () => {
      // Mock current user
      const mockUser = {
        id: 'user-123',
        name: 'Test Provider',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock existing availability
      const mockExistingAvailability = {
        id: 'availability-123',
        serviceProviderId: 'user-123',
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
        calculatedSlots: [],
      };

      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findUnique as any).mockResolvedValue(
        mockExistingAvailability
      );

      // Mock other availability that would overlap
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'other-availability',
          startTime: new Date('2024-01-01T15:30:00Z'),
          endTime: new Date('2024-01-01T16:30:00Z'),
          status: 'ACCEPTED',
        },
      ]);

      const updateData = {
        id: 'availability-123',
        startTime: new Date('2024-01-01T15:00:00Z'),
        endTime: new Date('2024-01-01T16:00:00Z'), // Would overlap
      };

      const result = await updateAvailability(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('overlaps with existing availability');
      expect(mockPrisma.prisma.availability.update).not.toHaveBeenCalled();
    });

    it('should allow valid update', async () => {
      // Mock current user
      const mockUser = {
        id: 'user-123',
        name: 'Test Provider',
        role: 'PROVIDER',
      };
      const mockAuth = await import('@/lib/auth');
      (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

      // Mock existing availability
      const mockExistingAvailability = {
        id: 'availability-123',
        serviceProviderId: 'user-123',
        organizationId: 'org-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
        calculatedSlots: [],
      };

      // Mock updated availability
      const mockUpdatedAvailability = {
        ...mockExistingAvailability,
        startTime: new Date('2024-01-01T16:00:00Z'),
        endTime: new Date('2024-01-01T17:00:00Z'),
      };

      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findUnique as any)
        .mockResolvedValueOnce(mockExistingAvailability)
        .mockResolvedValueOnce(mockUpdatedAvailability);
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);
      (mockPrisma.prisma.availability.update as any).mockResolvedValue(mockUpdatedAvailability);

      const updateData = {
        id: 'availability-123',
        startTime: new Date('2024-01-01T16:00:00Z'),
        endTime: new Date('2024-01-01T17:00:00Z'), // Valid, no overlap
      };

      const result = await updateAvailability(updateData);

      expect(result.success).toBe(true);
      expect(mockPrisma.prisma.availability.update).toHaveBeenCalled();
    });
  });
});
