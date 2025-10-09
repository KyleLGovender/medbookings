'use server';

import { Prisma } from '@prisma/client';

import { logger } from '@/lib/logger';

import { sendGuestVCardToProvider } from './server-helper';

// Use Prisma type matching getBookingWithDetails from calendar router
type BookingWithDetails = Prisma.BookingGetPayload<{
  include: {
    slot: {
      include: {
        service: true;
        serviceConfig: true;
        availability: {
          include: {
            provider: true;
          };
        };
      };
    };
  };
}>;

export async function sendProviderPatientsDetailsByWhatsapp(
  booking: BookingWithDetails
): Promise<{ success?: boolean; error?: string; message?: string }> {
  try {
    // OPTION C: Server action now only handles business logic, no database queries
    await sendGuestVCardToProvider(booking);
    logger.info('sendGuestVCardToProvider completed', {
      bookingId: booking.id,
    });

    // Return minimal metadata
    return { success: true, message: 'Patient details sent successfully via WhatsApp!' };
  } catch (error) {
    logger.error('Error sending details', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Return error metadata
    return { error: 'Failed to send patient details' };
  }
}
