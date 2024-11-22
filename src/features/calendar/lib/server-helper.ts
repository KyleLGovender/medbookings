'use server';

import { calculateAvailableSpots } from '@/features/calendar/lib/helper';
import { prisma } from '@/lib/prisma';

import { availabilityFormSchema } from './types';

export async function checkForOverlappingAvailability(
  serviceProviderId: string,
  startTime: Date,
  endTime: Date,
  isRecurring: boolean = false,
  recurringDays?: number[],
  recurrenceEndDate?: Date | null,
  excludeAvailabilityId?: string
) {
  const defaultRecurrenceEndDate = new Date(startTime);
  defaultRecurrenceEndDate.setFullYear(defaultRecurrenceEndDate.getFullYear() + 1);
  const effectiveRecurrenceEndDate = recurrenceEndDate || defaultRecurrenceEndDate;

  const baseWhere = {
    serviceProviderId,
    OR: [
      {
        startTime: { lte: startTime },
        endTime: { gt: startTime },
      },
      {
        startTime: { lt: endTime },
        endTime: { gte: endTime },
      },
      {
        startTime: { gte: startTime },
        endTime: { lte: endTime },
      },
    ],
  };

  if (isRecurring && recurringDays?.length) {
    baseWhere.OR.push({
      isRecurring: true,
      recurringDays: {
        hasSome: recurringDays,
      },
      AND: [
        {
          startTime: { lte: effectiveRecurrenceEndDate },
        },
        {
          recurrenceEndDate: {
            gte: startTime,
          },
        },
      ],
    });
  }

  const where = excludeAvailabilityId
    ? {
        ...baseWhere,
        NOT: { id: excludeAvailabilityId },
      }
    : baseWhere;

  const overlapping = await prisma.availability.findFirst({
    where,
    select: {
      startTime: true,
      endTime: true,
      isRecurring: true,
      recurringDays: true,
      recurrenceEndDate: true,
    },
  });

  if (!overlapping) {
    return { hasOverlap: false };
  }

  if (!overlapping.isRecurring) {
    return {
      hasOverlap: true,
      overlappingPeriod: {
        startTime: overlapping.startTime,
        endTime: overlapping.endTime,
      },
    };
  }

  const startDay = startTime.getDay();
  const hasOverlappingDay = overlapping.recurringDays?.some(
    (day) => recurringDays?.includes(day) || day === startDay
  );

  return {
    hasOverlap: hasOverlappingDay,
    overlappingPeriod: hasOverlappingDay
      ? {
          startTime: overlapping.startTime,
          endTime: overlapping.endTime,
        }
      : undefined,
  };
}

export async function checkAvailabilityAccess(
  availabilityId: string,
  serviceProviderId: string
): Promise<{
  availability?: Schedule;
  error?: string;
}> {
  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      serviceProviderId,
    },
    include: {
      bookings: true,
    },
  });

  if (!availability) {
    return { error: 'Availability not found' };
  }

  if (availability.bookings.some((booking) => booking.status === 'CONFIRMED')) {
    return { error: 'Cannot modify availability with confirmed bookings' };
  }

  return { availability };
}

export async function validateAvailabilityFormData(formData: FormData) {
  const recurringDaysString = formData.get('recurringDays') as string;
  const recurringDays = recurringDaysString ? JSON.parse(recurringDaysString) : [];
  const recurrenceEndDateString = formData.get('recurrenceEndDate');

  const serviceProviderId = formData.get('serviceProviderId') as string;
  if (!serviceProviderId) return { error: 'Service provider ID is required' };

  const startTime = new Date(formData.get('startTime') as string);
  const endTime = new Date(formData.get('endTime') as string);
  const duration = parseInt(formData.get('duration') as string);

  const remainingSpots = calculateAvailableSpots({
    startTime,
    endTime,
    duration,
  });

  // Validate that we have at least one slot
  if (remainingSpots < 1) {
    return {
      error: 'Time slot is too short for the specified duration',
    };
  }

  const priceValue = parseFloat(formData.get('price') as string);

  const data = {
    date: new Date(formData.get('date') as string),
    startTime,
    endTime,
    duration,
    price: priceValue,
    isOnlineAvailable: formData.get('isOnlineAvailable') === 'true',
    isInPersonAvailable: formData.get('isInPersonAvailable') === 'true',
    location: formData.get('location') as string,
    isRecurring: formData.get('isRecurring') === 'true',
    recurringDays: JSON.parse((formData.get('recurringDays') as string) || '[]'),
    recurrenceEndDate: formData.get('recurrenceEndDate')
      ? new Date(formData.get('recurrenceEndDate') as string)
      : null,
    remainingSpots: remainingSpots,
    serviceProviderId: serviceProviderId,
  };

  const validatedFields = availabilityFormSchema.safeParse(data);

  if (!validatedFields.success) {
    const formattedErrors = validatedFields.error.flatten();
    console.log('Validation errors:', formattedErrors);

    return {
      error: 'Validation failed',
      fieldErrors: formattedErrors.fieldErrors,
      formErrors: formattedErrors.formErrors,
    };
  }

  const { date, ...dataWithoutDate } = validatedFields.data;
  const finalData = {
    ...dataWithoutDate,
    remainingSpots,
  };

  return { data: finalData };
}

export async function checkScheduleAccess(
  scheduleId: string,
  serviceProviderId: string
): Promise<{
  schedule?: Schedule;
  error?: string;
}> {
  const schedule = await prisma.availability.findFirst({
    where: {
      id: scheduleId,
      serviceProviderId,
    },
    include: {
      bookings: true,
    },
  });

  if (!schedule) {
    return { error: 'Schedule not found' };
  }

  if (schedule.bookings.some((booking) => booking.status === 'CONFIRMED')) {
    return { error: 'Cannot modify schedule with confirmed bookings' };
  }

  return { schedule };
}
