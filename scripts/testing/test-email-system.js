/**
 * Test script for SendGrid email system
 * Run with: node scripts/testing/test-email-system.js your-email@example.com
 */

require('dotenv').config();
const sgMail = require('@sendgrid/mail');

async function testEmailSystem() {
  const testEmail = process.argv[2];

  if (!testEmail) {
    console.log('Usage: node scripts/testing/test-email-system.js your-email@example.com');
    process.exit(1);
  }

  console.log('📧 Testing SendGrid Email System...\n');

  // Check environment variables
  console.log('🔍 Checking Environment Variables:');
  console.log(`SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(
    `SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL ? '✅ Set (' + process.env.SENDGRID_FROM_EMAIL + ')' : '❌ Missing'}`
  );

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.log('\n❌ SendGrid not configured. Please add to your .env file:');
    console.log('SENDGRID_API_KEY=your_sendgrid_api_key');
    console.log('SENDGRID_FROM_EMAIL=your_verified_sender@example.com');
    return;
  }

  // Initialize SendGrid
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Test 1: Simple email test
  console.log('\n📤 Test 1: Simple Email Test');
  try {
    const simpleMsg = {
      to: testEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'MedBookings Email Test',
      text: 'This is a test email from your MedBookings application.',
      html: '<h1>Email Test</h1><p>This is a test email from your MedBookings application.</p>',
    };

    await sgMail.send(simpleMsg);
    console.log('✅ Simple email sent successfully!');
  } catch (error) {
    console.log('❌ Simple email failed:', error.message);
    if (error.response) {
      console.log('   Response body:', error.response.body);
    }
  }

  // Test 2: Guest booking confirmation template
  console.log('\n📤 Test 2: Guest Booking Confirmation Template');
  try {
    // Import the template function (JavaScript version for testing)
    const { getGuestBookingConfirmationTemplate } = require('./email-templates-for-testing.js');

    const testBooking = {
      bookingId: 'test-booking-12345',
      providerName: 'Dr. Sarah Johnson',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // +30 min
      serviceType: 'General Consultation',
      location: 'Cape Town Medical Center',
      guestName: 'Test Patient',
      guestEmail: testEmail,
      notes: 'This is a test booking for email verification',
    };

    const emailTemplate = getGuestBookingConfirmationTemplate(testBooking);

    const guestMsg = {
      to: testEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    };

    await sgMail.send(guestMsg);
    console.log('✅ Guest booking confirmation email sent successfully!');
  } catch (error) {
    console.log('❌ Guest booking email failed:', error.message);
    if (error.response) {
      console.log('   Response body:', error.response.body);
    }
  }

  // Test 3: Provider notification template
  console.log('\n📤 Test 3: Provider Notification Template');
  try {
    const { getProviderBookingNotificationTemplate } = require('./email-templates-for-testing.js');

    const testBooking = {
      bookingId: 'test-booking-12345',
      providerName: 'Dr. Sarah Johnson',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      serviceType: 'General Consultation',
      location: 'Cape Town Medical Center',
      guestName: 'Test Patient',
      guestEmail: testEmail,
      guestPhone: '+27821234567',
      notes: 'This is a test booking for email verification',
    };

    const emailTemplate = getProviderBookingNotificationTemplate(testBooking);

    const providerMsg = {
      to: testEmail, // Sending to your email for testing
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    };

    await sgMail.send(providerMsg);
    console.log('✅ Provider notification email sent successfully!');
  } catch (error) {
    console.log('❌ Provider notification email failed:', error.message);
    if (error.response) {
      console.log('   Response body:', error.response.body);
    }
  }

  console.log('\n🎉 Email testing completed!');
  console.log('Check your email inbox for the test messages.');
  console.log('\n💡 Next steps:');
  console.log('1. Check your spam folder if emails are missing');
  console.log('2. Verify your SendGrid sender authentication');
  console.log('3. Try a real booking to test the full flow');
}

testEmailSystem();
