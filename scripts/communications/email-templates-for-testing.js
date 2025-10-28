/**
 * Simple JavaScript version of email templates for testing
 * This avoids TypeScript compilation issues in Node.js test scripts
 */

function getGuestBookingConfirmationTemplate(booking) {
  const date = new Date(booking.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const startTime = new Date(booking.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTime = new Date(booking.endTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Booking Confirmation - ${booking.providerName} on ${date}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #1e40af; }
        .value { margin-left: 10px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Booking Confirmed!</h1>
        <p>Your appointment has been successfully booked</p>
      </div>

      <div class="content">
        <p>Dear ${booking.guestName},</p>

        <p>Thank you for booking with MedBookings! Your appointment has been confirmed with the following details:</p>

        <div class="booking-details">
          <h3>📅 Appointment Details</h3>

          <div class="detail-row">
            <span class="label">Provider:</span>
            <span class="value">${booking.providerName}</span>
          </div>

          <div class="detail-row">
            <span class="label">Date:</span>
            <span class="value">${date}</span>
          </div>

          <div class="detail-row">
            <span class="label">Time:</span>
            <span class="value">${startTime} - ${endTime}</span>
          </div>

          <div class="detail-row">
            <span class="label">Service:</span>
            <span class="value">${booking.serviceType}</span>
          </div>

          ${
            booking.location
              ? `
          <div class="detail-row">
            <span class="label">Location:</span>
            <span class="value">${booking.location}</span>
          </div>
          `
              : ''
          }

          <div class="detail-row">
            <span class="label">Booking Reference:</span>
            <span class="value">#${booking.bookingId.substring(0, 8).toUpperCase()}</span>
          </div>

          ${
            booking.notes
              ? `
          <div class="detail-row">
            <span class="label">Notes:</span>
            <span class="value">${booking.notes}</span>
          </div>
          `
              : ''
          }
        </div>

        <h3>📝 What's Next?</h3>
        <ul>
          <li>Save this email for your records</li>
          <li>Add the appointment to your calendar</li>
          <li>Arrive 5-10 minutes early ${booking.location ? 'at the location' : 'for your online meeting'}</li>
          <li>Bring any relevant documents or information</li>
        </ul>

        <p>If you need to reschedule or cancel your appointment, please contact the provider directly or reply to this email.</p>

        <div class="footer">
          <p><strong>MedBookings</strong><br>
          Making healthcare appointments simple and convenient.</p>

          <p>Need help? Reply to this email or visit our support center.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Booking Confirmation - ${booking.providerName}

Dear ${booking.guestName},

Your appointment has been confirmed!

Appointment Details:
- Provider: ${booking.providerName}
- Date: ${date}
- Time: ${startTime} - ${endTime}
- Service: ${booking.serviceType}
${booking.location ? `- Location: ${booking.location}` : ''}
- Booking Reference: #${booking.bookingId.substring(0, 8).toUpperCase()}
${booking.notes ? `- Notes: ${booking.notes}` : ''}

What's Next?
- Save this email for your records
- Add the appointment to your calendar
- Arrive 5-10 minutes early ${booking.location ? 'at the location' : 'for your online meeting'}
- Bring any relevant documents or information

If you need to reschedule or cancel, please contact the provider directly or reply to this email.

Best regards,
MedBookings Team
  `;

  return { subject, html, text };
}

function getProviderBookingNotificationTemplate(booking) {
  const date = new Date(booking.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const startTime = new Date(booking.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTime = new Date(booking.endTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `New Booking - ${booking.guestName} on ${date}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #047857; }
        .value { margin-left: 10px; }
        .guest-info { background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1fae5; font-size: 14px; color: #374151; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📅 New Booking Alert</h1>
        <p>You have a new appointment booking</p>
      </div>

      <div class="content">
        <p>Hello ${booking.providerName},</p>

        <p>You have received a new booking through MedBookings. Please review the details below:</p>

        <div class="booking-details">
          <h3>📋 Appointment Details</h3>

          <div class="detail-row">
            <span class="label">Date:</span>
            <span class="value">${date}</span>
          </div>

          <div class="detail-row">
            <span class="label">Time:</span>
            <span class="value">${startTime} - ${endTime}</span>
          </div>

          <div class="detail-row">
            <span class="label">Service:</span>
            <span class="value">${booking.serviceType}</span>
          </div>

          ${
            booking.location
              ? `
          <div class="detail-row">
            <span class="label">Location:</span>
            <span class="value">${booking.location}</span>
          </div>
          `
              : ''
          }

          <div class="detail-row">
            <span class="label">Booking Reference:</span>
            <span class="value">#${booking.bookingId.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>

        <div class="guest-info">
          <h3>👤 Guest Information</h3>

          <div class="detail-row">
            <span class="label">Name:</span>
            <span class="value">${booking.guestName}</span>
          </div>

          <div class="detail-row">
            <span class="label">Email:</span>
            <span class="value">${booking.guestEmail}</span>
          </div>

          ${
            booking.guestPhone
              ? `
          <div class="detail-row">
            <span class="label">Phone:</span>
            <span class="value">${booking.guestPhone}</span>
          </div>
          `
              : ''
          }

          ${
            booking.notes
              ? `
          <div class="detail-row">
            <span class="label">Notes:</span>
            <span class="value">${booking.notes}</span>
          </div>
          `
              : ''
          }
        </div>

        <h3>📝 Next Steps</h3>
        <ul>
          <li>Review your calendar and prepare for the appointment</li>
          <li>The guest has been sent a confirmation email with all details</li>
          <li>If you need to reschedule or cancel, please contact the guest directly</li>
          <li>Log into your MedBookings dashboard to manage this booking</li>
        </ul>

        <div class="footer">
          <p><strong>MedBookings Provider Portal</strong><br>
          Managing your appointments has never been easier.</p>

          <p>Questions? Contact our provider support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Booking Notification

Hello ${booking.providerName},

You have received a new booking through MedBookings.

Appointment Details:
- Date: ${date}
- Time: ${startTime} - ${endTime}
- Service: ${booking.serviceType}
${booking.location ? `- Location: ${booking.location}` : ''}
- Booking Reference: #${booking.bookingId.substring(0, 8).toUpperCase()}

Guest Information:
- Name: ${booking.guestName}
- Email: ${booking.guestEmail}
${booking.guestPhone ? `- Phone: ${booking.guestPhone}` : ''}
${booking.notes ? `- Notes: ${booking.notes}` : ''}

Next Steps:
- Review your calendar and prepare for the appointment
- The guest has been sent a confirmation email
- Log into your MedBookings dashboard to manage this booking

Best regards,
MedBookings Team
  `;

  return { subject, html, text };
}

module.exports = {
  getGuestBookingConfirmationTemplate,
  getProviderBookingNotificationTemplate,
};
