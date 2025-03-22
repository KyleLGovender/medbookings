'use server';

import { revalidatePath } from 'next/cache';

import { BookingStatus, NotificationChannel, SlotStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import {
  calculateInitialAvailabilitySlots,
  calculateNonOverlappingSlots,
  checkBookingAccess,
  sendBookingNotifications,
  validateAvailabilityFormData,
  validateBookingFormData,
  validateBookingWithAvailability,
} from './server-helper';
import { AvailabilityFormResponse, BookingFormSchema, BookingResponse, BookingView } from './types';

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
    // First, check if the availability exists and belongs to the service provider
    const availability = await prisma.availability.findFirst({
      where: {
        id: availabilityId,
        serviceProviderId,
      },
      include: {
        calculatedSlots: {
          include: {
            booking: {
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    if (!availability) {
      return { error: 'Availability not found' };
    }

    // Check if any slots have associated bookings (of any status)
    const slotsWithBookings = availability.calculatedSlots.filter((slot) => slot.booking);

    if (slotsWithBookings.length > 0) {
      // Get the statuses of the bookings for a more informative error message
      const bookingStatuses = slotsWithBookings.map((slot) => slot.booking?.status);
      const uniqueStatuses = Array.from(new Set(bookingStatuses)).join(', ');

      return {
        error: `Cannot delete availability with existing bookings (${uniqueStatuses}). Cancel the bookings first.`,
      };
    }

    // If no bookings, proceed with deletion
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

    // 1. First, check if there are any bookings associated with this availability
    const existingSlots = await prisma.calculatedAvailabilitySlot.findMany({
      where: { availabilityId },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            serviceId: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    const bookedSlots = existingSlots.filter((slot) => slot.booking);

    // 2. If there are bookings, perform safety checks
    if (bookedSlots.length > 0) {
      // Check if the new time range would exclude any booked slots
      const newStartTime = data.startTime;
      const newEndTime = data.endTime;

      // Get the original availability to compare
      const originalAvailability = await prisma.availability.findUnique({
        where: { id: availabilityId },
      });

      if (!originalAvailability) {
        return { error: 'Availability not found' };
      }

      // Ensure new time range doesn't exclude any booked slots
      for (const slot of bookedSlots) {
        if (slot.startTime < newStartTime || slot.endTime > newEndTime) {
          return {
            error: 'Cannot modify availability: new time range would exclude existing bookings',
          };
        }
      }

      // Get all service IDs that have bookings
      const bookedServiceIds = new Set(
        bookedSlots
          .map((slot) => slot.booking?.serviceId)
          .filter((id): id is string => id !== undefined)
      );

      // Ensure all services with bookings are still included in the update
      const updatedServiceIds = new Set(data.availableServices.map((s) => s.serviceId));

      for (const serviceId of Array.from(bookedServiceIds)) {
        if (!updatedServiceIds.has(serviceId)) {
          return {
            error: `Cannot remove service with ID ${serviceId} as it has existing bookings`,
          };
        }
      }
    }

    // 3. Check which configurations already exist
    const existingConfigs = await prisma.serviceAvailabilityConfig.findMany({
      where: {
        serviceProviderId: formData.get('serviceProviderId') as string,
        serviceId: {
          in: data.availableServices.map((s) => s.serviceId),
        },
      },
    });

    const existingServiceIds = new Set(existingConfigs.map((c) => c.serviceId));

    // 4. Update the availability
    const availability = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        availableServices: {
          // Connect existing configs
          connect: existingConfigs.map((config) => ({
            serviceId_serviceProviderId: {
              serviceId: config.serviceId,
              serviceProviderId: config.serviceProviderId,
            },
          })),
          // Create new configs for services that don't exist yet
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

    // 5. Handle slot updates carefully
    if (bookedSlots.length > 0) {
      // For availabilities with bookings, we need to be careful

      // Get all slots that don't have bookings
      const nonBookedSlotIds = existingSlots.filter((slot) => !slot.booking).map((slot) => slot.id);

      // Only delete slots that don't have bookings
      if (nonBookedSlotIds.length > 0) {
        await prisma.calculatedAvailabilitySlot.deleteMany({
          where: {
            id: { in: nonBookedSlotIds },
          },
        });
      }

      // Calculate new slots, but exclude time ranges that already have bookings
      const bookedTimeRanges = bookedSlots.map((slot) => ({
        serviceId: slot.serviceId,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));

      // Create new slots that don't overlap with existing bookings
      const newSlots = await calculateNonOverlappingSlots(
        data,
        availability.id,
        availability.availableServices,
        bookedTimeRanges
      );

      if (newSlots.length > 0) {
        await prisma.calculatedAvailabilitySlot.createMany({
          data: newSlots,
        });
      }
    } else {
      // If no bookings, we can safely delete all slots and recreate them
      await prisma.calculatedAvailabilitySlot.deleteMany({
        where: { availabilityId },
      });

      const calculatedSlots = await calculateInitialAvailabilitySlots(
        data,
        availability.id,
        availability.availableServices
      );

      await prisma.calculatedAvailabilitySlot.createMany({
        data: calculatedSlots,
      });
    }

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

export async function createBooking(formData: FormData): Promise<BookingResponse> {
  try {
    // Extract form data
    const data = {
      slotId: formData.get('slotId') as string,
      bookingType: formData.get('bookingType') as any,
      notificationPreferences: {
        email: formData.get('notifyViaEmail') === 'true',
        sms: formData.get('notifyViaSMS') === 'true',
        whatsapp: formData.get('notifyViaWhatsapp') === 'true',
      },
      guestInfo: {
        name: formData.get('guestName') as string,
        email: (formData.get('guestEmail') as string) || undefined,
        phone: (formData.get('guestPhone') as string) || undefined,
        whatsapp: (formData.get('guestWhatsapp') as string) || undefined,
      },
      // Explicitly handle the terms and conditions field
      agreeToTerms: formData.get('agreeToTerms') === 'true',
    };

    // Log the data for debugging
    console.log('Server received data:', data);
    console.log('Terms and conditions value:', formData.get('agreeToTerms'));

    // Validate using the existing schema
    const validationResult = BookingFormSchema.safeParse(data);

    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.format());
      return {
        error: 'Validation failed',
        fieldErrors: validationResult.error.flatten().fieldErrors,
      };
    }

    const validatedData = validationResult.data;
    const appointmentType = formData.get('appointmentType') as string;

    // Fetch the slot to get related data
    const slot = await prisma.calculatedAvailabilitySlot.findUnique({
      where: { id: validatedData.slotId },
      include: {
        service: true,
        serviceConfig: {
          include: {
            serviceProvider: true,
          },
        },
      },
    });

    if (!slot) {
      return { error: 'Slot not found' };
    }

    if (slot.status !== SlotStatus.AVAILABLE) {
      return { error: 'This slot is no longer available' };
    }

    // Create the booking in a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the slot status to BOOKED
      const updatedSlot = await tx.calculatedAvailabilitySlot.update({
        where: { id: validatedData.slotId },
        data: { status: SlotStatus.BOOKED },
      });

      // 2. Create the booking
      const booking = await tx.booking.create({
        data: {
          slotId: slot.id,
          serviceProviderId: slot.serviceConfig.serviceProviderId,
          serviceId: slot.serviceId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.serviceConfig.duration,
          price: slot.serviceConfig.price,
          isOnline: appointmentType === 'online',
          isInPerson: appointmentType === 'inperson',
          location: appointmentType === 'inperson' ? slot.serviceConfig.location : null,
          status: BookingStatus.PENDING,
          guestName: validatedData.guestInfo?.name,
          guestEmail: validatedData.guestInfo?.email,
          guestPhone: validatedData.guestInfo?.phone,
          guestWhatsapp: validatedData.guestInfo?.whatsapp,
        },
        include: {
          slot: {
            include: {
              serviceConfig: true,
            },
          },
          service: true,
          client: {
            include: {
              notificationPreferences: true,
            },
          },
          serviceProvider: {
            include: {
              user: true,
            },
          },
        },
      });

      return booking;
    });

    if (!result.slot) {
      throw new Error('Booking slot not found');
    }

    const bookingView: BookingView = {
      id: result.id,
      bookingType: validatedData.bookingType,
      notificationPreferences: {
        email: validatedData.notificationPreferences.email,
        sms: validatedData.notificationPreferences.sms,
        whatsapp: validatedData.notificationPreferences.whatsapp,
      },
      guestInfo: validatedData.guestInfo
        ? {
            name: validatedData.guestInfo.name,
            email: validatedData.guestInfo.email,
            phone: validatedData.guestInfo.phone,
            whatsapp: validatedData.guestInfo.whatsapp,
          }
        : { name: '', email: undefined, phone: undefined, whatsapp: undefined },
      agreeToTerms: validatedData.agreeToTerms,
      slot: {
        id: result.slot.id,
        startTime: result.slot.startTime,
        endTime: result.slot.endTime,
        status: result.slot.status,
        service: {
          id: result.service.id,
          name: result.service.name,
          description: result.service.description ?? undefined,
          displayPriority: result.service.displayPriority,
        },
        serviceConfig: {
          id: result.slot.serviceConfig.id,
          price: Number(result.slot.serviceConfig.price),
          duration: result.slot.serviceConfig.duration,
          isOnlineAvailable: result.slot.serviceConfig.isOnlineAvailable,
          isInPerson: result.slot.serviceConfig.isInPerson,
          location: result.slot.serviceConfig.location ?? undefined,
        },
        serviceProvider: {
          id: result.serviceProvider.id,
          name: result.serviceProvider.name,
          email: result.serviceProvider.user.email ?? undefined,
          whatsapp: result.serviceProvider.user.whatsapp ?? undefined,
          image: result.serviceProvider.user.image ?? undefined,
        },
      },
    };

    // Send notifications
    await sendBookingNotifications(bookingView);

    // Revalidate relevant paths to update UI
    revalidatePath(`/calendar/service-provider/${slot.serviceConfig.serviceProviderId}`);
    revalidatePath('/dashboard/bookings');

    return {
      data: {
        bookingId: result.id,
      },
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create booking',
    };
  }
}

// Helper function to log notifications instead of sending them
async function logBookingNotification(
  bookingId: string,
  serviceProviderId: string,
  type:
    | 'BOOKING_CONFIRMATION'
    | 'BOOKING_REMINDER'
    | 'BOOKING_CANCELLATION'
    | 'BOOKING_MODIFICATION',
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP'
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceProvider: true,
        service: true,
      },
    });

    if (!booking) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      channel,
      bookingId,
      serviceProviderId,
      guestName: booking.guestName || 'Unknown Guest',
      serviceName: booking.service.name,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      confirmationLink: `/dashboard/bookings/confirm/${bookingId}`,
      declineLink: `/dashboard/bookings/decline/${bookingId}`,
    };

    // Create logs directory if it doesn't exist
    const logsDir = join(process.cwd(), 'logs');
    await writeFile(
      join(logsDir, `booking-notifications-${randomUUID()}.json`),
      JSON.stringify(logEntry, null, 2),
      { flag: 'a' }
    ).catch(() => {
      // If the directory doesn't exist, create it and try again
      return writeFile(
        join(process.cwd(), `booking-notification-${randomUUID()}.json`),
        JSON.stringify(logEntry, null, 2)
      );
    });

    // Also create a DB entry for the notification
    await prisma.notificationLog.create({
      data: {
        bookingId,
        type: type,
        channel: channel as NotificationChannel,
        content: JSON.stringify(logEntry),
        status: 'SENT',
      },
    });
  } catch (error) {
    console.error('Error logging notification:', error);
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

    // First, get the booking to find its slot
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });

    if (!booking || !booking.slotId) {
      return { error: 'Booking not found or has no associated slot' };
    }

    // Then get the availability from the slot
    const slot = await prisma.calculatedAvailabilitySlot.findUnique({
      where: { id: booking.slotId },
      select: { availabilityId: true },
    });

    if (!slot) {
      return { error: 'Slot not found' };
    }

    // Now you can use slot.availabilityId
    const availability = await prisma.availability.findUnique({
      where: { id: slot.availabilityId },
      include: {
        calculatedSlots: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!availability) {
      return { error: 'No availability found for the requested time slot' };
    }

    // 1. Parse and validate form data with Zod schema
    const { data: validated, fieldErrors, formErrors } = await validateBookingFormData(formData);
    if (!validated) {
      return { fieldErrors, formErrors };
    }

    // 2. Validate booking against availability
    const validationResponse = await validateBookingWithAvailability(validated, availability);
    if (!validationResponse.isValid) {
      return {
        error: validationResponse.error,
        fieldErrors: validationResponse.path
          ? { [validationResponse.path[0]]: [validationResponse.error!] }
          : undefined,
      };
    }

    // 3. Check access to the booking using the user's ID
    try {
      await checkBookingAccess(bookingId, currentUser.id);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Access denied' };
    }

    // 4. Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: validated,
      include: {
        client: true,
      },
    });

    // 5. Format and return the response
    return {
      data: {
        bookingId: updatedBooking.id,
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
    try {
      await checkBookingAccess(bookingId, currentUser.id);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Access denied' };
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

export async function confirmBooking(bookingId: string): Promise<BookingResponse> {
  try {
    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: true,
      },
    });

    if (!booking) {
      return { error: 'Booking not found' };
    }

    if (booking.status !== BookingStatus.PENDING) {
      return { error: 'This booking cannot be confirmed' };
    }

    // Update the booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
      },
    });

    // Log the confirmation notification
    await logBookingNotification(
      bookingId,
      booking.serviceProviderId,
      'BOOKING_CONFIRMATION',
      'EMAIL'
    );

    // Revalidate relevant paths
    revalidatePath(`/calendar/service-provider/${booking.serviceProviderId}`);
    revalidatePath('/dashboard/bookings');

    return {
      data: {
        bookingId: updatedBooking.id,
      },
    };
  } catch (error) {
    console.error('Error confirming booking:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to confirm booking',
    };
  }
}

export async function declineBooking(bookingId: string, reason?: string): Promise<BookingResponse> {
  try {
    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: true,
      },
    });

    if (!booking) {
      return { error: 'Booking not found' };
    }

    if (booking.status !== BookingStatus.PENDING) {
      return { error: 'This booking cannot be declined' };
    }

    // Update in a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // 1. Update the booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          notes: reason ? `Declined: ${reason}` : 'Declined by service provider',
        },
      });

      // 2. Update the slot status back to AVAILABLE
      if (booking.slotId) {
        await tx.calculatedAvailabilitySlot.update({
          where: { id: booking.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }
    });

    // Log the cancellation notification
    await logBookingNotification(
      bookingId,
      booking.serviceProviderId,
      'BOOKING_CANCELLATION',
      'EMAIL'
    );

    // Revalidate relevant paths
    revalidatePath(`/calendar/service-provider/${booking.serviceProviderId}`);
    revalidatePath('/dashboard/bookings');

    return {
      data: {
        bookingId,
      },
    };
  } catch (error) {
    console.error('Error declining booking:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to decline booking',
    };
  }
}
