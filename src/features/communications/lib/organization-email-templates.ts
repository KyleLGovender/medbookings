/**
 * Organization-related email templates
 */
import { nowUTC } from '@/lib/timezone';

interface TemplateData {
  subject: string;
  html: string;
  text: string;
}

/**
 * Organization registration notification email template (for admins)
 */
export interface OrganizationRegistrationData {
  organizationName: string;
  organizationEmail?: string;
  organizationPhone?: string;
  registrantName: string;
  registrantEmail: string;
  registrationDate: Date;
}

export function getOrganizationRegistrationTemplate(
  data: OrganizationRegistrationData
): TemplateData {
  const registrationUrl = `${process.env.NEXTAUTH_URL || 'https://medbookings.co.za'}/admin/organizations`;

  const subject = `New Organization Registration: ${data.organizationName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Organization Registration</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 25px; border-radius: 0 0 8px 8px; }
        .alert-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .detail-row { margin: 12px 0; }
        .label { font-weight: bold; color: #991b1b; }
        .value { margin-left: 10px; }
        .cta-button { background-color: #dc2626; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px auto; font-weight: bold; }
        .button-container { text-align: center; }
        .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 New Organization Registration</h1>
        <p>Action Required: Review and Approve</p>
      </div>

      <div class="content">
        <p>Dear Admin Team,</p>

        <p>A new organization has registered on MedBookings and requires your review and approval.</p>

        <div class="alert-box">
          <h3>📋 Registration Details</h3>

          <div class="detail-row">
            <span class="label">Organization Name:</span>
            <span class="value">${data.organizationName}</span>
          </div>

          <div class="detail-row">
            <span class="label">Registered By:</span>
            <span class="value">${data.registrantName} (${data.registrantEmail})</span>
          </div>

          ${
            data.organizationEmail
              ? `
          <div class="detail-row">
            <span class="label">Organization Email:</span>
            <span class="value">${data.organizationEmail}</span>
          </div>
          `
              : ''
          }

          ${
            data.organizationPhone
              ? `
          <div class="detail-row">
            <span class="label">Organization Phone:</span>
            <span class="value">${data.organizationPhone}</span>
          </div>
          `
              : ''
          }

          <div class="detail-row">
            <span class="label">Registration Date:</span>
            <span class="value">${data.registrationDate.toLocaleString()}</span>
          </div>
        </div>

        <div class="button-container">
          <a href="${registrationUrl}" class="cta-button">Review in Admin Portal</a>
        </div>

        <p><strong>⏰ Please review this registration within 24-48 hours.</strong></p>

        <div class="footer">
          <p>This is an automated notification from MedBookings Admin System</p>
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Organization Registration
=============================

A new organization has registered on MedBookings and requires your review.

Registration Details:
--------------------
Organization Name: ${data.organizationName}
Registered By: ${data.registrantName} (${data.registrantEmail})
${data.organizationEmail ? `Organization Email: ${data.organizationEmail}` : ''}
${data.organizationPhone ? `Organization Phone: ${data.organizationPhone}` : ''}
Registration Date: ${data.registrationDate.toLocaleString()}

Review in Admin Portal:
${registrationUrl}

Please review this registration within 24-48 hours.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Member welcome email template (after accepting invitation)
 */
export interface MemberWelcomeData {
  memberName: string;
  organizationName: string;
  role: string;
  dashboardUrl?: string;
}

export function getMemberWelcomeTemplate(data: MemberWelcomeData): TemplateData {
  const dashboardUrl =
    data.dashboardUrl || `${process.env.NEXTAUTH_URL || 'https://medbookings.co.za'}/dashboard`;

  const subject = `Welcome to ${data.organizationName} on MedBookings`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Organization</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .welcome-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981; }
        .feature-list { margin: 20px 0; }
        .feature-item { margin: 10px 0; padding-left: 25px; position: relative; }
        .feature-item:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
        .cta-button { background-color: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 25px auto; font-size: 16px; font-weight: bold; }
        .button-container { text-align: center; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Welcome to ${data.organizationName}!</h1>
        <p>You're now part of the team</p>
      </div>

      <div class="content">
        <p>Hi ${data.memberName},</p>

        <p>Congratulations! You've successfully joined <strong>${data.organizationName}</strong> as a <strong>${data.role}</strong>.</p>

        <div class="welcome-box">
          <h3>What you can do now:</h3>
          <div class="feature-list">
            <div class="feature-item">Access the organization's calendar and schedules</div>
            <div class="feature-item">View and manage appointments</div>
            <div class="feature-item">Collaborate with team members</div>
            <div class="feature-item">Access organization resources</div>
            ${data.role === 'ADMIN' || data.role === 'OWNER' ? '<div class="feature-item">Manage organization settings and members</div>' : ''}
          </div>
        </div>

        <div class="button-container">
          <a href="${dashboardUrl}" class="cta-button">Go to Dashboard</a>
        </div>

        <p><strong>Need help getting started?</strong></p>
        <ul>
          <li>Check out your dashboard for quick access to all features</li>
          <li>View the organization calendar to see upcoming appointments</li>
          <li>Update your profile with your availability preferences</li>
        </ul>

        <div class="footer">
          <p>Welcome aboard!</p>
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to ${data.organizationName}!
=====================================

Hi ${data.memberName},

Congratulations! You've successfully joined ${data.organizationName} as a ${data.role}.

What you can do now:
- Access the organization's calendar and schedules
- View and manage appointments
- Collaborate with team members
- Access organization resources
${data.role === 'ADMIN' || data.role === 'OWNER' ? '- Manage organization settings and members' : ''}

Go to Dashboard:
${dashboardUrl}

Need help getting started?
- Check out your dashboard for quick access to all features
- View the organization calendar to see upcoming appointments
- Update your profile with your availability preferences

Welcome aboard!

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Role change notification email template
 */
export interface RoleChangeData {
  memberName: string;
  memberEmail: string;
  organizationName: string;
  oldRole: string;
  newRole: string;
  changedByName: string;
}

export function getRoleChangeTemplate(data: RoleChangeData): TemplateData {
  const subject = `Your role has been updated in ${data.organizationName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Role Update Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 25px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #1e40af; }
        .value { margin-left: 10px; }
        .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📝 Role Update</h1>
        <p>Your permissions have been updated</p>
      </div>

      <div class="content">
        <p>Hi ${data.memberName},</p>

        <p>Your role in <strong>${data.organizationName}</strong> has been updated.</p>

        <div class="info-box">
          <h3>Role Change Details</h3>

          <div class="detail-row">
            <span class="label">Previous Role:</span>
            <span class="value">${data.oldRole}</span>
          </div>

          <div class="detail-row">
            <span class="label">New Role:</span>
            <span class="value"><strong>${data.newRole}</strong></span>
          </div>

          <div class="detail-row">
            <span class="label">Changed By:</span>
            <span class="value">${data.changedByName}</span>
          </div>
        </div>

        <p>Your permissions and access levels have been adjusted according to your new role. You may need to refresh your browser or log out and back in to see all changes.</p>

        <p>If you have any questions about this change, please contact your organization administrator.</p>

        <div class="footer">
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Role Update - ${data.organizationName}
======================================

Hi ${data.memberName},

Your role in ${data.organizationName} has been updated.

Role Change Details:
-------------------
Previous Role: ${data.oldRole}
New Role: ${data.newRole}
Changed By: ${data.changedByName}

Your permissions and access levels have been adjusted according to your new role.
You may need to refresh your browser or log out and back in to see all changes.

If you have any questions about this change, please contact your organization administrator.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Member removal notification email template
 */
export interface MemberRemovalData {
  memberName: string;
  memberEmail: string;
  organizationName: string;
  removedByName: string;
  reason?: string;
}

export function getMemberRemovalTemplate(data: MemberRemovalData): TemplateData {
  const subject = `You have been removed from ${data.organizationName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Membership Removal Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ef4444; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 25px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
        .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Membership Update</h1>
      </div>

      <div class="content">
        <p>Hi ${data.memberName},</p>

        <p>We're writing to inform you that your membership in <strong>${data.organizationName}</strong> has been terminated.</p>

        <div class="info-box">
          <p><strong>Effective immediately, you no longer have access to:</strong></p>
          <ul>
            <li>Organization calendar and schedules</li>
            <li>Appointment management</li>
            <li>Organization resources and data</li>
          </ul>
        </div>

        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}

        <p>If you believe this was done in error or have questions about this decision, please contact ${data.removedByName} or the organization administrator directly.</p>

        <p>Thank you for your time with ${data.organizationName}.</p>

        <div class="footer">
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Membership Update - ${data.organizationName}
============================================

Hi ${data.memberName},

We're writing to inform you that your membership in ${data.organizationName} has been terminated.

Effective immediately, you no longer have access to:
- Organization calendar and schedules
- Appointment management
- Organization resources and data

${data.reason ? `Reason: ${data.reason}` : ''}

If you believe this was done in error or have questions about this decision, please contact ${data.removedByName} or the organization administrator directly.

Thank you for your time with ${data.organizationName}.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Invitation rejection notification email template
 */
export interface InvitationRejectionData {
  inviterName: string;
  inviterEmail: string;
  invitedEmail: string;
  organizationName: string;
  rejectionDate: Date;
}

export function getInvitationRejectionTemplate(data: InvitationRejectionData): TemplateData {
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
        .header { background-color: #f97316; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 25px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
        .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📢 Invitation Update</h1>
      </div>

      <div class="content">
        <p>Hi ${data.inviterName},</p>

        <p>We wanted to let you know that your invitation for <strong>${data.invitedEmail}</strong> to join <strong>${data.organizationName}</strong> has been declined.</p>

        <div class="info-box">
          <p><strong>Invitation Details:</strong></p>
          <ul>
            <li>Invited Email: ${data.invitedEmail}</li>
            <li>Organization: ${data.organizationName}</li>
            <li>Declined On: ${data.rejectionDate.toLocaleDateString()}</li>
          </ul>
        </div>

        <p>The user has chosen not to join the organization at this time. You may send a new invitation in the future if circumstances change.</p>

        <div class="footer">
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Invitation Update - ${data.organizationName}
===========================================

Hi ${data.inviterName},

Your invitation for ${data.invitedEmail} to join ${data.organizationName} has been declined.

Invitation Details:
- Invited Email: ${data.invitedEmail}
- Organization: ${data.organizationName}
- Declined On: ${data.rejectionDate.toLocaleDateString()}

The user has chosen not to join the organization at this time. You may send a new invitation in the future if circumstances change.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Invitation cancellation notification email template
 */
export interface InvitationCancellationData {
  recipientEmail: string;
  organizationName: string;
  cancelledByName: string;
  reason?: string;
}

export function getInvitationCancellationTemplate(data: InvitationCancellationData): TemplateData {
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
        .header { background-color: #6b7280; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 25px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280; }
        .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Invitation Cancelled</h1>
      </div>

      <div class="content">
        <p>Hello,</p>

        <p>We're writing to inform you that your invitation to join <strong>${data.organizationName}</strong> on MedBookings has been cancelled.</p>

        <div class="info-box">
          <p>The invitation was cancelled by ${data.cancelledByName}.</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        </div>

        <p>The invitation link you received is no longer valid and cannot be used to join the organization.</p>

        <p>If you believe this was done in error or have any questions, please contact the organization administrator directly.</p>

        <div class="footer">
          <p>© ${nowUTC().getFullYear()} MedBookings. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Invitation Cancelled - ${data.organizationName}
===============================================

Hello,

We're writing to inform you that your invitation to join ${data.organizationName} on MedBookings has been cancelled.

The invitation was cancelled by ${data.cancelledByName}.
${data.reason ? `Reason: ${data.reason}` : ''}

The invitation link you received is no longer valid and cannot be used to join the organization.

If you believe this was done in error or have any questions, please contact the organization administrator directly.

© ${nowUTC().getFullYear()} MedBookings. All rights reserved.
  `;

  return { subject, html, text };
}
