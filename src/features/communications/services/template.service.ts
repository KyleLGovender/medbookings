import { CommunicationType } from '@prisma/client';
import { TemplateData } from '../types/types';

export class TemplateService {
  private static formatDateTime(date: Date): { date: string; time: string } {
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  static getTemplate(type: CommunicationType, data: TemplateData): string {
    const recipientName = data.recipientName || 'Guest';

    switch (type) {
      case CommunicationType.BOOKING_CONFIRMATION:
        return this.getBookingConfirmationTemplate(recipientName, data);
      case CommunicationType.BOOKING_MODIFICATION:
        return this.getBookingUpdateTemplate(recipientName, data);
      case CommunicationType.BOOKING_CANCELLATION:
        return this.getBookingCancellationTemplate(recipientName, data);
      default:
        throw new Error(`Unknown template type: ${type}`);
    }
  }

  private static getBookingConfirmationTemplate(recipientName: string, data: TemplateData): string {
    if (!data.booking) throw new Error('Booking data required');

    const { date, time } = this.formatDateTime(new Date(data.booking.slot.startTime));
    const serviceName = data.booking.slot.service.name;

    return `
      Hello ${recipientName},
      
      Your booking for ${serviceName} on ${date} at ${time} has been confirmed.
      
      Thank you for your booking!
    `.trim();
  }

  private static getBookingUpdateTemplate(recipientName: string, data: TemplateData): string {
    if (!data.booking) throw new Error('Booking data required');

    const { date, time } = this.formatDateTime(new Date(data.booking.slot.startTime));
    const serviceName = data.booking.slot.service.name;

    return `
      Hello ${recipientName},
      
      Your booking for ${serviceName} has been updated to ${date} at ${time}.
      
      If you did not request this change, please contact us immediately.
    `.trim();
  }

  private static getBookingCancellationTemplate(recipientName: string, data: TemplateData): string {
    if (!data.booking) throw new Error('Booking data required');

    const { date, time } = this.formatDateTime(new Date(data.booking.slot.startTime));
    const serviceName = data.booking.slot.service.name;

    return `
      Hello ${recipientName},
      
      Your booking for ${serviceName} on ${date} at ${time} has been cancelled.
      
      If you did not request this cancellation, please contact us immediately.
    `.trim();
  }
}
