/**
 * WhatsApp templates for booking confirmations and notifications
 * Uses Twilio content templates (contentSid) for pre-approved templates
 */

import twilio from 'twilio';
import env from '@/config/env/server';

interface BookingDetails {
  bookingId: string;
  providerName: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  location?: string;
  guestName: string;
  guestPhone?: string;
  notes?: string;
  duration?: number;
  price?: string;
}

// Initialize Twilio client
const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

/**
 * Send booking confirmation WhatsApp message to guest
 */
export async function sendGuestBookingWhatsApp(
  guestPhone: string,
  booking: BookingDetails
): Promise<void> {
  try {
    if (!guestPhone || !guestPhone.startsWith('+')) {
      console.warn('Invalid guest phone number for WhatsApp:', guestPhone);
      return;
    }

    const formattedDate = new Date(booking.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = new Date(booking.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Template variables for guest confirmation
    const templateVariables = JSON.stringify({
      1: booking.guestName, // Guest name
      2: booking.providerName, // Provider name
      3: formattedDate, // Appointment date
      4: formattedTime, // Appointment time
      5: booking.serviceType, // Service type
      6: booking.location || 'Online consultation', // Location
      7: booking.bookingId.substring(0, 8).toUpperCase(), // Booking reference
      8: booking.duration ? `${booking.duration} minutes` : '30 minutes', // Duration
    });

    // Use optimized Twilio content template for guest booking confirmation
    const message = await twilioClient.messages.create({
      from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${guestPhone}`,
      contentSid: 'HXaa942313733fddc9c10d28597e2894f4', // New guest_booking_confirmation_v2 template
      contentVariables: templateVariables,
    });

    console.log('Guest booking WhatsApp confirmation sent:', {
      messageSid: message.sid,
      status: message.status,
      to: guestPhone,
      bookingId: booking.bookingId,
    });
  } catch (error) {
    console.error('Error sending guest booking WhatsApp:', error);
    // Don't throw error - we don't want to fail booking if WhatsApp fails
  }
}

/**
 * Send booking notification WhatsApp message to provider
 */
export async function sendProviderBookingWhatsApp(
  providerPhone: string,
  booking: BookingDetails
): Promise<void> {
  try {
    if (!providerPhone || !providerPhone.startsWith('+')) {
      console.warn('Invalid provider phone number for WhatsApp:', providerPhone);
      return;
    }

    const formattedDate = new Date(booking.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = new Date(booking.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Template variables for provider notification
    const templateVariables = JSON.stringify({
      1: booking.providerName, // Provider name
      2: booking.guestName, // Guest name
      3: formattedDate, // Appointment date
      4: formattedTime, // Appointment time
      5: booking.serviceType, // Service type
      6: booking.location || 'Online consultation', // Location
      7: booking.bookingId.substring(0, 8).toUpperCase(), // Booking reference
      8: booking.guestPhone || 'Not provided', // Guest phone
      9: booking.duration ? `${booking.duration} minutes` : '30 minutes', // Duration
    });

    // Use optimized Twilio content template for provider notification
    const message = await twilioClient.messages.create({
      from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${providerPhone}`,
      contentSid: 'HXf24f9f7d50ef56e67348e5fb15ad0ed7', // New provider_booking_notification_v2 template
      contentVariables: templateVariables,
    });

    console.log('Provider booking WhatsApp notification sent:', {
      messageSid: message.sid,
      status: message.status,
      to: providerPhone,
      bookingId: booking.bookingId,
    });
  } catch (error) {
    console.error('Error sending provider booking WhatsApp:', error);
    // Don't throw error - we don't want to fail booking if WhatsApp fails
  }
}

/**
 * Send simple text WhatsApp message (fallback for when content templates aren't available)
 */
export async function sendSimpleWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<void> {
  try {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      console.warn('Invalid phone number for WhatsApp:', phoneNumber);
      return;
    }

    const twilioMessage = await twilioClient.messages.create({
      from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    });

    console.log('Simple WhatsApp message sent:', {
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
      to: phoneNumber,
    });
  } catch (error) {
    console.error('Error sending simple WhatsApp message:', error);
  }
}

/**
 * Generate fallback WhatsApp message for guest booking confirmation
 * Used when template HXaa942313733fddc9c10d28597e2894f4 (guest_booking_confirmation_v2) fails
 */
export function generateGuestBookingWhatsAppMessage(booking: BookingDetails): string {
  const formattedDate = new Date(booking.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(booking.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `🎉 *Booking Confirmed!*

Hi ${booking.guestName},

Your appointment has been confirmed:

📅 *Date:* ${formattedDate}
🕐 *Time:* ${formattedTime}
👨‍⚕️ *Provider:* ${booking.providerName}
🏥 *Service:* ${booking.serviceType}
📍 *Location:* ${booking.location || 'Online consultation'}
📧 *Reference:* #${booking.bookingId.substring(0, 8).toUpperCase()}

✅ Please save this information and arrive 5-10 minutes early.

Thank you for choosing MedBookings! 🏥`;
}

/**
 * Generate fallback WhatsApp message for provider booking notification
 * Used when template HXf24f9f7d50ef56e67348e5fb15ad0ed7 (provider_booking_notification_v2) fails
 */
export function generateProviderBookingWhatsAppMessage(booking: BookingDetails): string {
  const formattedDate = new Date(booking.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(booking.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `📅 *New Booking Alert*

Hello ${booking.providerName},

You have a new appointment:

📅 *Date:* ${formattedDate}
🕐 *Time:* ${formattedTime}
👤 *Guest:* ${booking.guestName}
🏥 *Service:* ${booking.serviceType}
📍 *Location:* ${booking.location || 'Online consultation'}
📧 *Reference:* #${booking.bookingId.substring(0, 8).toUpperCase()}
📱 *Guest Phone:* ${booking.guestPhone || 'Not provided'}

The guest has been sent a confirmation. Please prepare for the appointment.

MedBookings Provider Portal 🏥`;
}