import twilio from 'twilio';

import env from '@/config/env/server';

// Load environment variables
const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const TwilioWhatsappNumber = env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !TwilioWhatsappNumber) {
  throw new Error('Twilio credentials or WhatsApp number are not set in environment variables');
}

const twilioClient = twilio(accountSid, authToken);

/**
 * Sends a WhatsApp confirmation message to the service provider
 * @param name - The name of the service provider
 * @param whatsappNumber - The WhatsApp number to send the message to
 */
export async function sendServiceProviderWhatsappConfirmation(
  name: string,
  whatsappNumber: string
) {
  try {
    if (!whatsappNumber) {
      console.log('No WhatsApp number provided');
      return;
    }

    // Prepare template variables
    const templateVariables = JSON.stringify({
      1: name,
    });

    console.log('accountSid: ', accountSid);
    console.log('authToken: ', authToken);
    console.log('TwilioWhatsappNumber: ', TwilioWhatsappNumber);

    // Send WhatsApp message
    const message = await twilioClient.messages.create({
      from: `whatsapp:${TwilioWhatsappNumber}`,
      contentSid: 'HX4f483e7980984dd42aabf49b2cfdf537',
      contentVariables: templateVariables,
      to: `whatsapp:${whatsappNumber}`,
    });

    console.log('Service provider WhatsApp confirmation sent successfully:', message.sid);
    return message;
  } catch (error) {
    console.error('Error sending service provider WhatsApp confirmation:', error);
    throw error;
  }
}
