/**
 * Test script for booking notifications
 * Run with: node scripts/testing/test-booking-notifications.js +27XXXXXXXXX
 */

require('dotenv').config();

// Import your WhatsApp functions
const {
  sendGuestBookingWhatsApp,
  sendProviderBookingWhatsApp,
} = require('../src/features/communications/lib/whatsapp-templates.ts');

async function testNotifications() {
  const testPhone = process.argv[2];

  if (!testPhone) {
    console.log('Usage: node scripts/testing/test-booking-notifications.js +27XXXXXXXXX');
    process.exit(1);
  }

  console.log('🧪 Testing booking notifications...\n');

  const testBooking = {
    bookingId: 'test-booking-12345',
    providerName: 'Dr. John Smith',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // +30 min
    serviceType: 'General Consultation',
    location: 'Cape Town Medical Center',
    guestName: 'Test Patient',
    guestPhone: testPhone,
    duration: 30,
  };

  try {
    console.log('📱 Testing guest WhatsApp notification...');
    await sendGuestBookingWhatsApp(testPhone, testBooking);
    console.log('✅ Guest notification sent successfully');

    console.log('\n📱 Testing provider WhatsApp notification...');
    await sendProviderBookingWhatsApp(testPhone, testBooking);
    console.log('✅ Provider notification sent successfully');

    console.log('\n🎉 All tests completed! Check your WhatsApp for the messages.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotifications();
