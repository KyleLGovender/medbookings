import { prisma } from '@/lib/prisma';
import { addDays, addMonths, differenceInMinutes, startOfMonth, endOfMonth } from 'date-fns';

export interface AvailabilityValidationOptions {
  serviceProviderId: string;
  startTime: Date;
  endTime: Date;
  excludeAvailabilityId?: string; // For update operations
  instances?: Array<{ startTime: Date; endTime: Date }>; // For recurring validation
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Comprehensive availability validation
 */
export async function validateAvailability(
  options: AvailabilityValidationOptions
): Promise<ValidationResult> {
  const errors: string[] = [];
  
  // Basic time validation
  if (options.endTime <= options.startTime) {
    errors.push('End time must be after start time');
  }

  // Duration validation (15-minute minimum)
  const durationMinutes = differenceInMinutes(options.endTime, options.startTime);
  if (durationMinutes < 15) {
    errors.push('Availability duration must be at least 15 minutes');
  }

  // Past date validation (max 30 days back)
  const now = new Date();
  const thirtyDaysAgo = addDays(now, -30);
  if (options.startTime < thirtyDaysAgo) {
    errors.push('Cannot create availability more than 30 days in the past');
  }

  // Future date validation (max 3 calendar months ahead)
  const currentMonth = startOfMonth(now);
  const threeMonthsAhead = endOfMonth(addMonths(currentMonth, 2)); // End of the 3rd month
  if (options.startTime > threeMonthsAhead) {
    errors.push('Cannot create availability more than 3 months in the future');
  }

  // Overlap validation
  const overlapErrors = await validateOverlaps(options);
  errors.push(...overlapErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate overlaps across ALL provider availabilities
 */
async function validateOverlaps(
  options: AvailabilityValidationOptions
): Promise<string[]> {
  const errors: string[] = [];
  
  // Get all existing availabilities for this provider
  const whereClause: any = {
    serviceProviderId: options.serviceProviderId,
    // Only check against accepted/pending availabilities (not cancelled/rejected)
    status: { in: ['ACCEPTED', 'PENDING'] },
  };

  // Exclude current availability if updating
  if (options.excludeAvailabilityId) {
    whereClause.id = { not: options.excludeAvailabilityId };
  }

  const existingAvailabilities = await prisma.availability.findMany({
    where: whereClause,
    select: {
      id: true,
      startTime: true,
      endTime: true,
      isRecurring: true,
      seriesId: true,
    },
  });

  // Check overlaps for each instance (single or recurring)
  const instancesToCheck = options.instances || [
    { startTime: options.startTime, endTime: options.endTime },
  ];

  for (const instance of instancesToCheck) {
    const overlappingAvailabilities = existingAvailabilities.filter(existing => 
      hasTimeOverlap(instance.startTime, instance.endTime, existing.startTime, existing.endTime)
    );

    if (overlappingAvailabilities.length > 0) {
      const overlappingTimes = overlappingAvailabilities.map(av => 
        `${av.startTime.toISOString()} - ${av.endTime.toISOString()}`
      ).join(', ');
      
      errors.push(
        `Availability from ${instance.startTime.toISOString()} to ${instance.endTime.toISOString()} overlaps with existing availability: ${overlappingTimes}`
      );
    }
  }

  return errors;
}

/**
 * Check if two time ranges overlap
 */
function hasTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Validate recurring availability instances
 */
export async function validateRecurringAvailability(
  options: AvailabilityValidationOptions & {
    instances: Array<{ startTime: Date; endTime: Date }>;
  }
): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate each instance individually
  for (const instance of options.instances) {
    const instanceResult = await validateAvailability({
      ...options,
      startTime: instance.startTime,
      endTime: instance.endTime,
    });

    if (!instanceResult.isValid) {
      errors.push(...instanceResult.errors);
    }
  }

  // Check for overlaps between instances in the same series
  for (let i = 0; i < options.instances.length; i++) {
    for (let j = i + 1; j < options.instances.length; j++) {
      const instance1 = options.instances[i];
      const instance2 = options.instances[j];
      
      if (hasTimeOverlap(instance1.startTime, instance1.endTime, instance2.startTime, instance2.endTime)) {
        errors.push(
          `Recurring instances overlap with each other: ${instance1.startTime.toISOString()} - ${instance1.endTime.toISOString()} and ${instance2.startTime.toISOString()} - ${instance2.endTime.toISOString()}`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate availability update
 */
export async function validateAvailabilityUpdate(
  availabilityId: string,
  options: Omit<AvailabilityValidationOptions, 'excludeAvailabilityId'>
): Promise<ValidationResult> {
  return validateAvailability({
    ...options,
    excludeAvailabilityId: availabilityId,
  });
}

/**
 * Check if availability can be updated (no existing bookings)
 */
export async function canUpdateAvailability(availabilityId: string): Promise<{
  canUpdate: boolean;
  reason?: string;
  bookedSlotsCount?: number;
}> {
  const bookedSlots = await prisma.calculatedAvailabilitySlot.count({
    where: {
      availabilityId,
      booking: { isNot: null },
    },
  });

  if (bookedSlots > 0) {
    return {
      canUpdate: false,
      reason: `Cannot update availability with ${bookedSlots} existing booking(s)`,
      bookedSlotsCount: bookedSlots,
    };
  }

  return { canUpdate: true };
}

/**
 * Get validation constraints for display in UI
 */
export function getValidationConstraints() {
  return {
    minDurationMinutes: 15,
    maxPastDays: 30,
    maxFutureMonths: 3,
    rules: [
      'Minimum duration: 15 minutes',
      'Cannot create availability more than 30 days in the past',
      'Cannot create availability more than 3 months in the future',
      'Cannot overlap with existing availability',
    ],
  };
}