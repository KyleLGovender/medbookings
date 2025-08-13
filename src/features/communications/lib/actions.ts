'use server';

import { type RouterOutputs } from '@/utils/api';

import { sendGuestVCardToProvider } from './server-helper';

// OPTION C: Use tRPC-inferred type for booking data from calendar router
type BookingWithDetails = RouterOutputs['calendar']['getBookingWithDetails'];

export async function sendProviderPatientsDetailsByWhatsapp(
  booking: BookingWithDetails
): Promise<{ success?: boolean; error?: string; message?: string }> {
  try {
    // OPTION C: Server action now only handles business logic, no database queries
    await sendGuestVCardToProvider(booking);
    console.log('[Action] sendGuestVCardToProvider completed.');

    // Return minimal metadata
    return { success: true, message: 'Patient details sent successfully via WhatsApp!' };
  } catch (error) {
    console.error('[Action] Error sending details:', error);
    // Return error metadata
    return { error: 'Failed to send patient details' };
  }
}
