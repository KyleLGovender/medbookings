import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canUpdateAvailability,
  validateAvailability,
  validateAvailabilityUpdate,
  validateRecurringAvailability,
} from './availability-validation';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    availability: {
      findMany: vi.fn(),
    },
    calculatedAvailabilitySlot: {
      count: vi.fn(),
    },
  },
}));

// Mock date-fns functions to make tests predictable
vi.mock('date-fns', () => ({
  addDays: vi.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
  addMonths: vi.fn((date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }),
  differenceInMinutes: vi.fn((end, start) => {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }),
  startOfMonth: vi.fn((date) => {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }),
  endOfMonth: vi.fn((date) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1);
    result.setDate(0);
    result.setHours(23, 59, 59, 999);
    return result;
  }),
}));

describe('Availability Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date to January 1, 2024
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  describe('validateAvailability', () => {
    it('should pass validation for valid availability', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject availability with end time before start time', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T15:00:00Z'),
        endTime: new Date('2024-01-01T14:00:00Z'),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End time must be after start time');
    });

    it('should reject availability with less than 15 minutes duration', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T14:10:00Z'), // 10 minutes
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Availability duration must be at least 15 minutes');
    });

    it('should reject availability more than 30 days in the past', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2023-11-15T14:00:00Z'), // More than 30 days ago
        endTime: new Date('2023-11-15T15:00:00Z'),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot create availability more than 30 days in the past');
    });

    it('should reject availability more than 3 months in the future', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-05-01T14:00:00Z'), // More than 3 months ahead
        endTime: new Date('2024-05-01T15:00:00Z'),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Cannot create availability more than 3 months in the future'
      );
    });

    it('should reject overlapping availability', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'existing-1',
          startTime: new Date('2024-01-01T14:30:00Z'),
          endTime: new Date('2024-01-01T15:30:00Z'),
          status: 'ACCEPTED',
        },
      ]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'), // Overlaps with existing
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('overlaps with existing availability');
    });

    it('should allow availability that does not overlap', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'existing-1',
          startTime: new Date('2024-01-01T16:00:00Z'),
          endTime: new Date('2024-01-01T17:00:00Z'),
          status: 'ACCEPTED',
        },
      ]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'), // No overlap
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should ignore cancelled and rejected availability for overlap checks', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'cancelled-1',
          startTime: new Date('2024-01-01T14:30:00Z'),
          endTime: new Date('2024-01-01T15:30:00Z'),
          status: 'CANCELLED',
        },
        {
          id: 'rejected-1',
          startTime: new Date('2024-01-01T14:30:00Z'),
          endTime: new Date('2024-01-01T15:30:00Z'),
          status: 'REJECTED',
        },
      ]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should exclude specific availability ID when provided', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'existing-1',
          startTime: new Date('2024-01-01T14:30:00Z'),
          endTime: new Date('2024-01-01T15:30:00Z'),
          status: 'ACCEPTED',
        },
      ]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
        excludeAvailabilityId: 'existing-1', // Exclude the overlapping one
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateRecurringAvailability', () => {
    it('should validate all instances in a recurring series', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const instances = [
        {
          startTime: new Date('2024-01-01T14:00:00Z'),
          endTime: new Date('2024-01-01T15:00:00Z'),
        },
        {
          startTime: new Date('2024-01-02T14:00:00Z'),
          endTime: new Date('2024-01-02T15:00:00Z'),
        },
        {
          startTime: new Date('2024-01-03T14:00:00Z'),
          endTime: new Date('2024-01-03T15:00:00Z'),
        },
      ];

      const result = await validateRecurringAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
        instances,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect overlapping instances within the same series', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const instances = [
        {
          startTime: new Date('2024-01-01T14:00:00Z'),
          endTime: new Date('2024-01-01T15:00:00Z'),
        },
        {
          startTime: new Date('2024-01-01T14:30:00Z'), // Overlaps with first instance
          endTime: new Date('2024-01-01T15:30:00Z'),
        },
      ];

      const result = await validateRecurringAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
        instances,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Recurring instances overlap with each other');
    });

    it('should reject recurring series with instances that violate date limits', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const instances = [
        {
          startTime: new Date('2024-01-01T14:00:00Z'),
          endTime: new Date('2024-01-01T15:00:00Z'),
        },
        {
          startTime: new Date('2024-05-01T14:00:00Z'), // Too far in future
          endTime: new Date('2024-05-01T15:00:00Z'),
        },
      ];

      const result = await validateRecurringAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
        instances,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Cannot create availability more than 3 months in the future'
      );
    });
  });

  describe('validateAvailabilityUpdate', () => {
    it('should validate update with exclusion of current availability', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'other-availability',
          startTime: new Date('2024-01-01T16:00:00Z'),
          endTime: new Date('2024-01-01T17:00:00Z'),
          status: 'ACCEPTED',
        },
      ]);

      const result = await validateAvailabilityUpdate('current-availability-id', {
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'),
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('canUpdateAvailability', () => {
    it('should allow update when no bookings exist', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.calculatedAvailabilitySlot.count as any).mockResolvedValue(0);

      const result = await canUpdateAvailability('availability-123');

      expect(result.canUpdate).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should prevent update when bookings exist', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.calculatedAvailabilitySlot.count as any).mockResolvedValue(3);

      const result = await canUpdateAvailability('availability-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Cannot update availability with 3 existing booking(s)');
      expect(result.bookedSlotsCount).toBe(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle same start and end times correctly', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'existing-1',
          startTime: new Date('2024-01-01T15:00:00Z'),
          endTime: new Date('2024-01-01T16:00:00Z'),
          status: 'ACCEPTED',
        },
      ]);

      // Test touching times (end of one = start of another)
      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z'), // Ends when existing starts
      });

      expect(result.isValid).toBe(true); // Should be valid (no overlap)
    });

    it('should handle midnight boundaries correctly', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T23:30:00Z'),
        endTime: new Date('2024-01-02T00:30:00Z'), // Crosses midnight
      });

      expect(result.isValid).toBe(true);
    });

    it('should provide multiple error messages when multiple validations fail', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.availability.findMany as any).mockResolvedValue([
        {
          id: 'existing-1',
          startTime: new Date('2024-01-01T14:30:00Z'),
          endTime: new Date('2024-01-01T15:30:00Z'),
          status: 'ACCEPTED',
        },
      ]);

      const result = await validateAvailability({
        serviceProviderId: 'sp-123',
        startTime: new Date('2024-01-01T15:00:00Z'),
        endTime: new Date('2024-01-01T14:00:00Z'), // End before start + overlap
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('End time must be after start time');
    });
  });
});
