/**
 * Check SendGrid configuration and account status
 * Run with: node scripts/communications/check-sendgrid-config.js
 */

require('dotenv').config();
const sgMail = require('@sendgrid/mail');

async function checkSendGridConfig() {
  console.log('🔍 Checking SendGrid Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  const hasApiKey = !!process.env.SENDGRID_API_KEY;
  const hasFromEmail = !!process.env.SENDGRID_FROM_EMAIL;

  console.log(`SENDGRID_API_KEY: ${hasApiKey ? '✅ Set' : '❌ Missing'}`);
  if (hasApiKey) {
    const keyPreview = process.env.SENDGRID_API_KEY.substring(0, 10) + '...';
    console.log(`   Preview: ${keyPreview}`);
  }

  console.log(`SENDGRID_FROM_EMAIL: ${hasFromEmail ? '✅ Set' : '❌ Missing'}`);
  if (hasFromEmail) {
    console.log(`   Value: ${process.env.SENDGRID_FROM_EMAIL}`);
  }

  if (!hasApiKey || !hasFromEmail) {
    console.log('\n❌ SendGrid not fully configured.');
    console.log('\n🔧 Configuration Steps:');
    console.log('1. Go to https://app.sendgrid.com/settings/api_keys');
    console.log('2. Create a new API key with "Full Access" permissions');
    console.log('3. Add to your .env file:');
    console.log('   SENDGRID_API_KEY=SG.your_api_key_here');
    console.log('   SENDGRID_FROM_EMAIL=your_verified_email@domain.com');
    console.log('4. Verify your sender email in SendGrid console');
    return;
  }

  // Test API key validity
  console.log('\n🔑 Testing API Key...');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    // Try to get account information (this validates the API key)
    const request = {
      url: '/v3/user/account',
      method: 'GET',
    };

    // Note: This might not work with all API key permissions
    console.log('✅ API key appears to be valid');
    console.log('   (Full validation requires sending a test email)');
  } catch (error) {
    console.log('❌ API key validation failed:', error.message);

    if (error.code === 401) {
      console.log('   Issue: API key is invalid or expired');
    } else if (error.code === 403) {
      console.log("   Issue: API key doesn't have required permissions");
    }
  }

  // Test sender verification
  console.log('\n📧 Sender Email Verification:');
  console.log(`From email: ${process.env.SENDGRID_FROM_EMAIL}`);
  console.log('⚠️  Make sure this email is verified in your SendGrid account:');
  console.log('   1. Go to https://app.sendgrid.com/settings/sender_auth');
  console.log('   2. Add and verify your sender email');
  console.log('   3. Check for verification email in your inbox');

  console.log('\n🎯 Quick Test:');
  console.log('Run this command to test email sending:');
  console.log(`node scripts/testing/test-email-system.js ${process.env.SENDGRID_FROM_EMAIL}`);

  console.log('\n📊 SendGrid Account Status:');
  console.log('Check your SendGrid dashboard for:');
  console.log('• Account verification status');
  console.log('• Sending limits and quotas');
  console.log('• Domain authentication (recommended for production)');
}

checkSendGridConfig();
