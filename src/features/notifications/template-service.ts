import { Booking } from "@prisma/client";
import { format } from "date-fns";

export class TemplateService {
  static getBookingConfirmationTemplate(
    booking: Booking,
    recipientName: string,
  ) {
    const formattedStart = format(booking.startTime, "PPpp");
    const formattedEnd = format(booking.endTime, "p");

    return {
      subject: "Booking Confirmation",
      body: `
Hello ${recipientName},

Your booking has been confirmed for ${formattedStart} to ${formattedEnd}.

${booking.isOnline ? "This is an online booking." : `Location: ${booking.location}`}

${booking.notes ? `Additional Notes: ${booking.notes}` : ""}

Thank you for booking with us!
      `.trim(),
    };
  }

  // Add more templates as needed
  static getBookingUpdateTemplate(booking: Booking, recipientName: string) {
    // Similar to above but for updates
  }

  static getBookingCancellationTemplate(
    booking: Booking,
    recipientName: string,
  ) {
    // Template for cancellations
  }
}
