'use server';

import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

import { AvailabilityFormSchema, AvailabilityView, BookingFormSchema } from './types';

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
  endTime: Date
) {
  const availabilities = await prisma.availability.findMany({
    where: {
      serviceProviderId,
      startTime: {
        lte: endTime,
      },
      endTime: {
        gte: startTime,
      },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
  });

  if (availabilities.length > 0) {
    return {
      hasOverlap: true,
      overlappingPeriod: {
        startTime: availabilities[0].startTime,
        endTime: availabilities[0].endTime,
      },
    };
  }

  return { hasOverlap: false };
}

export async function checkAvailabilityModificationAllowed(
  availabilityId: string,
  serviceProviderId: string
): Promise<{
  availability?: AvailabilityView;
  error?: string;
}> {
  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      serviceProviderId,
    },
    include: {
      serviceProvider: true,
      availableServices: true,
      calculatedSlots: {
        include: {
          booking: {
            include: {
              client: true,
              bookedBy: true,
              serviceProvider: true,
              service: true,
              notifications: true,
              review: true,
            },
          },
          service: true,
        },
      },
    },
  });

  if (!availability) {
    return { error: 'Availability not found' };
  }

  if (availability.calculatedSlots.some((slot) => slot.booking?.status === 'CONFIRMED')) {
    return { error: 'Cannot modify availability with confirmed bookings' };
  }

  return { availability: availability as AvailabilityView };
}

export async function validateAvailabilityFormData(formData: FormData): Promise<{
  data?: z.infer<typeof AvailabilityFormSchema>;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}> {
  console.log('1. Starting validation with FormData:', Object.fromEntries(formData.entries()));

  try {
    // Parse the basic date/time fields
    const date = new Date(formData.get('date') as string);
    const startTime = new Date(formData.get('startTime') as string);
    const endTime = new Date(formData.get('endTime') as string);

    // Parse available services from form data
    const availableServices = [];
    const formEntries = Array.from(formData.entries());
    const serviceIndices = Array.from(
      new Set(
        formEntries
          .filter(([key]) => key.startsWith('availableServices'))
          .map(([key]) => key.match(/availableServices\[(\d+)\]/)?.[1])
          .filter(Boolean)
      )
    );

    console.log('2. Found service indices:', Array.from(serviceIndices));

    for (const index of serviceIndices) {
      const service = {
        serviceId: formData.get(`availableServices[${index}][serviceId]`) as string,
        duration: Number(formData.get(`availableServices[${index}][duration]`)),
        price: Number(formData.get(`availableServices[${index}][price]`)),
        isOnlineAvailable:
          formData.get(`availableServices[${index}][isOnlineAvailable]`) === 'true',
        isInPerson: formData.get(`availableServices[${index}][isInPerson]`) === 'true',
        location: (formData.get(`availableServices[${index}][location]`) as string) || null,
      };
      availableServices.push(service);
    }

    console.log('3. Parsed available services:', availableServices);

    // Construct the data object that matches AvailabilityFormSchema
    const validationData = {
      date,
      startTime,
      endTime,
      availableServices,
    };

    console.log('4. Validation data:', validationData);

    // Validate against the schema
    const result = await AvailabilityFormSchema.safeParseAsync(validationData);

    console.log('5. Validation result:', {
      success: result.success,
      ...(result.success ? {} : { error: result.error.format() }),
    });

    if (!result.success) {
      return {
        fieldErrors: result.error.flatten().fieldErrors,
        formErrors: result.error.flatten().formErrors,
      };
    }

    return { data: result.data };
  } catch (error) {
    console.error('6. Validation error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to validate form data',
    };
  }
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

export async function calculateAvailabilitySlots(
  formData: z.infer<typeof AvailabilityFormSchema>,
  availabilityId: string,
  availableServices: { id: string; serviceId: string; duration: number }[],
  existingSlots: {
    id: string;
    startTime: Date;
    endTime: Date;
    serviceId: string;
    serviceConfigId: string;
    status: string;
    booking?: { id: string } | null;
  }[] = []
) {
  // Slots to create
  const slots: Prisma.CalculatedAvailabilitySlotCreateManyInput[] = [];

  // Keep track of existing slots with bookings that we'll preserve
  const preservedSlotIds = new Set<string>();

  // First, identify slots with bookings to preserve
  const slotsWithBookings = existingSlots.filter((slot) => slot.booking);

  // Process each service configuration
  formData.availableServices.forEach((serviceConfig) => {
    const availableService = availableServices.find(
      (as) => as.serviceId === serviceConfig.serviceId
    );
    if (!availableService) return;

    let currentTime = new Date(formData.startTime);
    while (currentTime < formData.endTime) {
      const slotEnd = new Date(currentTime.getTime() + serviceConfig.duration * 60000);
      if (slotEnd <= formData.endTime) {
        // Check if this time slot overlaps with any existing booked slot
        const overlappingBookedSlot = slotsWithBookings.find(
          (slot) =>
            slot.serviceId === serviceConfig.serviceId &&
            ((currentTime >= slot.startTime && currentTime < slot.endTime) ||
              (slotEnd > slot.startTime && slotEnd <= slot.endTime) ||
              (currentTime <= slot.startTime && slotEnd >= slot.endTime))
        );

        // If there's an overlapping booked slot, preserve it and don't create a new one
        if (overlappingBookedSlot) {
          preservedSlotIds.add(overlappingBookedSlot.id);
        } else {
          // Otherwise, create a new slot
          slots.push({
            availabilityId,
            serviceId: serviceConfig.serviceId,
            serviceConfigId: availableService.id,
            startTime: currentTime,
            endTime: slotEnd,
            lastCalculated: new Date(),
            status: 'AVAILABLE',
          });
        }
      }
      currentTime = new Date(slotEnd.getTime());
    }
  });

  return {
    slotsToCreate: slots,
    slotIdsToPreserve: Array.from(preservedSlotIds),
  };
}

export async function calculateInitialAvailabilitySlots(
  formData: z.infer<typeof AvailabilityFormSchema>,
  availabilityId: string,
  availableServices: { id: string; serviceId: string; duration: number }[]
) {
  const slots: Prisma.CalculatedAvailabilitySlotCreateManyInput[] = [];

  formData.availableServices.forEach((serviceConfig) => {
    const availableService = availableServices.find(
      (as) => as.serviceId === serviceConfig.serviceId
    );
    if (!availableService) return;

    let currentTime = new Date(formData.startTime);
    while (currentTime < formData.endTime) {
      const slotEnd = new Date(currentTime.getTime() + serviceConfig.duration * 60000);
      if (slotEnd <= formData.endTime) {
        slots.push({
          availabilityId,
          serviceId: serviceConfig.serviceId,
          serviceConfigId: availableService.id,
          startTime: currentTime,
          endTime: slotEnd,
          lastCalculated: new Date(),
          status: 'AVAILABLE',
        });
      }
      currentTime = new Date(slotEnd.getTime());
    }
  });

  return slots;
}

export async function calculateNonOverlappingSlots(
  formData: z.infer<typeof AvailabilityFormSchema>,
  availabilityId: string,
  availableServices: { id: string; serviceId: string; duration: number }[],
  bookedTimeRanges: { serviceId: string; startTime: Date; endTime: Date }[]
) {
  const slots: Prisma.CalculatedAvailabilitySlotCreateManyInput[] = [];

  formData.availableServices.forEach((serviceConfig) => {
    const availableService = availableServices.find(
      (as) => as.serviceId === serviceConfig.serviceId
    );
    if (!availableService) return;

    // Get booked ranges for this service
    const serviceBookedRanges = bookedTimeRanges.filter(
      (range) => range.serviceId === serviceConfig.serviceId
    );

    let currentTime = new Date(formData.startTime);
    while (currentTime < formData.endTime) {
      const slotEnd = new Date(currentTime.getTime() + serviceConfig.duration * 60000);
      if (slotEnd <= formData.endTime) {
        // Check if this slot overlaps with any booked slot
        const overlapsWithBooking = serviceBookedRanges.some(
          (range) => currentTime < range.endTime && slotEnd > range.startTime
        );

        // Only create the slot if it doesn't overlap with a booking
        if (!overlapsWithBooking) {
          slots.push({
            availabilityId,
            serviceId: serviceConfig.serviceId,
            serviceConfigId: availableService.id,
            startTime: currentTime,
            endTime: slotEnd,
            lastCalculated: new Date(),
            status: 'AVAILABLE',
          });
        }
      }
      currentTime = new Date(slotEnd.getTime());
    }
  });

  return slots;
}
