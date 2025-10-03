import sgMail from '@sendgrid/mail';
import { put } from '@vercel/blob';
import twilio from 'twilio';
import vCardsJS from 'vcards-js';

import env from '@/config/env/server';
import { logger, sanitizeName, sanitizePhone } from '@/lib/logger';
import { type RouterOutputs } from '@/utils/api';

// OPTION C: Use tRPC-inferred type for booking data from calendar router
type BookingWithDetails = RouterOutputs['calendar']['getBookingWithDetails'];

// Load environment variables
const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const TwilioWhatsappNumber = env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not set in environment variables');
}

const twilioClient = twilio(accountSid, authToken);

// Initialize SendGrid
sgMail.setApiKey(env.SENDGRID_API_KEY!);

export async function sendBookingNotifications(booking: BookingWithDetails) {
  try {
    const notificationPromises = [];

    if (!booking.slot) {
      logger.error('Booking has no slot associated', { bookingId: booking.id });
      return;
    }

    const templateVariablesProvider = JSON.stringify({
      1: booking.slot.availability?.provider?.name || '',
      2: `${booking.slot.startTime.toLocaleDateString()} at ${booking.slot.startTime.toLocaleTimeString()}`,
      3: `${booking.slot.serviceConfig?.duration} minutes`,
      4: `R${booking.slot.serviceConfig?.price}`,
      5: booking.slot.serviceConfig?.isOnlineAvailable ? 'Online' : 'In-Person',
      6: booking.guestName || '',
      7: booking.id,
    });

    // Send provider whatsapp notification
    if (booking.slot.availability?.provider?.whatsapp) {
      notificationPromises.push(
        twilioClient.messages.create({
          from: `whatsapp:${TwilioWhatsappNumber}`,
          contentSid: 'HX7b7542c849bf762b63fc38dcb069f6f1',
          contentVariables: templateVariablesProvider,
          to: `whatsapp:${booking.slot.availability.provider.whatsapp}`,
        })
      );
    }

    const templateVariablesPatient = JSON.stringify({
      1: booking.guestName || '',
      2: booking.slot.availability?.provider?.name || '',
      3: `${booking.slot.startTime.toLocaleDateString()} at ${booking.slot.startTime.toLocaleTimeString()}`,
      4: `${booking.slot.serviceConfig?.duration} minutes`,
      5: `R${booking.slot.serviceConfig?.price}`,
      6: booking.slot.serviceConfig?.isOnlineAvailable ? 'Online' : 'In-Person',
      7: booking.guestName || '',
      8: booking.id,
    });

    // Send patient whatsapp notification if guest has whatsapp
    if (booking.guestWhatsapp) {
      notificationPromises.push(
        twilioClient.messages.create({
          from: `whatsapp:${TwilioWhatsappNumber}`,
          contentSid: 'HXd872a8922fc1bffd95bb57e4c702dc9e',
          contentVariables: templateVariablesPatient,
          to: `whatsapp:${booking.guestWhatsapp}`,
        })
      );
    }

    // Send all notifications in parallel and log results
    const results = await Promise.allSettled(notificationPromises);
    logger.info('Notification results', {
      bookingId: booking.id,
      totalSent: results.length,
      successful: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    });

    // Note: Notification logging would go here if NotificationLog model existed
  } catch (error) {
    logger.error('Error sending notifications', {
      bookingId: booking.id,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw the error - we don't want to fail the booking if notifications fail
  }
}

export async function sendBookingConfirmation(booking: BookingWithDetails) {
  try {
    const notificationPromises = [];

    if (!booking.slot) {
      logger.error('Booking has no slot associated', { bookingId: booking.id });
      return;
    }

    const templateVariablesProvider = JSON.stringify({
      1: booking.slot.availability?.provider?.name || '',
      2: booking.id,
      3: `${booking.slot.startTime.toLocaleDateString()} at ${booking.slot.startTime.toLocaleTimeString()}`,
      4: `${booking.slot.serviceConfig?.duration} minutes`,
      5: `R${booking.slot.serviceConfig?.price}`,
      6: booking.slot.serviceConfig?.isOnlineAvailable ? 'Online' : 'In-Person',
      7: booking.guestName || '',
      8: booking.guestWhatsapp || '',
      9: booking.id,
    });

    // Send provider whatsapp notification with option to request vCard
    if (booking.slot.availability?.provider?.whatsapp) {
      notificationPromises.push(
        twilioClient.messages.create({
          from: `whatsapp:${TwilioWhatsappNumber}`,
          contentSid: 'HXd4581d3971aba1d4c6343c97e5c5cf2e',
          contentVariables: templateVariablesProvider,
          to: `whatsapp:${booking.slot.availability.provider.whatsapp}`,
        })
      );
    }

    const templateVariablesPatient = JSON.stringify({
      1: booking.guestName || '',
      2: booking.slot.availability?.provider?.name || '',
      3: booking.id,
      4: `${booking.slot.startTime.toLocaleDateString()} at ${booking.slot.startTime.toLocaleTimeString()}`,
      5: `${booking.slot.serviceConfig?.duration} minutes`,
      6: `R${booking.slot.serviceConfig?.price}`,
      7: booking.slot.serviceConfig?.isOnlineAvailable ? 'Online' : 'In-Person',
      8: booking.guestName || '',
      9: booking.id,
    });

    // Send patient whatsapp notification if guest has whatsapp
    if (booking.guestWhatsapp) {
      notificationPromises.push(
        twilioClient.messages.create({
          from: `whatsapp:${TwilioWhatsappNumber}`,
          contentSid: 'HX8bfd0fc829de1adfe41f2e526d42cabf',
          contentVariables: templateVariablesPatient,
          to: `whatsapp:${booking.guestWhatsapp}`,
        })
      );
    }

    // Send all notifications in parallel and log results
    const results = await Promise.allSettled(notificationPromises);
    logger.info('Booking confirmation results', {
      bookingId: booking.id,
      totalSent: results.length,
      successful: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    });

    // Note: Notification logging would go here if NotificationLog model existed
  } catch (error) {
    logger.error('Error sending booking confirmation', {
      bookingId: booking.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function sendGuestVCardToProvider(booking: BookingWithDetails) {
  try {
    if (!booking.slot) {
      logger.error('Booking has no slot associated', { bookingId: booking.id });
      return;
    }

    // Create vCard for guest
    const vCard = vCardsJS();
    vCard.firstName = booking.guestName || '';
    if (booking.guestWhatsapp) {
      vCard.workPhone = booking.guestWhatsapp;
    }

    // Upload to Vercel Blob
    const { url } = await put(`vcards/guest-${booking.id}.vcf`, vCard.getFormattedString(), {
      access: 'public',
      contentType: 'text/vcard',
    });

    // Send the vCard via WhatsApp using Twilio
    try {
      // Capture the result of the Twilio API call
      const message = await twilioClient.messages.create({
        from: `whatsapp:${TwilioWhatsappNumber}`,
        to: `whatsapp:${booking.slot.availability?.provider?.whatsapp}`,
        mediaUrl: [url],
      });

      // Log the successful result (or specific properties)
      logger.info('Twilio vCard message sent', {
        bookingId: booking.id,
        messageSid: message.sid,
        status: message.status,
      });
    } catch (error) {
      // Log if the promise itself rejects (e.g., API error)
      logger.error('Error sending Twilio message', {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Re-throw the error or handle it as appropriate for your flow
      throw error;
    }
  } catch (error) {
    logger.error('Error sending vCard', {
      bookingId: booking.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Sends a WhatsApp confirmation message to the provider
 * @param name - The name of the provider
 * @param whatsappNumber - The WhatsApp number to send the message to
 */
export async function sendProviderWhatsappConfirmation(name: string, whatsappNumber: string) {
  try {
    if (!whatsappNumber) {
      logger.warn('No WhatsApp number provided for provider confirmation', {
        hasName: !!name,
      });
      return;
    }

    // Prepare template variables
    const templateVariables = JSON.stringify({
      1: name,
    });

    // Send WhatsApp message
    const message = await twilioClient.messages.create({
      from: `whatsapp:${TwilioWhatsappNumber}`,
      contentSid: 'HX4f483e7980984dd42aabf49b2cfdf537',
      contentVariables: templateVariables,
      to: `whatsapp:${whatsappNumber}`,
    });

    logger.info('Provider WhatsApp confirmation sent', {
      messageSid: message.sid,
      providerName: sanitizeName(name),
      whatsapp: sanitizePhone(whatsappNumber),
    });
    return message;
  } catch (error) {
    logger.error('Error sending provider WhatsApp confirmation', {
      providerName: sanitizeName(name),
      whatsapp: sanitizePhone(whatsappNumber),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
