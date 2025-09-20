/**
 * Test the complete booking email flow
 * This simulates what happens during a real booking
 * Run with: node scripts/testing/test-booking-email-flow.js your-email@example.com
 */

require('dotenv').config();

async function testBookingEmailFlow() {
  const testEmail = process.argv[2];

  if (!testEmail) {
    console.log('Usage: node scripts/testing/test-booking-email-flow.js your-email@example.com');
    process.exit(1);
  }

  console.log('🔄 Testing Complete Booking Email Flow...\n');

  try {
    // Import SendGrid and templates
    const sgMail = require('@sendgrid/mail');

    // Initialize SendGrid
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('SendGrid not configured');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const {
      getGuestBookingConfirmationTemplate,
      getProviderBookingNotificationTemplate,
    } = require('./email-templates-for-testing.js');

    // Create test booking data (same as what would be created in a real booking)
    const testBookingDetails = {
      bookingId: 'test-booking-' + Date.now(),
      providerName: 'Dr. Michael Smith',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // +30 min
      serviceType: 'General Consultation',
      location: 'Cape Town Medical Center',
      guestName: 'Test Patient',
      guestEmail: testEmail,
      guestPhone: '+27821234567',
      notes: 'Testing the complete booking email flow'
    };

    console.log('📋 Test Booking Details:');
    console.log(`   Booking ID: ${testBookingDetails.bookingId}`);
    console.log(`   Provider: ${testBookingDetails.providerName}`);
    console.log(`   Guest: ${testBookingDetails.guestName}`);
    console.log(`   Date: ${new Date(testBookingDetails.startTime).toLocaleDateString()}`);
    console.log(`   Time: ${new Date(testBookingDetails.startTime).toLocaleTimeString()}`);

    // Test guest confirmation email
    console.log('\n📧 Sending Guest Booking Confirmation...');
    const guestEmailTemplate = getGuestBookingConfirmationTemplate(testBookingDetails);

    const guestMsg = {
      to: testEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: guestEmailTemplate.subject,
      text: guestEmailTemplate.text,
      html: guestEmailTemplate.html,
    };

    await sgMail.send(guestMsg);
    console.log('✅ Guest confirmation email sent successfully!');

    // Wait a moment between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test provider notification email
    console.log('\n📧 Sending Provider Booking Notification...');
    const providerEmailTemplate = getProviderBookingNotificationTemplate(testBookingDetails);

    const providerMsg = {
      to: testEmail, // Sending to your email for testing
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: providerEmailTemplate.subject,
      text: providerEmailTemplate.text,
      html: providerEmailTemplate.html,
    };

    await sgMail.send(providerMsg);
    console.log('✅ Provider notification email sent successfully!');

    console.log('\n🎉 Complete booking email flow test completed!');
    console.log('\n📬 Check your email for:');
    console.log('1. Guest booking confirmation (should look like a customer confirmation)');
    console.log('2. Provider booking notification (should look like a business alert)');

    console.log('\n💡 If emails arrived successfully, your booking system is ready!');

  } catch (error) {
    console.log('❌ Booking email flow test failed:', error.message);

    if (error.message.includes('SendGrid not configured')) {
      console.log('\n🔧 SendGrid Configuration Required:');
      console.log('1. Get your SendGrid API key from https://app.sendgrid.com/settings/api_keys');
      console.log('2. Add to your .env file:');
      console.log('   SENDGRID_API_KEY=your_api_key_here');
      console.log('   SENDGRID_FROM_EMAIL=your_verified_sender@domain.com');
      console.log('3. Verify your sender email in SendGrid console');
    }
  }
}

testBookingEmailFlow();