'use server';

import { z } from 'zod';

import { calculateAvailableSpots } from '@/features/calendar/lib/helper';
import { prisma } from '@/lib/prisma';

import { type BookingFormData, BookingFormSchema, availabilityFormSchema } from './types';

function hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && start2 < end1;
}

function hasTimeOfDayOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  // Convert to minutes since midnight for comparison
  const getMinutesSinceMidnight = (date: Date) => date.getHours() * 60 + date.getMinutes();

  const start1Minutes = getMinutesSinceMidnight(start1);
  const end1Minutes = getMinutesSinceMidnight(end1);
  const start2Minutes = getMinutesSinceMidnight(start2);
  const end2Minutes = getMinutesSinceMidnight(end2);

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

export async function checkForOverlappingAvailability(
  serviceProviderId: string,
  startTime: Date,
  endTime: Date,
  isRecurring: boolean = false,
  recurringDays?: number[],
  recurrenceEndDate?: Date | null,
  excludeAvailabilityId?: string
) {
  const availabilities = await prisma.availability.findMany({
    where: {
      serviceProviderId,
      ...(excludeAvailabilityId ? { NOT: { id: excludeAvailabilityId } } : {}),
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      isRecurring: true,
      recurringDays: true,
      recurrenceEndDate: true,
    },
  });

  for (const existing of availabilities) {
    if (!existing.isRecurring && !isRecurring) {
      const hasOverlap = hasTimeOverlap(startTime, endTime, existing.startTime, existing.endTime);
      if (hasOverlap) {
        return {
          hasOverlap: true,
          overlappingPeriod: {
            startTime: existing.startTime,
            endTime: existing.endTime,
          },
        };
      }
    } else if (existing.isRecurring || isRecurring) {
      const existingEndDate =
        existing.recurrenceEndDate ||
        new Date(
          existing.startTime.getFullYear() + 1,
          existing.startTime.getMonth(),
          existing.startTime.getDate()
        );
      const newEndDate =
        recurrenceEndDate ||
        new Date(startTime.getFullYear() + 1, startTime.getMonth(), startTime.getDate());

      const dateRangeOverlap = hasTimeOverlap(
        startTime,
        newEndDate,
        existing.startTime,
        existingEndDate
      );

      if (dateRangeOverlap) {
        const existingDays = new Set(existing.recurringDays);
        const newDays = new Set(isRecurring ? recurringDays : [startTime.getDay()]);

        const hasOverlappingDay = [...existingDays].some((day) => newDays.has(day));

        if (hasOverlappingDay) {
          const timeOverlap = hasTimeOfDayOverlap(
            startTime,
            endTime,
            existing.startTime,
            existing.endTime
          );

          if (timeOverlap) {
            return {
              hasOverlap: true,
              overlappingPeriod: {
                startTime: existing.startTime,
                endTime: existing.endTime,
              },
            };
          }
        }
      }
    }
  }

  return { hasOverlap: false };
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

export async function validateBookingFormData(formData: FormData): Promise<{
  data?: BookingFormData;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}> {
  try {
    const rawData = {
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      clientId: formData.get('clientId'),
      serviceProviderId: formData.get('serviceProviderId'),
      availabilityId: formData.get('availabilityId'),
      notes: formData.get('notes'),
      status: formData.get('status'),
      clientName: formData.get('clientName'),
      clientEmail: formData.get('clientEmail'),
      clientPhone: formData.get('clientPhone'),
      duration: parseInt(formData.get('duration') as string),
      price: parseFloat(formData.get('price') as string),
      isOnline: formData.get('isOnline') === 'true',
      location: formData.get('location'),
      notificationPreferences: {
        email: formData.get('notificationPreferences.email') === 'true',
        sms: formData.get('notificationPreferences.sms') === 'true',
      },
    };

    const validatedData = BookingFormSchema.parse(rawData);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      return { fieldErrors };
    }
    return { error: 'Invalid form data' };
  }
}

export async function checkBookingAccess(
  bookingId: string,
  serviceProviderId: string
): Promise<{
  booking?: any;
  error?: string;
}> {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        serviceProviderId: serviceProviderId,
      },
    });

    if (!booking) {
      return {
        error: 'Booking not found or you do not have permission to access it',
      };
    }

    return { booking };
  } catch (error) {
    console.error('Check booking access error:', error);
    return {
      error: 'Failed to verify booking access',
    };
  }
}
