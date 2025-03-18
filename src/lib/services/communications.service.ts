import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

import env from '@/config/env/server';

export interface NotificationData {
  to: string;
  subject?: string;
  message: string;
}

export class CommunicationsService {
  private twilioClient: twilio.Twilio;

  constructor() {
    // Initialize Twilio client
    this.twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    // Initialize SendGrid
    sgMail.setApiKey(env.SENDGRID_API_KEY);
  }

  async sendWhatsAppMessage({ to, message }: NotificationData) {
    try {
      const response = await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`,
      });

      return response;
    } catch (error) {
      console.error('WhatsApp notification failed:', error);
      throw error;
    }
  }

  async sendEmail({ to, subject, message }: NotificationData) {
    try {
      const msg = {
        to,
        from: env.SENDGRID_FROM_EMAIL,
        subject,
        text: message,
        html: message.replace(/\n/g, '<br>'),
      };

      const response = await sgMail.send(msg);
      return response;
    } catch (error) {
      console.error('Email notification failed:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const communicationsService = new CommunicationsService();
