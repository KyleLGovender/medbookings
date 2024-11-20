'use server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

import { Availability, availabilityFormSchema } from './types';

export async function createAvailability(
  formData: FormData
): Promise<{ data?: Availability; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized',
    };
  }

  try {
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!serviceProvider) {
      return {
        error: 'No service provider profile found',
      };
    }

    const recurringDaysString = formData.get('recurringDays') as string;
    const recurringDays = recurringDaysString ? JSON.parse(recurringDaysString) : [];

    const validatedFields = availabilityFormSchema.safeParse({
      startTime: new Date(formData.get('startTime') as string),
      endTime: new Date(formData.get('endTime') as string),
      duration: parseInt(formData.get('duration') as string, 10),
      price: parseFloat(formData.get('price') as string),
      isOnlineAvailable: formData.get('isOnlineAvailable') === 'true',
      isInPersonAvailable: formData.get('isInPersonAvailable') === 'true',
      location: formData.get('location'),
      isRecurring: formData.get('isRecurring') === 'true',
      recurringDays,
      recurrenceEndDate: formData.get('recurrenceEndDate')
        ? new Date(formData.get('recurrenceEndDate') as string)
        : undefined,
    });

    if (!validatedFields.success) {
      return {
        error: 'Invalid form data',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { data } = validatedFields;

    const availability = await prisma.availability.create({
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        price: data.price,
        isOnlineAvailable: data.isOnlineAvailable,
        isInPersonAvailable: data.isInPersonAvailable,
        location: data.location,
        isRecurring: data.isRecurring,
        recurringDays: data.recurringDays,
        recurrenceEndDate: data.recurrenceEndDate,
        maxBookings: 1,
        remainingSpots: 1,
        serviceProviderId: serviceProvider.id,
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
      error: 'Failed to create availability',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
