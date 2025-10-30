/**
 * Script to create or update Twilio WhatsApp templates for guest booking flow
 * Run with: node scripts/communications/create-or-update-templates.js
 */

require('dotenv').config();
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function createOrUpdateTemplates() {
  console.log('🔧 Creating/Updating Twilio templates for guest booking flow...\n');

  // Template configurations
  const templates = [
    {
      friendlyName: 'guest_booking_confirmation_optimized',
      language: 'en',
      contentFile: path.join(__dirname, '../twilio-templates/guest-booking-confirmation.txt'),
      purpose: 'Guest Booking Confirmation',
      existingId: 'HX8bfd0fc829de1adfe41f2e526d42cabf', // Your current template
      variables: 8
    },
    {
      friendlyName: 'provider_booking_notification_optimized',
      language: 'en',
      contentFile: path.join(__dirname, '../twilio-templates/provider-booking-notification.txt'),
      purpose: 'Provider Booking Notification',
      existingId: 'HX7b7542c849bf762b63fc38dcb069f6f1', // Your current template
      variables: 9
    }
  ];

  for (const templateConfig of templates) {
    try {
      console.log(`📋 Processing: ${templateConfig.purpose}`);

      // Read template content
      const templateContent = fs.readFileSync(templateConfig.contentFile, 'utf8');
      console.log(`✅ Loaded template content (${templateConfig.variables} variables expected)`);

      // Check if we should create new or update existing
      console.log(`\n**Template Content Preview:**`);
      console.log(templateContent.substring(0, 200) + '...');
      console.log(`\n**Variable Mapping:**`);

      if (templateConfig.purpose === 'Guest Booking Confirmation') {
        console.log('{{1}}: Guest name');
        console.log('{{2}}: Provider name');
        console.log('{{3}}: Appointment date');
        console.log('{{4}}: Appointment time');
        console.log('{{5}}: Service type');
        console.log('{{6}}: Location');
        console.log('{{7}}: Booking reference');
        console.log('{{8}}: Duration');
      } else {
        console.log('{{1}}: Provider name');
        console.log('{{2}}: Guest name');
        console.log('{{3}}: Appointment date');
        console.log('{{4}}: Appointment time');
        console.log('{{5}}: Service type');
        console.log('{{6}}: Location');
        console.log('{{7}}: Booking reference');
        console.log('{{8}}: Guest phone');
        console.log('{{9}}: Duration');
      }

      // Count variables in template
      const variableCount = (templateContent.match(/\{\{\d+\}\}/g) || []).length;
      console.log(`\n🔢 Variables found in template: ${variableCount}`);

      if (variableCount === templateConfig.variables) {
        console.log('✅ Variable count matches expected!');
      } else {
        console.log('⚠️  Variable count mismatch!');
      }

      // Create the template
      console.log('\n🚀 Creating new optimized template...');

      const templateData = {
        friendlyName: templateConfig.friendlyName,
        language: templateConfig.language,
        types: {
          'twilio/text': {
            body: templateContent
          }
        }
      };

      const newTemplate = await client.content.v1.contents.create(templateData);

      console.log(`✅ Created new template: ${newTemplate.sid}`);
      console.log(`   Name: ${newTemplate.friendlyName}`);
      console.log(`   Status: Pending approval`);

      console.log('\n📝 **Action Required:**');
      console.log('1. Go to Twilio Console → Messaging → Content Templates');
      console.log(`2. Find template: ${newTemplate.friendlyName}`);
      console.log('3. Submit for WhatsApp approval');
      console.log('4. Once approved, update your code to use the new template ID');

      console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
      console.log(`❌ Error processing ${templateConfig.purpose}: ${error.message}`);

      if (error.code === 50003) {
        console.log('💡 This might be a quota or permissions issue.');
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }
  }

  console.log('🎯 **Summary:**');
  console.log('1. New optimized templates have been created');
  console.log('2. You need to submit them for WhatsApp approval in Twilio Console');
  console.log('3. Once approved, update the template IDs in your WhatsApp integration');
  console.log('4. Test the new templates with a booking');
}

createOrUpdateTemplates();