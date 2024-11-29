import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

import env from '@/config/env/server';

// Initialize Twilio and SendGrid clients
const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

sgMail.setApiKey(env.SENDGRID_API_KEY!);

interface NotificationContent {
  subject?: string;
  body: string;
}

interface NotificationRecipient {
  email?: string;
  phone?: string;
  whatsapp?: string;
  name: string;
}

export class NotificationService {
  static async sendEmail(
    recipient: NotificationRecipient,
    content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!recipient.email) {
        return { success: false, error: 'No email address provided' };
      }

      const msg = {
        to: recipient.email,
        from: env.SENDGRID_FROM_EMAIL!,
        subject: content.subject || 'Notification from Your App',
        text: content.body,
        html: content.body.replace(/\n/g, '<br>'),
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  static async sendSMS(
    recipient: NotificationRecipient,
    content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!recipient.phone) {
        return { success: false, error: 'No phone number provided' };
      }

      await twilioClient.messages.create({
        body: content.body,
        from: env.TWILIO_PHONE_NUMBER,
        to: recipient.phone,
      });

      return { success: true };
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  static async sendWhatsApp(
    recipient: NotificationRecipient,
    content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!recipient.whatsapp) {
        return { success: false, error: 'No WhatsApp number provided' };
      }

      await twilioClient.messages.create({
        body: content.body,
        from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${recipient.whatsapp}`,
      });

      return { success: true };
    } catch (error) {
      console.error('WhatsApp sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
      };
    }
  }
}
