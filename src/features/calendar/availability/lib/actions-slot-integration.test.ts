import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAvailability } from './actions';
import { SchedulingRule, AvailabilityStatus } from '@/features/calendar/availability/types/types';

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

describe('Availability Creation with Slot Generation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create availability and generate slots for provider-created availability', async () => {
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

    // Mock availability creation
    const mockAvailability = {
      id: 'availability-123',
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      serviceProviderId: 'sp-123',
      organizationId: 'org-123',
      locationId: 'loc-123',
      schedulingRule: SchedulingRule.CONTINUOUS,
      schedulingInterval: 30,
      status: AvailabilityStatus.ACCEPTED,
      availableServices: [
        {
          serviceId: 'service-1',
          duration: 30,
          price: 100,
        },
      ],
    };
    (mockPrisma.prisma.availability.create as any).mockResolvedValue(mockAvailability);
    (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockResolvedValue({});

    const createData = {
      serviceProviderId: 'sp-123',
      organizationId: 'org-123',
      locationId: 'loc-123',
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      schedulingRule: SchedulingRule.CONTINUOUS,
      schedulingInterval: 30,
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
    expect(mockPrisma.prisma.calculatedAvailabilitySlot.createMany).toHaveBeenCalled();
  });

  it('should create availability but not generate slots for organization-created availability (PENDING status)', async () => {
    // Mock current user (organization member)
    const mockUser = {
      id: 'user-456',
      name: 'Organization Member',
      role: 'ORGANIZATION',
    };
    const mockAuth = await import('@/lib/auth');
    (mockAuth.getCurrentUser as any).mockResolvedValue(mockUser);

    // Mock organization membership
    const mockMembership = {
      id: 'membership-123',
      userId: 'user-456',
      organizationId: 'org-123',
      role: 'MANAGER',
    };
    const mockPrisma = await import('@/lib/prisma');
    (mockPrisma.prisma.organizationMembership.findFirst as any).mockResolvedValue(mockMembership);

    // Mock availability creation (PENDING status)
    const mockAvailability = {
      id: 'availability-456',
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      serviceProviderId: 'sp-123',
      organizationId: 'org-123',
      locationId: 'loc-123',
      schedulingRule: SchedulingRule.CONTINUOUS,
      schedulingInterval: 30,
      status: AvailabilityStatus.PENDING,
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
      locationId: 'loc-123',
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      schedulingRule: SchedulingRule.CONTINUOUS,
      schedulingInterval: 30,
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
    // Slots should NOT be generated for PENDING availability
    expect(mockPrisma.prisma.calculatedAvailabilitySlot.createMany).not.toHaveBeenCalled();
  });

  it('should create recurring availability and generate slots for all instances', async () => {
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

    // Mock recurring availability creation (3 instances)
    const mockAvailabilities = [
      {
        id: 'availability-1',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        schedulingRule: SchedulingRule.CONTINUOUS,
        schedulingInterval: 30,
        status: AvailabilityStatus.ACCEPTED,
        availableServices: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      },
      {
        id: 'availability-2',
        startTime: new Date('2024-01-02T09:00:00Z'),
        endTime: new Date('2024-01-02T11:00:00Z'),
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        schedulingRule: SchedulingRule.CONTINUOUS,
        schedulingInterval: 30,
        status: AvailabilityStatus.ACCEPTED,
        availableServices: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      },
      {
        id: 'availability-3',
        startTime: new Date('2024-01-03T09:00:00Z'),
        endTime: new Date('2024-01-03T11:00:00Z'),
        serviceProviderId: 'sp-123',
        organizationId: 'org-123',
        schedulingRule: SchedulingRule.CONTINUOUS,
        schedulingInterval: 30,
        status: AvailabilityStatus.ACCEPTED,
        availableServices: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      },
    ];

    // Mock Promise.all to return the array of availability
    (mockPrisma.prisma.availability.create as any)
      .mockResolvedValueOnce(mockAvailabilities[0])
      .mockResolvedValueOnce(mockAvailabilities[1])
      .mockResolvedValueOnce(mockAvailabilities[2]);

    (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockResolvedValue({});
    (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

    const createData = {
      serviceProviderId: 'sp-123',
      organizationId: 'org-123',
      locationId: 'loc-123',
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      schedulingRule: SchedulingRule.CONTINUOUS,
      schedulingInterval: 30,
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

    expect(result.success).toBe(true);
    expect(mockPrisma.prisma.availability.create).toHaveBeenCalledTimes(3);
    expect(mockPrisma.prisma.calculatedAvailabilitySlot.createMany).toHaveBeenCalledTimes(3);
  });

  it('should handle different scheduling rules correctly', async () => {
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

    // Test ON_THE_HOUR scheduling
    const mockAvailability = {
      id: 'availability-123',
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T12:00:00Z'),
      serviceProviderId: 'sp-123',
      organizationId: 'org-123',
      schedulingRule: SchedulingRule.ON_THE_HOUR,
      status: AvailabilityStatus.ACCEPTED,
      availableServices: [
        {
          serviceId: 'service-1',
          duration: 60,
          price: 200,
        },
      ],
    };
    (mockPrisma.prisma.availability.create as any).mockResolvedValue(mockAvailability);
    (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockResolvedValue({});

    const createData = {
      serviceProviderId: 'sp-123',
      organizationId: 'org-123',
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T12:00:00Z'),
      schedulingRule: SchedulingRule.ON_THE_HOUR,
      services: [
        {
          serviceId: 'service-1',
          duration: 60,
          price: 200,
        },
      ],
      isRecurring: false,
    };

    const result = await createAvailability(createData);

    expect(result.success).toBe(true);
    expect(mockPrisma.prisma.calculatedAvailabilitySlot.createMany).toHaveBeenCalled();
  });

  it('should handle multiple services with different durations', async () => {
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

    const mockAvailability = {
      id: 'availability-123',
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      serviceProviderId: 'sp-123',
      organizationId: 'org-123',
      schedulingRule: SchedulingRule.CONTINUOUS,
      status: AvailabilityStatus.ACCEPTED,
      availableServices: [
        {
          serviceId: 'service-1',
          duration: 30,
          price: 100,
        },
        {
          serviceId: 'service-2',
          duration: 45,
          price: 150,
        },
        {
          serviceId: 'service-3',
          duration: 60,
          price: 200,
        },
      ],
    };
    (mockPrisma.prisma.availability.create as any).mockResolvedValue(mockAvailability);
    (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockResolvedValue({});

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
        {
          serviceId: 'service-2',
          duration: 45,
          price: 150,
        },
        {
          serviceId: 'service-3',
          duration: 60,
          price: 200,
        },
      ],
      isRecurring: false,
    };

    const result = await createAvailability(createData);

    expect(result.success).toBe(true);
    // Should create slots for each service (3 calls to createMany)
    expect(mockPrisma.prisma.calculatedAvailabilitySlot.createMany).toHaveBeenCalledTimes(3);
  });
});