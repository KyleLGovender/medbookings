export const bookingTemplates = {
  confirmation: {
    customer: {
      subject: 'Booking Confirmation',
      message: (booking: any) =>
        `
Dear ${booking.customerName},

Your booking has been confirmed!

Details:
Date: ${new Date(booking.date).toLocaleDateString()}
Time: ${booking.time}
Service: ${booking.service}

Thank you for choosing our service.

Best regards,
[Your Company Name]
      `.trim(),
    },
    provider: {
      subject: 'New Booking Notification',
      message: (booking: any) =>
        `
New booking received!

Customer: ${booking.customerName}
Date: ${new Date(booking.date).toLocaleDateString()}
Time: ${booking.time}
Service: ${booking.service}
Contact: ${booking.customerPhone}
      `.trim(),
    },
  },
  reminder: {
    customer: {
      subject: 'Booking Reminder',
      message: (booking: any) =>
        `
Dear ${booking.customerName},

This is a reminder for your upcoming appointment:

Date: ${new Date(booking.date).toLocaleDateString()}
Time: ${booking.time}
Service: ${booking.service}

We look forward to seeing you!

Best regards,
[Your Company Name]
      `.trim(),
    },
  },
};
