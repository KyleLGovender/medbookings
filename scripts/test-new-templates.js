/**
 * Simple test script for new WhatsApp templates
 * Run with: node scripts/test-new-templates.js +27XXXXXXXXX
 */

require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function testNewTemplates() {
  const testPhone = process.argv[2];

  if (!testPhone) {
    console.log('Usage: node scripts/test-new-templates.js +27XXXXXXXXX');
    console.log('Example: node scripts/test-new-templates.js +27821234567');
    process.exit(1);
  }

  console.log('🧪 Testing NEW WhatsApp templates...\n');

  // Test guest booking confirmation template
  console.log('📱 Testing Guest Booking Confirmation Template');
  console.log('Template: guest_booking_confirmation_v2');
  console.log('SID: HXaa942313733fddc9c10d28597e2894f4');

  try {
    const guestTemplateVariables = JSON.stringify({
      1: 'Sarah Johnson', // Guest name
      2: 'Dr. Michael Smith', // Provider name
      3: 'Friday, December 15, 2023', // Date
      4: '2:30 PM', // Time
      5: 'General Consultation', // Service
      6: 'Cape Town Medical Center', // Location
      7: '#MB12345A', // Reference
      8: '30 minutes', // Duration
    });

    const guestMessage = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${testPhone}`,
      contentSid: 'HXaa942313733fddc9c10d28597e2894f4',
      contentVariables: guestTemplateVariables,
    });

    console.log('✅ Guest template sent successfully!');
    console.log(`   Message SID: ${guestMessage.sid}`);
    console.log(`   Status: ${guestMessage.status}\n`);

  } catch (error) {
    console.log('❌ Guest template failed:', error.message);
    console.log('   Error code:', error.code, '\n');
  }

  // Wait a moment between messages
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test provider booking notification template
  console.log('📱 Testing Provider Booking Notification Template');
  console.log('Template: provider_booking_notification_v2');
  console.log('SID: HXf24f9f7d50ef56e67348e5fb15ad0ed7');

  try {
    const providerTemplateVariables = JSON.stringify({
      1: 'Dr. Michael Smith', // Provider name
      2: 'Sarah Johnson', // Guest name
      3: 'Friday, December 15, 2023', // Date
      4: '2:30 PM', // Time
      5: 'General Consultation', // Service
      6: 'Cape Town Medical Center', // Location
      7: '#MB12345A', // Reference
      8: '+27821234567', // Guest phone
      9: '30 minutes', // Duration
    });

    const providerMessage = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${testPhone}`,
      contentSid: 'HXf24f9f7d50ef56e67348e5fb15ad0ed7',
      contentVariables: providerTemplateVariables,
    });

    console.log('✅ Provider template sent successfully!');
    console.log(`   Message SID: ${providerMessage.sid}`);
    console.log(`   Status: ${providerMessage.status}\n`);

  } catch (error) {
    console.log('❌ Provider template failed:', error.message);
    console.log('   Error code:', error.code, '\n');
  }

  console.log('🎉 Template testing completed!');
  console.log('Check your WhatsApp for the test messages.');
  console.log('\n💡 If successful, your guest booking flow is ready!');
}

testNewTemplates();