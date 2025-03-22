import { EmailService } from '@/features/notifications/services/email.service';
import { TemplateService } from '@/features/notifications/services/template.service';
import { WhatsAppService } from '@/features/notifications/services/whatsapp.service';

import {
  NotificationContent,
  NotificationOptions,
  NotificationRecipient,
  NotificationResult,
  TemplateData,
  TemplateType,
} from '../lib/types';

export class NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly whatsappService: WhatsAppService,
    private readonly templateService: TemplateService
  ) {}

  async sendNotification(
    recipient: NotificationRecipient,
    content: NotificationContent,
    options: NotificationOptions = {}
  ): Promise<NotificationResult[]> {
    const channels = options.channels || ['email'];
    const results: NotificationResult[] = [];

    for (const channel of channels) {
      let result: NotificationResult;

      switch (channel) {
        case 'email':
          result = await this.emailService.send(recipient, content);
          break;
        case 'whatsapp':
          result = await this.whatsappService.send(recipient, content);
          break;
        default:
          result = { success: false, error: `Unknown channel: ${channel}` };
      }

      results.push(result);
    }

    return results;
  }

  async sendTemplatedNotification(
    recipient: NotificationRecipient,
    templateType: TemplateType,
    templateData: TemplateData,
    options?: NotificationOptions
  ): Promise<NotificationResult[]> {
    const content = {
      body: TemplateService.getTemplate(templateType, templateData),
      subject: templateType.toLowerCase().replace(/_/g, ' '),
    };

    return this.sendNotification(recipient, content, options);
  }
}
