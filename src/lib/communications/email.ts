/**
 * Email communication utilities using SendGrid
 */
import sgMail from '@sendgrid/mail';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Send email using SendGrid
 */
export async function sendEmail(emailData: EmailData): Promise<void> {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.warn('SendGrid not configured, logging email instead:', {
        to: emailData.to,
        subject: emailData.subject,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log('Attempting to send email via SendGrid:', {
      to: emailData.to,
      from: emailData.from || process.env.SENDGRID_FROM_EMAIL,
      subject: emailData.subject,
      timestamp: new Date().toISOString(),
    });

    const msg = {
      to: emailData.to,
      from: emailData.from || process.env.SENDGRID_FROM_EMAIL!,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || '', // SendGrid will auto-generate if not provided
    };

    await sgMail.send(msg);

    console.log('Email sent successfully via SendGrid:', {
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);

    // Enhanced SendGrid error logging
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('SendGrid error details:', {
        statusCode: sgError.code,
        message: sgError.message,
        body: sgError.response?.body,
        headers: sgError.response?.headers,
      });

      // Log specific SendGrid issues
      if (sgError.code === 401) {
        console.error('SendGrid authentication failed - check SENDGRID_API_KEY');
      } else if (sgError.code === 403) {
        console.error('SendGrid permission denied - verify sender email and domain verification');
      } else if (sgError.code === 400) {
        console.error('SendGrid bad request - check email format and content');
      }
    } else if (error instanceof Error) {
      console.error('General email error:', error.message);
    }

    throw new Error('Failed to send email');
  }
}

/**
 * Send booking confirmation email to guest
 */
export async function sendBookingConfirmationEmail(
  guestEmail: string,
  emailTemplate: { subject: string; html: string; text: string }
): Promise<void> {
  await sendEmail({
    to: guestEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  });
}

/**
 * Send booking notification email to provider
 */
export async function sendProviderNotificationEmail(
  providerEmail: string,
  emailTemplate: { subject: string; html: string; text: string }
): Promise<void> {
  await sendEmail({
    to: providerEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  });
}

/**
 * Send notification email to admin
 */
export async function sendAdminNotificationEmail(emailTemplate: {
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  // Get admin email from environment or use default
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.SENDGRID_FROM_EMAIL ||
    'admin@medbookings.com';

  await sendEmail({
    to: adminEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  });
}

/**
 * Send email verification email to user
 */
export async function sendEmailVerification(
  userEmail: string,
  verificationToken: string,
  userName?: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

  const subject = 'Verify Your Email Address - MedBookings';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">MedBookings</h1>
        </div>

        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>

          ${userName ? `<p>Hi ${userName},</p>` : '<p>Hello,</p>'}

          <p>Thank you for signing up with MedBookings! To complete your account setup and ensure you receive important notifications, please verify your email address.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
          </div>

          <p>If the button above doesn&apos;t work, you can also click on this link:</p>
          <p style="word-break: break-all; color: #667eea;"><a href="${verificationUrl}">${verificationUrl}</a></p>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If you didn&apos;t create an account with MedBookings, you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="font-size: 12px; color: #888; text-align: center;">
            This email was sent by MedBookings. If you have any questions, please contact our support team.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
    Verify Your Email Address - MedBookings

    ${userName ? `Hi ${userName},` : 'Hello,'}

    Thank you for signing up with MedBookings! To complete your account setup and ensure you receive important notifications, please verify your email address.

    Click the link below to verify your email:
    ${verificationUrl}

    If you didn't create an account with MedBookings, you can safely ignore this email.

    Best regards,
    The MedBookings Team
  `;

  await sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  });
}
