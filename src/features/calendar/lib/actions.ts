'use server';

import { getAuthenticatedServiceProvider } from '@/lib/helper';
import { prisma } from '@/lib/prisma';

import {
  checkAvailabilityAccess,
  checkForOverlappingAvailability,
  validateAvailabilityFormData,
} from './server-helper';
import { Availability } from './types';

export async function createAvailability(
  formData: FormData
): Promise<{ data?: Availability; error?: string }> {
  const { serviceProviderId, error: authError } = await getAuthenticatedServiceProvider();
  if (authError) return { error: authError };

  try {
    const { data, error: validationError } = validateAvailabilityFormData(formData);
    if (validationError) {
      return { error: validationError };
    }

    // Check for overlapping availability
    const { hasOverlap, overlappingPeriod } = await checkForOverlappingAvailability(
      serviceProviderId!,
      new Date(data.startTime),
      new Date(data.endTime),
      data.isRecurring,
      data.recurringDays,
      data.recurrenceEndDate
    );

    if (hasOverlap) {
      return {
        error: `Cannot create availability: Overlaps with existing period (${new Date(
          overlappingPeriod!.startTime
        ).toLocaleString()} - ${new Date(overlappingPeriod!.endTime).toLocaleString()})`,
      };
    }

    const availability = await prisma.availability.create({
      data: {
        ...data,
        maxBookings: 1,
        remainingSpots: 1,
        serviceProviderId: serviceProviderId!,
      },
    });

    return {
      data: {
        ...availability,
        price: Number(availability.price),
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create availability',
    };
  }
}

export async function deleteAvailability(
  availabilityId: string
): Promise<{ success?: boolean; error?: string }> {
  const { serviceProviderId, error: authError } = await getAuthenticatedServiceProvider();
  if (authError) return { error: authError };

  try {
    const { availability, error: accessError } = await checkAvailabilityAccess(
      availabilityId,
      serviceProviderId!
    );

    if (accessError) {
      return { error: accessError };
    }

    await prisma.availability.delete({
      where: { id: availabilityId },
    });

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Failed to delete availability: ${error.message}`
          : 'Failed to delete availability',
    };
  }
}

export async function updateAvailability(
  availabilityId: string,
  formData: FormData
): Promise<{ data?: Availability; error?: string }> {
  const { serviceProviderId, error: authError } = await getAuthenticatedServiceProvider();
  if (authError) return { error: authError };

  try {
    const { availability, error: accessError } = await checkAvailabilityAccess(
      availabilityId,
      serviceProviderId!
    );
    if (accessError) {
      return { error: accessError };
    }

    const { data, error: validationError } = validateAvailabilityFormData(formData);
    if (validationError) {
      return { error: validationError };
    }

    // Check for overlapping availability
    const { hasOverlap, overlappingPeriod } = await checkForOverlappingAvailability(
      serviceProviderId!,
      new Date(data.startTime),
      new Date(data.endTime),
      data.isRecurring,
      data.recurringDays,
      data.recurrenceEndDate,
      availabilityId // Exclude current availability
    );

    if (hasOverlap) {
      return {
        error: `Cannot update availability: Overlaps with existing period (${new Date(
          overlappingPeriod!.startTime
        ).toLocaleString()} - ${new Date(overlappingPeriod!.endTime).toLocaleString()})`,
      };
    }

    const updated = await prisma.availability.update({
      where: { id: availabilityId },
      data,
    });

    return {
      data: {
        ...updated,
        price: Number(updated.price),
      },
    };
  } catch (error) {
    return {
      error: 'Failed to update availability',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
