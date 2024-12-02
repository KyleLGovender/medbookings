'use server';

import { NotificationService } from '@/features/notifications/notification-service';
import { TemplateService } from '@/features/notifications/template-service';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedServiceProvider } from '@/lib/server-helper';

import {
  checkAvailabilityAccess,
  checkBookingAccess,
  checkForOverlappingAvailability,
  validateAvailabilityFormData,
  validateBookingFormData,
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

export async function createBooking(formData: FormData): Promise<{
  data?: Booking;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}> {
  try {
    // 1. Validate form data
    const validationResult = await validateBookingFormData(formData);
    if (!validationResult.data || validationResult.error) {
      return {
        error: validationResult.error,
        fieldErrors: validationResult.fieldErrors,
        formErrors: validationResult.formErrors,
      };
    }
    const data = validationResult.data;

    // 2. Check for service provider availability
    const availability = await prisma.availability.findFirst({
      where: {
        serviceProviderId: formData.get('serviceProviderId') as string,
        startTime: { lte: data.startTime },
        endTime: { gte: data.endTime },
      },
    });

    if (!availability) {
      return { error: 'No availability found for the requested time slot' };
    }

    // 3. Prepare booking data
    const bookingData: any = {
      serviceProvider: {
        connect: { id: formData.get('serviceProviderId') as string },
      },
      availability: { connect: { id: availability.id } },
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      price: data.price,
      isOnline: data.isOnline,
      location: data.location,
      notes: data.notes,
      status: 'PENDING',
    };

    // Add user or guest data
    if (data.bookingType === 'USER' && data.userId) {
      bookingData.client = { connect: { id: data.userId } };
    } else {
      bookingData.guestName = data.guestName;
      bookingData.guestEmail = data.guestEmail;
      bookingData.guestPhone = data.guestPhone;
      bookingData.guestWhatsapp = data.guestWhatsapp;
      bookingData.notifyViaEmail = data.notificationPreferences.email;
      bookingData.notifyViaSMS = data.notificationPreferences.sms;
      bookingData.notifyViaWhatsapp = data.notificationPreferences.whatsapp;
    }

    // 4. Create the booking
    const booking = await prisma.booking.create({
      data: bookingData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
            notificationPreferences: true,
          },
        },
      },
    });

    if (booking) {
      await sendBookingNotifications(booking);
    }

    return {
      data: {
        ...booking,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Create booking error:', error);
    return {
      error:
        error instanceof Error
          ? `Server error: ${error.message}`
          : 'Unexpected server error occurred',
    };
  }
}

export async function updateBooking(
  bookingId: string,
  formData: FormData
): Promise<{
  data?: Booking;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}> {
  try {
    // 1. Check access to the booking
    const { booking: existingBooking, error: accessError } = await checkBookingAccess(
      bookingId,
      formData.get('serviceProviderId') as string
    );
    if (accessError) {
      return { error: accessError };
    }

    // 2. Validate form data
    const validationResult = await validateBookingFormData(formData);
    if (!validationResult.data || validationResult.error) {
      return {
        error: validationResult.error,
        fieldErrors: validationResult.fieldErrors,
        formErrors: validationResult.formErrors,
      };
    }
    const data = validationResult.data;

    // 3. Check for service provider availability
    const availability = await prisma.availability.findFirst({
      where: {
        serviceProviderId: formData.get('serviceProviderId') as string,
        startTime: { lte: data.startTime },
        endTime: { gte: data.endTime },
      },
    });

    if (!availability) {
      return { error: 'No availability for the requested booking period' };
    }

    // 4. Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...data,
        availability: { connect: { id: availability.id } },
      },
      include: {
        client: true,
      },
    });

    return {
      data: {
        ...updatedBooking,
        startTime: updatedBooking.startTime.toISOString(),
        endTime: updatedBooking.endTime.toISOString(),
        createdAt: updatedBooking.createdAt.toISOString(),
        updatedAt: updatedBooking.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Update booking error:', error);
    return {
      error:
        error instanceof Error
          ? `Server error: ${error.message}`
          : 'Unexpected server error occurred',
    };
  }
}
