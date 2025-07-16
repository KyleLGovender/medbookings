import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateSlotsForAvailability, generateSlotsForMultipleAvailability } from './slot-generation';
import { SchedulingRule } from '@/features/calendar/availability/types/types';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    calculatedAvailabilitySlot: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    availability: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock date-fns to make tests deterministic
vi.mock('date-fns', () => ({
  addMinutes: vi.fn((date, minutes) => new Date(date.getTime() + minutes * 60000)),
}));

describe('slot-generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSlotsForAvailability', () => {
    it('should generate continuous slots for a single service', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockResolvedValue({});

      const options = {
        availabilityId: 'test-availability-id',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        serviceProviderId: 'provider-id',
        organizationId: 'org-id',
        locationId: 'location-id',
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      };

      const result = await generateSlotsForAvailability(options);

      expect(result.success).toBe(true);
      expect(result.slotsGenerated).toBeGreaterThan(0);
      expect(mockPrisma.prisma.calculatedAvailabilitySlot.createMany).toHaveBeenCalled();
    });

    it('should generate slots for multiple services', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockResolvedValue({});

      const options = {
        availabilityId: 'test-availability-id',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        serviceProviderId: 'provider-id',
        organizationId: 'org-id',
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
        ],
      };

      const result = await generateSlotsForAvailability(options);

      expect(result.success).toBe(true);
      expect(result.slotsGenerated).toBeGreaterThan(0);
      expect(mockPrisma.prisma.calculatedAvailabilitySlot.createMany).toHaveBeenCalledTimes(2);
    });

    it('should handle on-the-hour scheduling', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockResolvedValue({});

      const options = {
        availabilityId: 'test-availability-id',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T12:00:00Z'),
        serviceProviderId: 'provider-id',
        organizationId: 'org-id',
        schedulingRule: SchedulingRule.ON_THE_HOUR,
        services: [
          {
            serviceId: 'service-1',
            duration: 60,
            price: 200,
          },
        ],
      };

      const result = await generateSlotsForAvailability(options);

      expect(result.success).toBe(true);
      expect(result.slotsGenerated).toBeGreaterThan(0);
    });

    it('should handle on-the-half-hour scheduling', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockResolvedValue({});

      const options = {
        availabilityId: 'test-availability-id',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        serviceProviderId: 'provider-id',
        organizationId: 'org-id',
        schedulingRule: SchedulingRule.ON_THE_HALF_HOUR,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      };

      const result = await generateSlotsForAvailability(options);

      expect(result.success).toBe(true);
      expect(result.slotsGenerated).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockRejectedValue(
        new Error('Database error')
      );

      const options = {
        availabilityId: 'test-availability-id',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        serviceProviderId: 'provider-id',
        organizationId: 'org-id',
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      };

      const result = await generateSlotsForAvailability(options);

      expect(result.success).toBe(false);
      expect(result.slotsGenerated).toBe(0);
      expect(result.errors).toContain('Database error');
    });

    it('should handle invalid time ranges', async () => {
      const options = {
        availabilityId: 'test-availability-id',
        startTime: new Date('2024-01-01T11:00:00Z'),
        endTime: new Date('2024-01-01T09:00:00Z'), // End before start
        serviceProviderId: 'provider-id',
        organizationId: 'org-id',
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 30,
            price: 100,
          },
        ],
      };

      const result = await generateSlotsForAvailability(options);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Availability end time must be after start time');
    });

    it('should handle invalid service duration', async () => {
      const options = {
        availabilityId: 'test-availability-id',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        serviceProviderId: 'provider-id',
        organizationId: 'org-id',
        schedulingRule: SchedulingRule.CONTINUOUS,
        services: [
          {
            serviceId: 'service-1',
            duration: 0, // Invalid duration
            price: 100,
          },
        ],
      };

      const result = await generateSlotsForAvailability(options);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Service duration must be positive');
    });
  });

  describe('generateSlotsForMultipleAvailability', () => {
    it('should generate slots for multiple availability records', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any).mockResolvedValue({});

      const availabilities = [
        {
          id: 'availability-1',
          startTime: new Date('2024-01-01T09:00:00Z'),
          endTime: new Date('2024-01-01T11:00:00Z'),
          serviceProviderId: 'provider-id',
          organizationId: 'org-id',
          schedulingRule: SchedulingRule.CONTINUOUS,
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
          serviceProviderId: 'provider-id',
          organizationId: 'org-id',
          schedulingRule: SchedulingRule.CONTINUOUS,
          availableServices: [
            {
              serviceId: 'service-1',
              duration: 30,
              price: 100,
            },
          ],
        },
      ];

      const result = await generateSlotsForMultipleAvailability(availabilities);

      expect(result.success).toBe(true);
      expect(result.slotsGenerated).toBeGreaterThan(0);
      expect(mockPrisma.prisma.calculatedAvailabilitySlot.createMany).toHaveBeenCalledTimes(2);
    });

    it('should continue processing other availability if one fails', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.calculatedAvailabilitySlot.createMany as any)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({});

      const availabilities = [
        {
          id: 'availability-1',
          startTime: new Date('2024-01-01T11:00:00Z'),
          endTime: new Date('2024-01-01T09:00:00Z'), // Invalid range
          serviceProviderId: 'provider-id',
          organizationId: 'org-id',
          schedulingRule: SchedulingRule.CONTINUOUS,
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
          serviceProviderId: 'provider-id',
          organizationId: 'org-id',
          schedulingRule: SchedulingRule.CONTINUOUS,
          availableServices: [
            {
              serviceId: 'service-1',
              duration: 30,
              price: 100,
            },
          ],
        },
      ];

      const result = await generateSlotsForMultipleAvailability(availabilities);

      expect(result.success).toBe(false);
      expect(result.slotsGenerated).toBeGreaterThan(0); // Second availability should still generate slots
      expect(result.errors).toBeDefined();
    });
  });
});