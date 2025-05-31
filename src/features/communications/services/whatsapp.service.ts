import twilio from 'twilio';

import env from '@/config/env/server';

import { NotificationContent, NotificationRecipient, NotificationResult } from '../types/types';

export class WhatsAppService {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  async send(
    recipient: NotificationRecipient,
    content: NotificationContent
  ): Promise<NotificationResult> {
    try {
      if (!recipient.whatsapp) {
        return { success: false, error: 'No WhatsApp number provided' };
      }

      await this.client.messages.create({
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
