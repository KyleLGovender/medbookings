import { BookingView } from '@/features/calendar/types/types';

export class TemplateService {
  static getBookingConfirmationTemplate(
    booking: BookingView,
    recipientName: string | null
  ): string {
    const name = recipientName || 'Guest';
    const serviceName = booking.slot.service.name;
    const date = new Date(booking.slot.startTime).toLocaleDateString();
    const time = new Date(booking.slot.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      Hello ${name},
      
      Your booking for ${serviceName} on ${date} at ${time} has been confirmed.
      
      Thank you for your booking!
    `;
  }

  // Add more templates as needed
  static getBookingUpdateTemplate(booking: BookingView, recipientName: string) {
    // Similar to above but for updates
  }

  static getBookingCancellationTemplate(booking: BookingView, recipientName: string) {
    // Template for cancellations
  }
}
