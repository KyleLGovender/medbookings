'use server';

import { getServerSession } from 'next-auth';

import { BookingView } from '@/features/calendar/types/types';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { sendGuestVCardToProvider } from './server-helper';

export async function sendProviderPatientsDetailsByWhatsapp(
  bookingId: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: {
          include: {
            service: true,
            serviceConfig: true,
            availability: {
              include: {
                provider: true,
              },
            },
          },
        },
      },
    });

    if (!booking || booking.slot?.availability?.provider?.userId !== session.user.id) {
      return { error: 'Unauthorized access to booking' };
    }

    const bookingView: BookingView = {
      id: booking.id,
      status: booking.status,
      notificationPreferences: {
        whatsapp: true,
      },
      guestInfo: {
        name: booking.guestName || '',
        whatsapp: booking.guestWhatsapp || undefined,
      },
      slot: {
        id: booking.slot?.id || '',
        startTime: booking.slot?.startTime || new Date(),
        endTime: booking.slot?.endTime || new Date(),
        status: booking.slot?.status || 'AVAILABLE',
        service: {
          id: booking.slot?.service.id || '',
          name: booking.slot?.service.name || '',
          description: booking.slot?.service.description || undefined,
          displayPriority: booking.slot?.service.displayPriority,
        },
        serviceConfig: {
          id: booking.slot?.serviceConfig.id || '',
          price: Number(booking.slot?.serviceConfig.price) || 0,
          duration: booking.slot?.serviceConfig.duration || 0,
          isOnlineAvailable: booking.slot?.serviceConfig.isOnlineAvailable || false,
          isInPerson: booking.slot?.serviceConfig.isInPerson || false,
          location: booking.slot?.serviceConfig.locationId || undefined,
        },
        provider: {
          id: booking.slot?.availability?.provider?.id || '',
          name: booking.slot?.availability?.provider?.name || '',
          whatsapp: booking.slot?.availability?.provider?.whatsapp || undefined,
          image: booking.slot?.availability?.provider?.image || undefined,
        },
      },
    };

    await sendGuestVCardToProvider(bookingView);
    console.log('[Action] sendGuestVCardToProvider completed.');

    // Return success with a message
    return { success: true, message: 'Patient details sent successfully via WhatsApp!' };
  } catch (error) {
    console.error('[Action] Error sending details:', error);
    // Return error
    return { error: 'Failed to send patient details' };
  }
}
