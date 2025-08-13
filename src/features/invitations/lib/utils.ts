import { randomBytes } from 'crypto';

/**
 * Generate a secure token for invitation links
 * @returns A URL-safe random token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calculate expiration date for invitation (30 days from now)
 * @returns Date 30 days in the future
 */
export function getInvitationExpiryDate(): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  return expiryDate;
}

/**
 * Generate invitation email content
 */
export function generateInvitationEmail(params: {
  organizationName: string;
  inviterName: string;
  customMessage?: string;
  invitationToken: string;
  isExistingUser?: boolean;
}) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const invitationUrl = `${baseUrl}/invitation/${params.invitationToken}`;

  const subject = `Invitation to join ${params.organizationName} on MedBookings`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're invited to join ${params.organizationName}</h2>
      
      <p>Hi there,</p>
      
      <p>${params.inviterName} from ${params.organizationName} has invited you to join their organization on MedBookings.</p>
      
      ${
        params.customMessage
          ? `
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Personal message:</strong></p>
          <p>${params.customMessage}</p>
        </div>
      `
          : ''
      }
      
      ${
        !params.isExistingUser
          ? `
        <p>MedBookings is a platform that helps healthcare providers manage their practice, schedule appointments, and connect with patients.</p>
      `
          : ''
      }
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          ${params.isExistingUser ? 'Accept Invitation' : 'Learn More & Join'}
        </a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
      
      <p style="color: #666; font-size: 14px;">
        This invitation will expire in 30 days. If you don't want to join ${params.organizationName}, 
        you can safely ignore this email.
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">
        This email was sent by MedBookings on behalf of ${params.organizationName}.
      </p>
    </div>
  `;

  const textContent = `
You're invited to join ${params.organizationName}

Hi there,

${params.inviterName} from ${params.organizationName} has invited you to join their organization on MedBookings.

${params.customMessage ? `Personal message: ${params.customMessage}\n\n` : ''}

${!params.isExistingUser ? 'MedBookings is a platform that helps healthcare providers manage their practice, schedule appointments, and connect with patients.\n\n' : ''}

To accept this invitation, visit: ${invitationUrl}

This invitation will expire in 30 days. If you don't want to join ${params.organizationName}, you can safely ignore this email.

---
This email was sent by MedBookings on behalf of ${params.organizationName}.
  `;

  return { subject, htmlContent, textContent };
}
