'use server';

import { z } from 'zod';

import { NotificationService } from '@/features/notifications/notification-service';
import { TemplateService } from '@/features/notifications/template-service';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import {
  calculateInitialAvailabilitySlots,
  checkAvailabilityModificationAllowed,
  checkBookingAccess,
  validateAvailabilityFormData,
  validateBookingFormData,
  validateBookingWithAvailability,
} from './server-helper';
import { AvailabilityFormResponse, Booking } from './types';

export async function createAvailability(formData: FormData): Promise<AvailabilityFormResponse> {
  try {
    const validationResult = await validateAvailabilityFormData(formData);
    console.log('Validation result:', validationResult);

    if ('error' in validationResult || !validationResult.data) {
      return validationResult;
    }

    const { data } = validationResult;
    console.log('Validated data:', data);

    // Check which configurations already exist
    const existingConfigs = await prisma.serviceAvailabilityConfig.findMany({
      where: {
        serviceProviderId: formData.get('serviceProviderId') as string,
        serviceId: {
          in: data.availableServices.map((s) => s.serviceId),
        },
      },
    });
    console.log('Existing configs:', existingConfigs);

    const existingServiceIds = new Set(existingConfigs.map((c) => c.serviceId));
    console.log('Existing service IDs:', Array.from(existingServiceIds));

    const availability = await prisma.availability.create({
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        serviceProvider: {
          connect: {
            id: formData.get('serviceProviderId') as string,
          },
        },
        availableServices: {
          connect: existingConfigs.map((config) => ({
            serviceId_serviceProviderId: {
              serviceId: config.serviceId,
              serviceProviderId: config.serviceProviderId,
            },
          })),
          create: data.availableServices
            .filter((service) => !existingServiceIds.has(service.serviceId))
            .map((service) => ({
              service: { connect: { id: service.serviceId } },
              serviceProvider: { connect: { id: formData.get('serviceProviderId') as string } },
              duration: service.duration,
              price: service.price,
              isOnlineAvailable: service.isOnlineAvailable,
              isInPerson: service.isInPerson,
              location: service.location,
            })),
        },
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
    console.log('Created availability:', availability);

    // Calculate initial slots
    const slotsToCreate = await calculateInitialAvailabilitySlots(
      data,
      availability.id,
      availability.availableServices
    );
    console.log('Slots to create:', slotsToCreate);

    // Create calculated slots
    const createdSlots = await prisma.calculatedAvailabilitySlot.createMany({
      data: slotsToCreate,
    });
    console.log('Created slots:', createdSlots);

    return {
      data: {
        startTime: availability.startTime,
        endTime: availability.endTime,
        availableServices: availability.availableServices.map((service) => ({
          serviceId: service.serviceId,
          duration: service.duration,
          price: Number(service.price),
          isOnlineAvailable: service.isOnlineAvailable,
          isInPerson: service.isInPerson,
          location: service.location || undefined,
        })),
      },
    };
  } catch (error) {
    console.error('Create availability error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create availability',
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
): Promise<AvailabilityFormResponse> {
  try {
    console.log('Starting update for availability:', availabilityId);
    const validationResult = await validateAvailabilityFormData(formData);
    console.log('Validation result:', validationResult);

    if ('error' in validationResult || !validationResult.data) {
      console.log('Validation failed:', validationResult);
      return validationResult;
    }

    const { data } = validationResult;
    console.log('Validated data:', data);

    // Check which configurations already exist
    const existingConfigs = await prisma.serviceAvailabilityConfig.findMany({
      where: {
        serviceProviderId: formData.get('serviceProviderId') as string,
        serviceId: {
          in: data.availableServices.map((s) => s.serviceId),
        },
      },
    });
    console.log('Existing configs:', existingConfigs);

    const existingServiceIds = new Set(existingConfigs.map((c) => c.serviceId));
    const newServiceIds = new Set(data.availableServices.map((s) => s.serviceId));
    console.log('Existing service IDs:', Array.from(existingServiceIds));
    console.log('New service IDs:', Array.from(newServiceIds));

    // Find services to disconnect
    const servicesToDisconnect = await prisma.serviceAvailabilityConfig.findMany({
      where: {
        serviceProviderId: formData.get('serviceProviderId') as string,
        serviceId: {
          notIn: Array.from(newServiceIds),
        },
      },
      select: {
        serviceId: true,
        serviceProviderId: true,
      },
    });
    console.log('Services to disconnect:', servicesToDisconnect);

    const availability = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        availableServices: {
          disconnect: servicesToDisconnect.map((config) => ({
            serviceId_serviceProviderId: {
              serviceId: config.serviceId,
              serviceProviderId: config.serviceProviderId,
            },
          })),
          connect: existingConfigs.map((config) => ({
            serviceId_serviceProviderId: {
              serviceId: config.serviceId,
              serviceProviderId: config.serviceProviderId,
            },
          })),
          create: data.availableServices
            .filter((service) => !existingServiceIds.has(service.serviceId))
            .map((service) => ({
              service: { connect: { id: service.serviceId } },
              serviceProvider: { connect: { id: formData.get('serviceProviderId') as string } },
              duration: service.duration,
              price: service.price,
              isOnlineAvailable: service.isOnlineAvailable,
              isInPerson: service.isInPerson,
              location: service.location,
            })),
        },
      },
      include: {
        availableServices: true,
      },
    });
    console.log('Updated availability:', availability);

    // Delete existing slots first
    const deletedSlots = await prisma.calculatedAvailabilitySlot.deleteMany({
      where: { availabilityId },
    });
    console.log('Deleted existing slots:', deletedSlots);

    // Create new calculated slots
    const calculatedSlots = await calculateInitialAvailabilitySlots(
      data,
      availability.id,
      availability.availableServices
    );
    console.log('New calculated slots:', calculatedSlots);

    const createdSlots = await prisma.calculatedAvailabilitySlot.createMany({
      data: calculatedSlots,
    });
    console.log('Created new slots:', createdSlots);

    return {
      data: {
        startTime: availability.startTime,
        endTime: availability.endTime,
        availableServices: availability.availableServices.map((service) => ({
          serviceId: service.serviceId,
          duration: service.duration,
          price: Number(service.price),
          isOnlineAvailable: service.isOnlineAvailable,
          isInPerson: service.isInPerson,
          location: service.location || undefined,
        })),
      },
    };
  } catch (error) {
    console.error('Update availability error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return {
      error: error instanceof Error ? error.message : 'Failed to update availability',
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
