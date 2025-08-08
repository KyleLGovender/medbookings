import { EmailService } from '@/features/communications/services/email.service';
import { TemplateService } from '@/features/communications/services/template.service';
import { WhatsAppService } from '@/features/communications/services/whatsapp.service';

import { CommunicationType, CommunicationChannel } from '@prisma/client';
import {
  NotificationContent,
  NotificationOptions,
  NotificationRecipient,
  NotificationResult,
  TemplateData,
} from '../types/types';

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
        case CommunicationChannel.EMAIL:
          result = await this.emailService.send(recipient, content);
          break;
        case CommunicationChannel.WHATSAPP:
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
