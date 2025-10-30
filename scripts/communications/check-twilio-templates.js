/**
 * Script to check current Twilio WhatsApp templates
 * Run with: node scripts/communications/check-twilio-templates.js
 */

require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Missing Twilio credentials in environment variables');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function checkTemplates() {
  try {
    console.log('🔍 Checking current Twilio WhatsApp templates...\n');

    // Get all content templates
    const templates = await client.content.v1.contents.list();

    console.log(`📋 Found ${templates.length} content templates:\n`);

    const relevantTemplates = templates.filter(template => {
      // Look for templates that might be used for bookings
      const name = template.friendlyName?.toLowerCase() || '';
      const types = template.types || {};

      return name.includes('booking') ||
             name.includes('appointment') ||
             name.includes('confirmation') ||
             name.includes('notification') ||
             Object.keys(types).some(key => key.includes('whatsapp'));
    });

    if (relevantTemplates.length === 0) {
      console.log('⚠️  No booking-related templates found. Let\'s check specific template IDs used in your code...\n');

      // Check the specific template IDs used in the code
      const templateIdsToCheck = [
        'HX8bfd0fc829de1adfe41f2e526d42cabf', // Guest confirmation
        'HX7b7542c849bf762b63fc38dcb069f6f1', // Provider notification
        'HXd872a8922fc1bffd95bb57e4c702dc9e', // Patient WhatsApp (from existing code)
        'HXd4581d3971aba1d4c6343c97e5c5cf2e', // Provider WhatsApp (from existing code)
        'HX4f483e7980984dd42aabf49b2cfdf537'  // Provider confirmation (from existing code)
      ];

      for (const templateId of templateIdsToCheck) {
        try {
          const template = await client.content.v1.contents(templateId).fetch();
          console.log(`✅ Template ${templateId}:`);
          console.log(`   Name: ${template.friendlyName}`);
          console.log(`   Status: ${template.approvalRequests?.[0]?.status || 'Unknown'}`);
          console.log(`   Language: ${template.language}`);

          // Check WhatsApp template structure
          if (template.types?.['twilio/text']) {
            const textBody = template.types['twilio/text'].body;
            console.log(`   Variables: ${(textBody.match(/\{\{\d+\}\}/g) || []).length} found`);
            console.log(`   Preview: ${textBody.substring(0, 100)}...`);
          }
          console.log('');
        } catch (error) {
          console.log(`❌ Template ${templateId}: ${error.message}`);
        }
      }
    } else {
      // Display relevant templates
      for (const template of relevantTemplates) {
        console.log(`📄 ${template.friendlyName}`);
        console.log(`   SID: ${template.sid}`);
        console.log(`   Language: ${template.language}`);
        console.log(`   Status: ${template.approvalRequests?.[0]?.status || 'Unknown'}`);

        if (template.types?.['twilio/text']) {
          const textBody = template.types['twilio/text'].body;
          console.log(`   Variables: ${(textBody.match(/\{\{\d+\}\}/g) || []).length} found`);
          console.log(`   Preview: ${textBody.substring(0, 100)}...`);
        }
        console.log('');
      }
    }

    console.log('\n📋 **Next Steps:**');
    console.log('1. Review the templates above');
    console.log('2. Check if variable counts match your needs (8 for guest, 9 for provider)');
    console.log('3. If templates need updates, I\'ll help you create new ones');

  } catch (error) {
    console.error('❌ Error checking templates:', error.message);

    if (error.code === 20003) {
      console.log('\n💡 This might be a permissions issue. Make sure your Twilio account has:');
      console.log('   - WhatsApp enabled');
      console.log('   - Content API access');
    }
  }
}

checkTemplates();