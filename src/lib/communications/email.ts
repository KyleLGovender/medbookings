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

    // Log details but don't expose SendGrid internals
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('SendGrid error details:', {
        statusCode: sgError.code,
        message: sgError.message,
      });
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
