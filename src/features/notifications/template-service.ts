import { BookingView } from '@/features/calendar/lib/types';

export class TemplateService {
  static getBookingConfirmationTemplate(
    booking: BookingView,
    recipientName: string | null
  ): string {
    const name = recipientName || 'Guest';
    const serviceName = booking.service?.name || 'Service';
    const date = new Date(booking.startTime).toLocaleDateString();
    const time = new Date(booking.startTime).toLocaleTimeString([], {
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
