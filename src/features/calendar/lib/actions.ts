'use server';

import { prisma } from '@/lib/prisma';
import { getAuthenticatedServiceProvider } from '@/lib/server-helper';

import {
  checkAvailabilityAccess,
  checkForOverlappingAvailability,
  validateAvailabilityFormData,
} from './server-helper';
import { Availability } from './types';

export async function createAvailability(formData: FormData): Promise<{
  data?: Availability;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}> {
  try {
    // 1. Validate form data
    const validationResult = await validateAvailabilityFormData(formData);
    if (!validationResult.data || validationResult.error) {
      return {
        error: validationResult.error,
        fieldErrors: validationResult.fieldErrors,
        formErrors: validationResult.formErrors,
      };
    }
    const data = validationResult.data;

    // 2. Check for overlapping availability
    const overlap = await checkForOverlappingAvailability(
      formData.get('serviceProviderId') as string,
      data.startTime,
      data.endTime,
      data.isRecurring,
      data.recurringDays,
      data.recurrenceEndDate
    );

    if (overlap.hasOverlap) {
      return { error: 'This time slot overlaps with existing availability' };
    }

    // Create the availability
    const availability = await prisma.availability.create({
      data: {
        ...data,
        serviceProvider: {
          connect: {
            id: formData.get('serviceProviderId') as string,
          },
        },
      },
    });

    return {
      data: {
        ...availability,
        startTime: availability.startTime.toISOString(),
        endTime: availability.endTime.toISOString(),
        recurrenceEndDate: availability.recurrenceEndDate?.toISOString() || null,
        price: Number(availability.price),
        location: availability.location || '',
        createdAt: availability.createdAt.toISOString(),
        updatedAt: availability.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Create availability error:', error);
    return {
      error:
        error instanceof Error
          ? `Server error: ${error.message}`
          : 'Unexpected server error occurred',
    };
  }
}

// TODO: Implement deleteBooking function
export async function deleteBooking(
  bookingId: string
): Promise<{ success?: boolean; error?: string }> {
  // TODO: Add implementation
  return { error: 'Not implemented' }; // Temporary return until implementation
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
  const serviceProviderId = formData.get('serviceProviderId') as string;
  if (!serviceProviderId) return { error: 'Service provider ID is required' };

  try {
    const { availability, error: accessError } = await checkAvailabilityAccess(
      availabilityId,
      serviceProviderId
    );
    if (accessError) {
      return { error: accessError };
    }

    const { data, error: validationError } = await validateAvailabilityFormData(formData);

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
        ).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })} - ${new Date(overlappingPeriod!.endTime).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })})`,
      };
    }

    console.log('Updated data:', data);

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
