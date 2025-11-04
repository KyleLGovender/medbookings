/**
 * Email templates for booking confirmations and notifications
 */
import env from '@/config/env/server';
import { nowUTC, parseUTC } from '@/lib/timezone';

interface BookingDetails {
  bookingId: string;
  providerName: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  location?: string;
  meetingLink?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  notes?: string;
}

interface TemplateData {
  subject: string;
  html: string;
  text: string;
}

/**
 * Guest booking confirmation email template
 */
export function getGuestBookingConfirmationTemplate(booking: BookingDetails): TemplateData {
  const startDateTime = parseUTC(booking.startTime);
  const endDateTime = parseUTC(booking.endTime);

  const date = startDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const startTime = startDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTime = endDateTime.toLocaleTimeString('en-US', {
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
        .cta-button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
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

          ${
            booking.meetingLink
              ? `
          <div class="detail-row">
            <span class="label">Meeting Link:</span>
            <span class="value"><a href="${booking.meetingLink}" target="_blank">${booking.meetingLink}</a></span>
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
${booking.meetingLink ? `- Meeting Link: ${booking.meetingLink}` : ''}
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

/**
 * Provider booking notification email template
 */
export function getProviderBookingNotificationTemplate(booking: BookingDetails): TemplateData {
  const startDateTime = parseUTC(booking.startTime);
  const endDateTime = parseUTC(booking.endTime);

  const date = startDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const startTime = startDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTime = endDateTime.toLocaleTimeString('en-US', {
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

/**
 * Admin notification for regulatory requirement updates
 */
export function getRequirementUpdateNotificationTemplate(data: {
  providerName: string;
  providerEmail: string;
  providerId: string;
  requirementType: string;
  documentUrl: string;
  notes?: string;
  action: 'created' | 'updated';
}): TemplateData {
  const actionText = data.action === 'created' ? 'submitted' : 'updated';
  const subject = `[Action Required] Provider ${data.providerName} ${actionText} regulatory document`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Regulatory Document Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .details-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #991b1b; }
        .value { margin-left: 10px; }
        .cta-button { background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .warning-box { background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠️ Regulatory Document Update</h1>
        <p>Provider has ${actionText} a document requiring review</p>
      </div>

      <div class="content">
        <p>Dear Admin Team,</p>

        <p>A provider has ${actionText} a regulatory document that requires your review and approval.</p>

        <div class="details-box">
          <h3>📋 Submission Details</h3>

          <div class="detail-row">
            <span class="label">Provider Name:</span>
            <span class="value">${data.providerName}</span>
          </div>

          <div class="detail-row">
            <span class="label">Provider Email:</span>
            <span class="value">${data.providerEmail}</span>
          </div>

          <div class="detail-row">
            <span class="label">Provider ID:</span>
            <span class="value">${data.providerId}</span>
          </div>

          <div class="detail-row">
            <span class="label">Document Type:</span>
            <span class="value">${data.requirementType}</span>
          </div>

          <div class="detail-row">
            <span class="label">Document URL:</span>
            <span class="value"><a href="${data.documentUrl}" target="_blank">View Document</a></span>
          </div>

          ${
            data.notes
              ? `
          <div class="detail-row">
            <span class="label">Provider Notes:</span>
            <span class="value">${data.notes}</span>
          </div>
          `
              : ''
          }

          <div class="detail-row">
            <span class="label">Submission Time:</span>
            <span class="value">${nowUTC().toLocaleString()}</span>
          </div>
        </div>

        <div class="warning-box">
          <strong>⚡ Action Required:</strong>
          <ul style="margin: 10px 0 0 20px;">
            <li>Review the submitted document for compliance</li>
            <li>Verify the document authenticity and validity</li>
            <li>Update the requirement status in the admin portal</li>
            <li>Add notes if rejection or additional information is needed</li>
          </ul>
        </div>

        <center>
          <a href="${env.NEXTAUTH_URL}/admin/providers/${data.providerId}" class="cta-button">
            Review in Admin Portal
          </a>
        </center>

        <div class="footer">
          <p><strong>MedBookings Admin Portal</strong><br>
          This is an automated notification from the regulatory compliance system.</p>

          <p>Please review and process this submission within 24-48 hours to maintain provider satisfaction.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Regulatory Document Update Notification

A provider has ${actionText} a regulatory document requiring review.

Provider Details:
- Name: ${data.providerName}
- Email: ${data.providerEmail}
- Provider ID: ${data.providerId}

Document Details:
- Type: ${data.requirementType}
- Document URL: ${data.documentUrl}
${data.notes ? `- Notes: ${data.notes}` : ''}
- Submission Time: ${nowUTC().toLocaleString()}

Action Required:
1. Review the submitted document for compliance
2. Verify document authenticity and validity
3. Update the requirement status in the admin portal
4. Add notes if rejection or additional information is needed

Review in Admin Portal: ${env.NEXTAUTH_URL}/admin/providers/${data.providerId}

Please process this submission within 24-48 hours.

MedBookings Admin Portal
  `;

  return { subject, html, text };
}

/**
 * Organization invitation email template
 */
export interface OrganizationInvitationData {
  organizationName: string;
  inviterName: string;
  inviterEmail: string;
  recipientEmail: string;
  role: string;
  invitationToken: string;
  expiresAt: Date;
}

export function getOrganizationInvitationTemplate(data: OrganizationInvitationData): TemplateData {
  const invitationUrl = `${env.NEXTAUTH_URL || 'https://medbookings.co.za'}/invitation/${data.invitationToken}`;
  const expiryDate = data.expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Invitation to join ${data.organizationName} on MedBookings`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Organization Invitation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .invitation-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #2563eb; }
        .detail-row { margin: 15px 0; }
        .label { font-weight: bold; color: #1e40af; }
        .value { margin-left: 10px; }
        .cta-button { background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 25px auto; font-size: 16px; font-weight: bold; }
        .button-container { text-align: center; }
        .warning-box { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
        h1 { margin: 0; }
        h3 { color: #1e40af; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 You're Invited!</h1>
        <p style="font-size: 18px; margin-top: 10px;">Join ${data.organizationName} on MedBookings</p>
      </div>

      <div class="content">
        <p>Hello,</p>

        <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on MedBookings as a <strong>${data.role}</strong>.</p>

        <div class="invitation-box">
          <h3>📋 Invitation Details</h3>

          <div class="detail-row">
            <span class="label">Organization:</span>
            <span class="value">${data.organizationName}</span>
          </div>

          <div class="detail-row">
            <span class="label">Your Role:</span>
            <span class="value">${data.role}</span>
          </div>

          <div class="detail-row">
            <span class="label">Invited By:</span>
            <span class="value">${data.inviterName} (${data.inviterEmail})</span>
          </div>

          <div class="detail-row">
            <span class="label">Invitation Expires:</span>
            <span class="value">${expiryDate}</span>
          </div>
        </div>

        <div class="button-container">
          <a href="${invitationUrl}" class="cta-button">Accept Invitation</a>
        </div>

        <div class="warning-box">
          <strong>⏰ Important:</strong> This invitation will expire on ${expiryDate}. Please accept it before then to join the organization.
        </div>

        <p>By accepting this invitation, you'll be able to:</p>
        <ul>
          <li>Access the organization's calendar and availability</li>
          <li>Manage appointments and bookings</li>
          <li>Collaborate with other team members</li>
          <li>Access organization resources and settings based on your role</li>
        </ul>

        <p>If you have any questions about this invitation, please contact ${data.inviterName} at ${data.inviterEmail}.</p>

        <div class="footer">
          <p>This invitation was sent to ${data.recipientEmail}</p>
          <p>If you believe this email was sent to you in error, please ignore it.</p>
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
You're Invited to Join ${data.organizationName} on MedBookings
================================================================

Hello,

${data.inviterName} has invited you to join ${data.organizationName} on MedBookings as a ${data.role}.

Invitation Details:
-------------------
Organization: ${data.organizationName}
Your Role: ${data.role}
Invited By: ${data.inviterName} (${data.inviterEmail})
Invitation Expires: ${expiryDate}

Accept Invitation:
${invitationUrl}

Important: This invitation will expire on ${expiryDate}. Please accept it before then to join the organization.

By accepting this invitation, you'll be able to:
- Access the organization's calendar and availability
- Manage appointments and bookings
- Collaborate with other team members
- Access organization resources and settings based on your role

If you have any questions about this invitation, please contact ${data.inviterName} at ${data.inviterEmail}.

This invitation was sent to ${data.recipientEmail}
If you believe this email was sent to you in error, please ignore it.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}
