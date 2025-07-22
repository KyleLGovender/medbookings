import sgMail from '@sendgrid/mail';
import { put } from '@vercel/blob';
import twilio from 'twilio';
import vCardsJS from 'vcards-js';

import env from '@/config/env/server';
import { BookingView } from '@/features/calendar/lib/types';

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

export async function sendBookingNotifications(booking: BookingView) {
  try {
    const notificationPromises = [];

    const templateVariablesProvider = JSON.stringify({
      1: booking.slot.provider.name,
      2: `${booking.slot.startTime.toLocaleDateString()} at ${booking.slot.startTime.toLocaleTimeString()}`,
      3: `${booking.slot.serviceConfig.duration} minutes`,
      4: `R${booking.slot.serviceConfig.price}`,
      5: booking.slot.serviceConfig.isOnlineAvailable ? 'Online' : 'In-Person',
      6: booking.guestInfo.name,
      7: booking.id,
    });

    // Send provider whatsapp notification
    if (booking.slot.provider.whatsapp) {
      notificationPromises.push(
        twilioClient.messages.create({
          from: `whatsapp:${TwilioWhatsappNumber}`,
          contentSid: 'HX7b7542c849bf762b63fc38dcb069f6f1',
          contentVariables: templateVariablesProvider,
          to: `whatsapp:${booking.slot.provider.whatsapp}`,
        })
      );
    }

    const templateVariablesPatient = JSON.stringify({
      1: booking.guestInfo.name,
      2: booking.slot.provider.name,
      3: `${booking.slot.startTime.toLocaleDateString()} at ${booking.slot.startTime.toLocaleTimeString()}`,
      4: `${booking.slot.serviceConfig.duration} minutes`,
      5: `R${booking.slot.serviceConfig.price}`,
      6: booking.slot.serviceConfig.isOnlineAvailable ? 'Online' : 'In-Person',
      7: booking.guestInfo.name,
      8: booking.id,
    });

    // Send patient whatsapp notification
    if (booking.notificationPreferences.whatsapp) {
      if (booking.notificationPreferences.whatsapp) {
        notificationPromises.push(
          twilioClient.messages.create({
            from: `whatsapp:${TwilioWhatsappNumber}`,
            contentSid: 'HXd872a8922fc1bffd95bb57e4c702dc9e',
            contentVariables: templateVariablesPatient,
            to: `whatsapp:${booking.guestInfo.whatsapp}`,
          })
        );
      }
    }

    // Send all notifications in parallel and log results
    const results = await Promise.allSettled(notificationPromises);
    console.log('Notification results:', results);

    // Note: Notification logging would go here if NotificationLog model existed
  } catch (error) {
    console.error('Error sending notifications:', error);
    // Don't throw the error - we don't want to fail the booking if notifications fail
  }
}

export async function sendBookingConfirmation(booking: BookingView) {
  try {
    const notificationPromises = [];

    const templateVariablesProvider = JSON.stringify({
      1: booking.slot.provider.name,
      2: booking.id,
      3: `${booking.slot.startTime.toLocaleDateString()} at ${booking.slot.startTime.toLocaleTimeString()}`,
      4: `${booking.slot.serviceConfig.duration} minutes`,
      5: `R${booking.slot.serviceConfig.price}`,
      6: booking.slot.serviceConfig.isOnlineAvailable ? 'Online' : 'In-Person',
      7: booking.guestInfo.name,
      8: booking.guestInfo.whatsapp,
      9: booking.id,
    });

    // Send provider whatsapp notification with option to request vCard
    if (booking.slot.provider.whatsapp) {
      notificationPromises.push(
        twilioClient.messages.create({
          from: `whatsapp:${TwilioWhatsappNumber}`,
          contentSid: 'HXd4581d3971aba1d4c6343c97e5c5cf2e',
          contentVariables: templateVariablesProvider,
          to: `whatsapp:${booking.slot.provider.whatsapp}`,
        })
      );
    }

    const templateVariablesPatient = JSON.stringify({
      1: booking.guestInfo.name,
      2: booking.slot.provider.name,
      3: booking.id,
      4: `${booking.slot.startTime.toLocaleDateString()} at ${booking.slot.startTime.toLocaleTimeString()}`,
      5: `${booking.slot.serviceConfig.duration} minutes`,
      6: `R${booking.slot.serviceConfig.price}`,
      7: booking.slot.serviceConfig.isOnlineAvailable ? 'Online' : 'In-Person',
      8: booking.guestInfo.name,
      9: booking.id,
    });

    // Send patient whatsapp notification
    if (booking.notificationPreferences.whatsapp) {
      if (booking.notificationPreferences.whatsapp) {
        notificationPromises.push(
          twilioClient.messages.create({
            from: `whatsapp:${TwilioWhatsappNumber}`,
            contentSid: 'HX8bfd0fc829de1adfe41f2e526d42cabf',
            contentVariables: templateVariablesPatient,
            to: `whatsapp:${booking.guestInfo.whatsapp}`,
          })
        );
      }
    }

    // Send all notifications in parallel and log results
    const results = await Promise.allSettled(notificationPromises);
    console.log('Notification results:', results);

    // Note: Notification logging would go here if NotificationLog model existed
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
  }
}

export async function sendGuestVCardToProvider(booking: BookingView) {
  try {
    // Create vCard for guest
    const vCard = vCardsJS();
    vCard.firstName = booking.guestInfo.name;
    if (booking.guestInfo.whatsapp) {
      vCard.workPhone = booking.guestInfo.whatsapp;
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
        to: `whatsapp:${booking.slot.provider.whatsapp}`,
        mediaUrl: [url],
      });

      // Log the successful result (or specific properties)
      console.log('Twilio message creation successful:');
      console.log('Message SID:', message.sid);
      console.log('Status:', message.status);
      // You can log the whole message object too, but it can be large
      // console.log('  Full Twilio Response:', message);
    } catch (error) {
      // Log if the promise itself rejects (e.g., API error)
      console.error('Error sending Twilio message:', error);
      // Re-throw the error or handle it as appropriate for your flow
      throw error;
    }
  } catch (error) {
    console.error('Error sending vCard:', error);
  }
}
