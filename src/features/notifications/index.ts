// Export a singleton instance
import { EmailService } from '@/features/notifications/services/email.service';
import { NotificationService } from '@/features/notifications/services/notification.service';
import { TemplateService } from '@/features/notifications/services/template.service';
import { WhatsAppService } from '@/features/notifications/services/whatsapp.service';

export * from './lib/types';
export * from './services/notification.service';
export * from './services/template.service';

export const notificationService = new NotificationService(
  new EmailService(),
  new WhatsAppService(),
  new TemplateService()
);
