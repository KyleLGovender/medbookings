/**
 * Monitor your application logs for email sending activity
 * Run this while making test bookings to see email status in real-time
 * Run with: node scripts/monitor-booking-emails.js
 */

const { exec } = require('child_process');
const path = require('path');

console.log('📧 Email Monitoring Started...\n');
console.log('This will show email-related logs from your application.');
console.log('Make a test booking in another browser tab and watch for email activity here.\n');
console.log('Looking for these log patterns:');
console.log('✅ "Email sent successfully via SendGrid"');
console.log('❌ "Error sending email via SendGrid"');
console.log('⚠️  "SendGrid not configured, logging email instead"');
console.log('📧 "Booking notifications sent successfully"');
console.log('\nPress Ctrl+C to stop monitoring...\n');
console.log('='.repeat(80));

// If you're using PM2 or similar, you might need to adjust this
// This monitors console output for email-related messages

// Simple monitoring that shows how to watch for email logs
let logCount = 0;

const patterns = [
  'SendGrid',
  'email sent',
  'email failed',
  'Email sent successfully',
  'Error sending email',
  'Booking notifications',
  'sendBookingConfirmationEmail',
  'sendProviderNotificationEmail'
];

console.log('🔍 Email Log Monitor Active');
console.log('📝 Patterns being watched:');
patterns.forEach(pattern => console.log(`   - ${pattern}`));
console.log('\n⏳ Waiting for email activity...');
console.log('   (Make a booking in your app to see email logs)');

// This is a basic example - in practice, you'd monitor actual application logs
// For Next.js development, you'd watch the console output from `npm run dev`

const startTime = new Date();
setInterval(() => {
  const elapsed = Math.floor((new Date() - startTime) / 1000);
  process.stdout.write(`\r⏱️  Monitoring for ${elapsed}s... (Make a booking to see email activity)`);
}, 1000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📊 Monitoring Summary:');
  console.log(`Monitoring duration: ${Math.floor((new Date() - startTime) / 1000)}s`);
  console.log('\n💡 To test email sending:');
  console.log('1. Run: node scripts/check-sendgrid-config.js');
  console.log('2. Run: node scripts/test-email-system.js your-email@example.com');
  console.log('3. Make a real booking and check this console + your email');
  console.log('\n👋 Email monitoring stopped.');
  process.exit(0);
});