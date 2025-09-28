import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { sendEmail } from '@/lib/communications/email';

export async function POST(request: NextRequest) {
  try {
    // Only allow admin users or in development
    const user = await getCurrentUser();
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment && (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject = 'Test Email from MedBookings' } = body;

    if (!to) {
      return NextResponse.json({ error: 'Email recipient (to) is required' }, { status: 400 });
    }

    console.log('Testing email delivery to:', to);

    await sendEmail({
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>SendGrid Test Email</h2>
            <p>This is a test email to verify SendGrid configuration.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
            <p><strong>From Email:</strong> ${process.env.SENDGRID_FROM_EMAIL}</p>
            <p>If you received this email, SendGrid is working correctly!</p>
          </body>
        </html>
      `,
      text: `SendGrid Test Email - ${new Date().toISOString()}. If you received this, SendGrid is working!`,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test email failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
