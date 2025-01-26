'use server';

import { z } from 'zod';

import { calculateAvailableSpots } from '@/features/calendar/lib/helper';
import { prisma } from '@/lib/prisma';

import { AvailabilityFormSchema, BookingFormSchema, Schedule } from './types';

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

  const validatedFields = AvailabilityFormSchema.safeParse(data);

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
      calculatedSlots: {
        include: {
          booking: true,
        },
      },
    },
  });

  if (!schedule) {
    return { error: 'Schedule not found' };
  }

  if (schedule.calculatedSlots.some((slot) => slot.booking?.status === 'CONFIRMED')) {
    return { error: 'Cannot modify schedule with confirmed bookings' };
  }

  return { schedule };
}

export async function validateBookingWithAvailability(
  data: z.infer<typeof BookingFormSchema>,
  availability: z.infer<typeof AvailabilitySchema> & { bookings: any[] }
): Promise<{
  isValid: boolean;
  error?: string;
  path?: string[];
}> {
  // Add online/in-person validation here while keeping existing validation
  if (data.isOnline && !availability.isOnlineAvailable) {
    return {
      isValid: false,
      error: 'Online bookings are not available for this time slot',
      path: ['isOnline'],
    };
  }

  if (data.isInPerson && !availability.isInPersonAvailable) {
    return {
      isValid: false,
      error: 'In-person bookings are not available for this time slot',
      path: ['isInPerson'],
    };
  }

  // Validate location for in-person bookings
  if (data.isInPerson && !data.location?.trim()) {
    return {
      isValid: false,
      error: 'Location is required for in-person bookings',
      path: ['location'],
    };
  }

  // 1. Validate booking is within availability time range
  const bookingStart = new Date(data.startTime);
  const bookingEnd = new Date(data.endTime);
  const availabilityStart = new Date(availability.startTime);
  const availabilityEnd = new Date(availability.endTime);

  if (bookingStart < availabilityStart || bookingEnd > availabilityEnd) {
    return {
      isValid: false,
      error: 'Booking must be within availability time range',
      path: ['startTime'],
    };
  }

  // 2. Validate duration matches availability settings
  if (data.duration !== availability.duration) {
    return {
      isValid: false,
      error: 'Booking duration must match availability duration',
      path: ['duration'],
    };
  }

  // 3. Validate against maxBookings
  if (availability.maxBookings) {
    const existingBookingsCount = availability.bookings.length;
    if (existingBookingsCount >= availability.maxBookings) {
      return {
        isValid: false,
        error: 'Maximum number of bookings reached for this availability',
        path: ['availabilityId'],
      };
    }
  }

  // 4. Validate price matches availability
  if (data.price !== availability.price) {
    return {
      isValid: false,
      error: 'Booking price must match availability price',
      path: ['price'],
    };
  }

  // 5. Check for overlapping bookings
  const hasOverlap = availability.bookings.some((booking) => {
    const existingStart = new Date(booking.startTime);
    const existingEnd = new Date(booking.endTime);
    return bookingStart < existingEnd && bookingEnd > existingStart;
  });

  if (hasOverlap) {
    return {
      isValid: false,
      error: 'This time slot overlaps with an existing booking',
      path: ['startTime'],
    };
  }

  return { isValid: true };
}

export async function validateBookingFormData(formData: FormData): Promise<{
  data?: z.infer<typeof BookingFormSchema>;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}> {
  const validationResult = await BookingFormSchema.safeParseAsync(formData);

  if (!validationResult.success) {
    return {
      fieldErrors: validationResult.error.flatten().fieldErrors,
      formErrors: validationResult.error.flatten().formErrors,
    };
  }

  return { data: validationResult.data };
}

export async function checkBookingAccess(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      serviceProvider: {
        include: {
          user: true,
        },
      },
      client: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Check if user is the service provider or the client
  const isServiceProvider = booking.serviceProvider.userId === userId;
  const isClient = booking.clientId === userId;

  if (!isServiceProvider && !isClient) {
    throw new Error('Unauthorized access to booking');
  }

  return booking;
}
