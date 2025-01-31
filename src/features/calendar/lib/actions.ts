'use server';

import { z } from 'zod';

import { NotificationService } from '@/features/notifications/notification-service';
import { TemplateService } from '@/features/notifications/template-service';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import {
  calculateAvailabilitySlots,
  checkAvailabilityModificationAllowed,
  checkBookingAccess,
  checkForOverlappingAvailability,
  validateAvailabilityFormData,
  validateBookingFormData,
  validateBookingWithAvailability,
} from './server-helper';
import { Availability, Booking } from './types';

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
        calculatedSlots: {
          createMany: {
            data: calculateAvailabilitySlots(data, data.startTime, data.endTime),
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

export async function deleteAvailability(
  availabilityId: string,
  serviceProviderId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { error } = await checkAvailabilityModificationAllowed(availabilityId, serviceProviderId);
    if (error) {
      return { error };
    }

    // If no access issues or confirmed bookings, proceed with deletion
    await prisma.$transaction([
      // First delete all calculated slots
      prisma.calculatedAvailabilitySlot.deleteMany({
        where: { availabilityId },
      }),
      // Then delete the availability itself
      prisma.availability.delete({
        where: { id: availabilityId },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Delete availability error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete availability',
    };
  }
}

export async function updateAvailability(
  availabilityId: string,
  formData: FormData
): Promise<{
  data?: Availability;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}> {
  const serviceProviderId = formData.get('serviceProviderId') as string;
  if (!serviceProviderId) return { error: 'Service provider ID is required' };

  try {
    const { availability, error: accessError } = await checkAvailabilityModificationAllowed(
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

    // First delete existing slots
    await prisma.calculatedAvailabilitySlot.deleteMany({
      where: { availabilityId },
    });

    // Then update availability with new data and create new slots
    const updated = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        ...data,
        calculatedSlots: {
          createMany: {
            data: calculateAvailabilitySlots(
              { ...data, id: availabilityId },
              data.startTime,
              data.endTime
            ),
          },
        },
      },
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

export async function lookupUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        notificationPreferences: {
          select: {
            email: true,
            sms: true,
            whatsapp: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    console.error('User lookup error:', error);
    return null;
  }
}

async function sendBookingNotifications(booking: Booking) {
  const notificationPromises = [];
  const template = TemplateService.getBookingConfirmationTemplate(
    booking,
    booking.client?.name || booking.guestName
  );

  if (booking.client) {
    // Handle registered user notifications
    const recipient = {
      name: booking.client.name,
      email: booking.client.email,
      phone: booking.client.phone,
      whatsapp: booking.client.whatsapp,
    };

    if (booking.client.notificationPreferences?.email && recipient.email) {
      notificationPromises.push(NotificationService.sendEmail(recipient, template));
    }
    if (booking.client.notificationPreferences?.sms && recipient.phone) {
      notificationPromises.push(NotificationService.sendSMS(recipient, template));
    }
    if (booking.client.notificationPreferences?.whatsapp && recipient.whatsapp) {
      notificationPromises.push(NotificationService.sendWhatsApp(recipient, template));
    }
  } else {
    // Handle guest notifications
    const recipient = {
      name: booking.guestName,
      email: booking.guestEmail,
      phone: booking.guestPhone,
      whatsapp: booking.guestWhatsapp,
    };

    if (booking.notifyViaEmail && recipient.email) {
      notificationPromises.push(NotificationService.sendEmail(recipient, template));
    }
    if (booking.notifyViaSMS && recipient.phone) {
      notificationPromises.push(NotificationService.sendSMS(recipient, template));
    }
    if (booking.notifyViaWhatsapp && recipient.whatsapp) {
      notificationPromises.push(NotificationService.sendWhatsApp(recipient, template));
    }
  }

  // Send all notifications in parallel
  const results = await Promise.allSettled(notificationPromises);

  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Notification ${index} failed:`, result.reason);
    }
  });
}

type BookingResponse = {
  data?: Booking;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

export async function createBooking(formData: FormData): Promise<BookingResponse> {
  try {
    // 1. Parse and validate form data with Zod schema
    const { data: validated, fieldErrors, formErrors } = await validateBookingFormData(formData);
    if (!validated) {
      return { fieldErrors, formErrors };
    }

    // 2. Fetch and validate availability
    const availability = await prisma.availability.findUnique({
      where: { id: validated.availabilityId },
      include: { bookings: true },
    });

    if (!availability) {
      return { error: 'No availability found for the requested time slot' };
    }

    // 3. Validate booking against availability
    const validationResponse = await validateBookingWithAvailability(validated, availability);
    if (!validationResponse.isValid) {
      return {
        error: validationResponse.error,
        fieldErrors: validationResponse.path
          ? { [validationResponse.path[0]]: [validationResponse.error!] }
          : undefined,
      };
    }

    // 4. Create the booking
    const booking = await prisma.booking.create({
      data: {
        ...validated,
        availabilityId: availability.id,
      },
      include: {
        client: true,
      },
    });

    // 5. Format and return the response
    return {
      data: {
        ...booking,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
        cancelledAt: booking.cancelledAt?.toISOString() || null,
        price: Number(booking.price),
        client: booking.client
          ? {
              id: booking.client.id,
              name: booking.client.name,
              email: booking.client.email,
              phone: booking.client.phone,
              whatsapp: booking.client.whatsapp,
            }
          : undefined,
        guestName: null,
        guestEmail: null,
        guestPhone: null,
        guestWhatsapp: null,
      },
    };
  } catch (error) {
    console.error('Create booking error:', error);

    // Handle specific known errors
    if (error instanceof z.ZodError) {
      return {
        error: 'Validation failed',
        formErrors: [error.message],
      };
    }

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        error: 'Invalid notification preferences format',
      };
    }

    // Handle generic errors
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function updateBooking(
  bookingId: string,
  formData: FormData
): Promise<BookingResponse> {
  try {
    // Get the authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Not authenticated' };
    }

    // 1. Parse and validate form data with Zod schema
    const { data: validated, fieldErrors, formErrors } = await validateBookingFormData(formData);
    if (!validated) {
      return { fieldErrors, formErrors };
    }

    // 2. Fetch and validate availability
    const availability = await prisma.availability.findUnique({
      where: { id: validated.availabilityId },
      include: { bookings: true },
    });

    if (!availability) {
      return { error: 'No availability found for the requested time slot' };
    }

    // 3. Validate booking against availability
    const validationResponse = await validateBookingWithAvailability(validated, availability);
    if (!validationResponse.isValid) {
      return {
        error: validationResponse.error,
        fieldErrors: validationResponse.path
          ? { [validationResponse.path[0]]: [validationResponse.error!] }
          : undefined,
      };
    }

    // 4. Check access to the booking using the user's ID
    const { booking: existingBooking, error: accessError } = await checkBookingAccess(
      bookingId,
      currentUser.id
    );
    if (accessError) {
      return { error: accessError };
    }

    // 5. Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: validated,
      include: {
        client: true,
      },
    });

    // 6. Format and return the response
    return {
      data: {
        ...updatedBooking,
        startTime: updatedBooking.startTime.toISOString(),
        endTime: updatedBooking.endTime.toISOString(),
        createdAt: updatedBooking.createdAt.toISOString(),
        updatedAt: updatedBooking.updatedAt.toISOString(),
        cancelledAt: updatedBooking.cancelledAt?.toISOString() || null,
        price: Number(updatedBooking.price),
        client: updatedBooking.client
          ? {
              id: updatedBooking.client.id,
              name: updatedBooking.client.name,
              email: updatedBooking.client.email,
              phone: updatedBooking.client.phone,
              whatsapp: updatedBooking.client.whatsapp,
            }
          : undefined,
      },
    };
  } catch (error) {
    console.error('Update booking error:', error);

    // Handle specific known errors
    if (error instanceof z.ZodError) {
      return {
        error: 'Validation failed',
        formErrors: [error.message],
      };
    }

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        error: 'Invalid notification preferences format',
      };
    }

    // Handle generic errors
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function deleteBooking(
  bookingId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Get the authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Not authenticated' };
    }

    // Check access to the booking
    const { booking, error: accessError } = await checkBookingAccess(bookingId, currentUser.id);
    if (accessError) {
      return { error: accessError };
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return { success: true };
  } catch (error) {
    console.error('Delete booking error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete booking',
    };
  }
}
