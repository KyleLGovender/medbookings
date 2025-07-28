// Export a singleton instance
import { EmailService } from '@/features/communications/services/email.service';
import { NotificationService } from '@/features/communications/services/notification.service';
import { TemplateService } from '@/features/communications/services/template.service';
import { WhatsAppService } from '@/features/communications/services/whatsapp.service';

export const notificationService = new NotificationService(
  new EmailService(),
  new WhatsAppService(),
  new TemplateService()
);
