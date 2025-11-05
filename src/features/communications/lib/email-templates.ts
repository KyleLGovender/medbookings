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

/**
 * Welcome member email template (sent after accepting invitation)
 */
export interface WelcomeMemberData {
  organizationName: string;
  memberName: string;
  role: string;
  dashboardUrl: string;
}

export function getWelcomeMemberTemplate(data: WelcomeMemberData): TemplateData {
  const subject = `Welcome to ${data.organizationName}!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Organization</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
        .welcome-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .cta-button { background-color: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold; }
        .button-container { text-align: center; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1fae5; font-size: 14px; color: #374151; text-align: center; }
        h1 { margin: 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Welcome Aboard!</h1>
        <p style="font-size: 18px; margin-top: 10px;">You're now part of ${data.organizationName}</p>
      </div>

      <div class="content">
        <p>Hello ${data.memberName},</p>

        <p>Congratulations! You've successfully joined <strong>${data.organizationName}</strong> as a <strong>${data.role}</strong>.</p>

        <div class="welcome-box">
          <h3>🚀 Getting Started</h3>
          <ul>
            <li>Access your organization dashboard to view schedules and appointments</li>
            <li>Set up your availability and calendar preferences</li>
            <li>Collaborate with other team members</li>
            <li>Manage bookings and patient appointments</li>
          </ul>
        </div>

        <div class="button-container">
          <a href="${data.dashboardUrl}" class="cta-button">Go to Dashboard</a>
        </div>

        <p>If you have any questions or need assistance, don't hesitate to reach out to your organization administrator.</p>

        <div class="footer">
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to ${data.organizationName}!
===================================

Hello ${data.memberName},

Congratulations! You've successfully joined ${data.organizationName} as a ${data.role}.

Getting Started:
- Access your organization dashboard to view schedules and appointments
- Set up your availability and calendar preferences
- Collaborate with other team members
- Manage bookings and patient appointments

Dashboard: ${data.dashboardUrl}

If you have any questions or need assistance, don't hesitate to reach out to your organization administrator.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Invitation rejected notification (sent to inviter)
 */
export interface InvitationRejectedData {
  organizationName: string;
  inviterName: string;
  recipientEmail: string;
  rejectedAt: Date;
}

export function getInvitationRejectedTemplate(data: InvitationRejectedData): TemplateData {
  const rejectionDate = data.rejectedAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Invitation to ${data.organizationName} was declined`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation Declined</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #64748b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #64748b; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Invitation Declined</h1>
        <p style="font-size: 16px; margin-top: 10px;">Organization invitation was not accepted</p>
      </div>

      <div class="content">
        <p>Hello ${data.inviterName},</p>

        <p>We wanted to let you know that your invitation to join <strong>${data.organizationName}</strong> has been declined.</p>

        <div class="info-box">
          <p><strong>Declined by:</strong> ${data.recipientEmail}</p>
          <p><strong>Date:</strong> ${rejectionDate}</p>
        </div>

        <p>If you believe this was a mistake or would like to send another invitation, you can do so from your organization's member management page.</p>

        <div class="footer">
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Invitation Declined
==================

Hello ${data.inviterName},

Your invitation to join ${data.organizationName} has been declined.

Declined by: ${data.recipientEmail}
Date: ${rejectionDate}

If you believe this was a mistake or would like to send another invitation, you can do so from your organization's member management page.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Role changed notification (sent to member whose role was updated)
 */
export interface RoleChangedData {
  organizationName: string;
  memberName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
}

export function getRoleChangedTemplate(data: RoleChangedData): TemplateData {
  const subject = `Your role in ${data.organizationName} has been updated`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Role Updated</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .role-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .role-change { display: flex; align-items: center; justify-content: center; gap: 15px; margin: 20px 0; }
        .role-badge { background-color: #dbeafe; color: #1e40af; padding: 8px 16px; border-radius: 6px; font-weight: bold; }
        .arrow { font-size: 24px; color: #2563eb; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔄 Role Updated</h1>
        <p style="font-size: 16px; margin-top: 10px;">Your permissions have changed</p>
      </div>

      <div class="content">
        <p>Hello ${data.memberName},</p>

        <p>Your role in <strong>${data.organizationName}</strong> has been updated by ${data.changedBy}.</p>

        <div class="role-box">
          <h3 style="text-align: center; color: #1e40af;">Role Change</h3>
          <div class="role-change">
            <span class="role-badge">${data.oldRole}</span>
            <span class="arrow">→</span>
            <span class="role-badge">${data.newRole}</span>
          </div>
        </div>

        <p>This change may affect your permissions and access to certain features within the organization. If you have any questions about your new role, please contact your organization administrator.</p>

        <div class="footer">
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Role Updated
============

Hello ${data.memberName},

Your role in ${data.organizationName} has been updated by ${data.changedBy}.

Role Change:
${data.oldRole} → ${data.newRole}

This change may affect your permissions and access to certain features within the organization. If you have any questions about your new role, please contact your organization administrator.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Member removed notification (sent to removed member)
 */
export interface MemberRemovedData {
  organizationName: string;
  memberName: string;
  removedBy: string;
}

export function getMemberRemovedTemplate(data: MemberRemovedData): TemplateData {
  const subject = `You have been removed from ${data.organizationName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Organization Membership Ended</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #64748b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #64748b; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Organization Membership Ended</h1>
        <p style="font-size: 16px; margin-top: 10px;">You are no longer a member</p>
      </div>

      <div class="content">
        <p>Hello ${data.memberName},</p>

        <p>This is to inform you that you have been removed from <strong>${data.organizationName}</strong> by ${data.removedBy}.</p>

        <div class="info-box">
          <h3>What this means:</h3>
          <ul>
            <li>You no longer have access to the organization's resources</li>
            <li>You cannot view or manage organization appointments</li>
            <li>Your personal MedBookings account remains active</li>
          </ul>
        </div>

        <p>If you believe this was done in error or have questions, please contact the organization administrator at ${data.removedBy}.</p>

        <div class="footer">
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Organization Membership Ended
==============================

Hello ${data.memberName},

You have been removed from ${data.organizationName} by ${data.removedBy}.

What this means:
- You no longer have access to the organization's resources
- You cannot view or manage organization appointments
- Your personal MedBookings account remains active

If you believe this was done in error or have questions, please contact the organization administrator.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Invitation cancelled notification (sent to cancelled invitee)
 */
export interface InvitationCancelledData {
  organizationName: string;
  recipientEmail: string;
}

export function getInvitationCancelledTemplate(data: InvitationCancelledData): TemplateData {
  const subject = `Invitation to ${data.organizationName} has been cancelled`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation Cancelled</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #64748b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #64748b; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Invitation Cancelled</h1>
        <p style="font-size: 16px; margin-top: 10px;">Organization invitation no longer valid</p>
      </div>

      <div class="content">
        <p>Hello,</p>

        <p>The invitation to join <strong>${data.organizationName}</strong> has been cancelled by the organization administrator.</p>

        <div class="info-box">
          <p>The invitation link you may have received is no longer valid and cannot be used to join the organization.</p>
        </div>

        <p>If you believe this was done in error or have questions, please contact the organization directly.</p>

        <div class="footer">
          <p>This notification was sent to ${data.recipientEmail}</p>
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Invitation Cancelled
====================

Hello,

The invitation to join ${data.organizationName} has been cancelled by the organization administrator.

The invitation link you may have received is no longer valid and cannot be used to join the organization.

If you believe this was done in error or have questions, please contact the organization directly.

This notification was sent to ${data.recipientEmail}

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Organization registration welcome email (sent to organization creator)
 */
export interface OrganizationRegisteredData {
  organizationName: string;
  creatorName: string;
  dashboardUrl: string;
}

export function getOrganizationRegisteredTemplate(data: OrganizationRegisteredData): TemplateData {
  const subject = `Welcome to MedBookings - ${data.organizationName} Created Successfully`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Organization Created</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
        .steps-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .cta-button { background-color: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold; }
        .button-container { text-align: center; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1fae5; font-size: 14px; color: #374151; text-align: center; }
        h1 { margin: 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Organization Created!</h1>
        <p style="font-size: 18px; margin-top: 10px;">Welcome to MedBookings</p>
      </div>

      <div class="content">
        <p>Hello ${data.creatorName},</p>

        <p>Congratulations! Your organization <strong>${data.organizationName}</strong> has been successfully created on MedBookings.</p>

        <div class="steps-box">
          <h3>🚀 Next Steps</h3>
          <ol>
            <li><strong>Set up your organization profile</strong> - Add locations, services, and branding</li>
            <li><strong>Invite team members</strong> - Collaborate with providers and staff</li>
            <li><strong>Configure availability</strong> - Set up your scheduling and booking preferences</li>
            <li><strong>Go live!</strong> - Start accepting appointments from patients</li>
          </ol>
        </div>

        <div class="button-container">
          <a href="${data.dashboardUrl}" class="cta-button">Go to Organization Dashboard</a>
        </div>

        <p>If you need help getting started or have any questions, our support team is here to assist you.</p>

        <div class="footer">
          <p><strong>MedBookings</strong></p>
          <p>Making healthcare appointments simple and convenient</p>
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Organization Created Successfully!
==================================

Hello ${data.creatorName},

Congratulations! Your organization ${data.organizationName} has been successfully created on MedBookings.

Next Steps:
1. Set up your organization profile - Add locations, services, and branding
2. Invite team members - Collaborate with providers and staff
3. Configure availability - Set up your scheduling and booking preferences
4. Go live! - Start accepting appointments from patients

Dashboard: ${data.dashboardUrl}

If you need help getting started or have any questions, our support team is here to assist you.

MedBookings
Making healthcare appointments simple and convenient

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}
