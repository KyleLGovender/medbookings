import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processAvailabilityAcceptance } from './workflow-service';
import { AvailabilityStatus } from '@/features/calendar/availability/types/types';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    availability: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('./slot-generation', () => ({
  generateSlotsForAvailability: vi.fn(),
}));

vi.mock('./notification-service', () => ({
  notifyAvailabilityAccepted: vi.fn(),
}));

describe('Workflow Integration with Provider Status Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept PENDING availability and generate slots', async () => {
    // Mock current user (provider)
    const mockUser = {
      id: 'user-provider-123',
      name: 'Dr. Smith',
      role: 'PROVIDER',
    };
    const mockAuth = await import('@/lib/auth');
    (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

    // Mock finding PENDING availability
    const mockPendingAvailability = {
      id: 'availability-pending-123',
      serviceProviderId: 'user-provider-123',
      organizationId: 'org-123',
      status: AvailabilityStatus.PENDING,
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      schedulingRule: 'CONTINUOUS',
      schedulingInterval: 30,
      availableServices: [
        {
          serviceId: 'service-1',
          duration: 30,
          price: 100,
        },
      ],
    };

    // Mock updating availability to ACCEPTED
    const mockAcceptedAvailability = {
      ...mockPendingAvailability,
      status: AvailabilityStatus.ACCEPTED,
      acceptedById: 'user-provider-123',
      acceptedAt: new Date(),
    };

    const mockPrisma = await import('@/lib/prisma');
    (mockPrisma.prisma.availability.findUnique as any).mockResolvedValue(mockPendingAvailability);
    (mockPrisma.prisma.availability.update as any).mockResolvedValue(mockAcceptedAvailability);

    // Mock slot generation
    const mockSlotGeneration = await import('./slot-generation');
    (mockSlotGeneration.generateSlotsForAvailability as any).mockResolvedValue({
      success: true,
      slotsGenerated: 4,
    });

    // Mock notification service
    const mockNotificationService = await import('./notification-service');
    (mockNotificationService.notifyAvailabilityAccepted as any).mockResolvedValue(undefined);

    const result = await processAvailabilityAcceptance('availability-pending-123');

    expect(result.success).toBe(true);
    expect(result.slotsGenerated).toBe(4);
    expect(result.availability?.status).toBe(AvailabilityStatus.ACCEPTED);

    // Verify availability was updated to ACCEPTED
    expect(mockPrisma.prisma.availability.update).toHaveBeenCalledWith({
      where: { id: 'availability-pending-123' },
      data: {
        status: AvailabilityStatus.ACCEPTED,
        acceptedById: 'user-provider-123',
        acceptedAt: expect.any(Date),
      },
      include: expect.any(Object),
    });

    // Verify slots were generated
    expect(mockSlotGeneration.generateSlotsForAvailability).toHaveBeenCalledWith({
      availabilityId: 'availability-pending-123',
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      serviceProviderId: 'user-provider-123',
      organizationId: 'org-123',
      locationId: undefined,
      schedulingRule: 'CONTINUOUS',
      schedulingInterval: 30,
      services: [
        {
          serviceId: 'service-1',
          duration: 30,
          price: 100,
        },
      ],
    });

    // Verify notification was sent
    expect(mockNotificationService.notifyAvailabilityAccepted).toHaveBeenCalled();
  });

  it('should not accept availability that is already ACCEPTED', async () => {
    // Mock current user (provider)
    const mockUser = {
      id: 'user-provider-123',
      name: 'Dr. Smith',
      role: 'PROVIDER',
    };
    const mockAuth = await import('@/lib/auth');
    (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

    // Mock finding ACCEPTED availability
    const mockAcceptedAvailability = {
      id: 'availability-accepted-123',
      serviceProviderId: 'user-provider-123',
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

    const mockPrisma = await import('@/lib/prisma');
    (mockPrisma.prisma.availability.findUnique as any).mockResolvedValue(mockAcceptedAvailability);

    const result = await processAvailabilityAcceptance('availability-accepted-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Availability is not pending acceptance');

    // Verify availability was not updated
    expect(mockPrisma.prisma.availability.update).not.toHaveBeenCalled();

    // Verify slots were not generated
    const mockSlotGeneration = await import('./slot-generation');
    expect(mockSlotGeneration.generateSlotsForAvailability).not.toHaveBeenCalled();
  });

  it('should handle slot generation errors gracefully', async () => {
    // Mock current user (provider)
    const mockUser = {
      id: 'user-provider-123',
      name: 'Dr. Smith',
      role: 'PROVIDER',
    };
    const mockAuth = await import('@/lib/auth');
    (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

    // Mock finding PENDING availability
    const mockPendingAvailability = {
      id: 'availability-pending-123',
      serviceProviderId: 'user-provider-123',
      organizationId: 'org-123',
      status: AvailabilityStatus.PENDING,
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      schedulingRule: 'CONTINUOUS',
      schedulingInterval: 30,
      availableServices: [
        {
          serviceId: 'service-1',
          duration: 30,
          price: 100,
        },
      ],
    };

    // Mock updating availability to ACCEPTED
    const mockAcceptedAvailability = {
      ...mockPendingAvailability,
      status: AvailabilityStatus.ACCEPTED,
      acceptedById: 'user-provider-123',
      acceptedAt: new Date(),
    };

    const mockPrisma = await import('@/lib/prisma');
    (mockPrisma.prisma.availability.findUnique as any).mockResolvedValue(mockPendingAvailability);
    (mockPrisma.prisma.availability.update as any).mockResolvedValue(mockAcceptedAvailability);

    // Mock slot generation failure
    const mockSlotGeneration = await import('./slot-generation');
    (mockSlotGeneration.generateSlotsForAvailability as any).mockResolvedValue({
      success: false,
      slotsGenerated: 0,
      errors: ['Slot generation failed'],
    });

    // Mock notification service
    const mockNotificationService = await import('./notification-service');
    (mockNotificationService.notifyAvailabilityAccepted as any).mockResolvedValue(undefined);

    const result = await processAvailabilityAcceptance('availability-pending-123');

    expect(result.success).toBe(true); // Should still succeed despite slot generation failure
    expect(result.slotsGenerated).toBe(0);
    expect(result.availability?.status).toBe(AvailabilityStatus.ACCEPTED);

    // Verify availability was still updated to ACCEPTED
    expect(mockPrisma.prisma.availability.update).toHaveBeenCalled();

    // Verify notification was still sent
    expect(mockNotificationService.notifyAvailabilityAccepted).toHaveBeenCalled();
  });
});