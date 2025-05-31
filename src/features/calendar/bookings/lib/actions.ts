'use server';

import { revalidatePath } from 'next/cache';

import { BookingStatus, SlotStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { sendBookingNotifications } from './server-helper';
import { BookingFormSchema, BookingResponse, BookingView } from './types';

export async function createBooking(formData: FormData): Promise<BookingResponse> {
  try {
    // Extract form data
    const data = {
      slotId: formData.get('slotId') as string,
      bookingType: formData.get('bookingType') as any,
      notificationPreferences: {
        whatsapp: formData.get('notifyViaWhatsapp') === 'true',
      },
      guestInfo: {
        name: formData.get('guestName') as string,
        whatsapp: (formData.get('guestWhatsapp') as string) || undefined,
      },
      // Explicitly handle the terms and conditions field
      agreeToTerms: formData.get('agreeToTerms') === 'true',
    };

    // Validate using the existing schema
    const validationResult = BookingFormSchema.safeParse(data);

    if (!validationResult.success) {
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
      status: result.status,
      bookingType: validatedData.bookingType,
      notificationPreferences: {
        whatsapp: validatedData.notificationPreferences.whatsapp,
      },
      guestInfo: validatedData.guestInfo
        ? {
            name: validatedData.guestInfo.name,
            whatsapp: validatedData.guestInfo.whatsapp,
          }
        : { name: '', whatsapp: undefined },
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
          id: result.slot.serviceConfig.id || '',
          price: Number(result.slot.serviceConfig.price) || 0,
          duration: result.slot.serviceConfig.duration || 0,
          isOnlineAvailable: result.slot.serviceConfig.isOnlineAvailable || false,
          isInPerson: result.slot.serviceConfig.isInPerson || false,
          location: result.slot.serviceConfig.location || undefined,
        },
        serviceProvider: {
          id: result.serviceProvider.id,
          name: result.serviceProvider.name,
          whatsapp: result.serviceProvider.whatsapp ?? undefined,
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

export async function updateBooking(bookingId: string, data: FormData): Promise<BookingResponse> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });

    if (!booking) {
      return { error: 'Booking not found' };
    }

    // Parse and validate form data using the BookingFormSchema
    const formValues = {
      slotId: data.get('slotId') as string,
      bookingType: data.get('bookingType') as any,
      notificationPreferences: {
        whatsapp: data.get('notifyViaWhatsapp') === 'true',
      },
      guestInfo: {
        name: data.get('guestName') as string,
        whatsapp: (data.get('guestWhatsapp') as string) || undefined,
      },
      agreeToTerms: true, // Assume agreed for updates
    };

    // Update the booking with validated data
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        // Update fields based on the form schema
        guestName: formValues.guestInfo.name,
        guestWhatsapp: formValues.guestInfo.whatsapp || null,
        // Handle appointment type if it's in the form
        isOnline: data.get('appointmentType') === 'online',
        isInPerson: data.get('appointmentType') === 'inperson',
        location:
          data.get('appointmentType') === 'inperson'
            ? (data.get('location') as string) || null
            : null,
        // Add any notes if provided
        notes: (data.get('notes') as string) || booking.notes,
      },
    });

    revalidatePath('/calendar/service-provider/bookings');
    revalidatePath('/dashboard/bookings');

    return {
      data: { bookingId: updatedBooking.id },
    };
  } catch (error) {
    console.error('Update booking error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to update booking',
    };
  }
}

export async function cancelBooking(bookingId: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('You must be logged in to cancel a booking');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Check if user is authorized (either the client or service provider)
  const isAuthorized =
    booking.clientId === userId ||
    booking.serviceProviderId === userId ||
    session.user.role === 'ADMIN';

  if (!isAuthorized) {
    throw new Error('You are not authorized to cancel this booking');
  }

  // Use a transaction to update the booking and slot if it exists
  if (booking.slotId) {
    // If there's an associated slot, update both booking and slot
    const result = await prisma.$transaction([
      // Update booking status to CANCELLED and disconnect from slot
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          slot: { disconnect: true }, // Disconnect the relationship
        },
      }),

      // Update slot status back to AVAILABLE
      prisma.calculatedAvailabilitySlot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.AVAILABLE },
      }),
    ]);

    revalidatePath(`/booking/${booking.slotId}`);
    return result[0]; // Return the updated booking
  } else {
    // If there's no associated slot, just update the booking
    const result = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    revalidatePath('/dashboard/bookings');
    return result;
  }
}

export async function deleteBooking(
  bookingId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Get the booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceProvider: true,
        service: true,
        client: true,
      },
    });

    if (!booking) {
      return { error: 'Booking not found' };
    }

    // Update notification logs to preserve booking context
    await prisma.notificationLog.updateMany({
      where: { bookingId },
      data: {
        bookingReference: bookingId,
        serviceProviderName: booking.serviceProvider.name,
        clientName: booking.client?.name || booking.guestName || 'Unknown',
        serviceName: booking.service.name,
        appointmentTime: booking.startTime,
        bookingId: null, // Disconnect from booking
      },
    });

    // If there's an associated slot, update its status before deleting the booking
    if (booking.slotId) {
      await prisma.calculatedAvailabilitySlot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.AVAILABLE },
      });
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId },
    });

    revalidatePath('/calendar/service-provider/bookings');

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
