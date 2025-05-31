import sgMail from '@sendgrid/mail';

import env from '@/config/env/server';

import { NotificationContent, NotificationRecipient, NotificationResult } from '../types/types';

export class EmailService {
  constructor() {
    sgMail.setApiKey(env.SENDGRID_API_KEY!);
  }

  async send(
    recipient: NotificationRecipient,
    content: NotificationContent
  ): Promise<NotificationResult> {
    try {
      if (!recipient.email) {
        return { success: false, error: 'No email address provided' };
      }

      const msg = {
        to: recipient.email,
        from: env.SENDGRID_FROM_EMAIL!,
        subject: content.subject || 'Notification',
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
}
